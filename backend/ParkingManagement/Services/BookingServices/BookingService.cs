using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ParkingManagement.Data;
using ParkingManagement.DTOs.Booking;
using ParkingManagement.Models;
using ParkingManagement.Repositories;
using ParkingManagement.Services.Helpers;
using ParkingManagement.Utils;

namespace ParkingManagement.Services.BookingServices;

public class BookingService : IBookingService
{
    private static readonly TimeZoneInfo _vnTz = TimeZoneInfo.FindSystemTimeZoneById(
        OperatingSystem.IsWindows() ? "SE Asia Standard Time" : "Asia/Ho_Chi_Minh");

    private static DateTime ToUtcFromVn(DateTime localVnTime)
    {
        if (localVnTime.Kind == DateTimeKind.Utc)
            return localVnTime;

        if (localVnTime.Kind == DateTimeKind.Local)
            return localVnTime.ToUniversalTime();

        return TimeZoneInfo.ConvertTimeToUtc(localVnTime, _vnTz);
    }

    private static DateTime ToVnTime(DateTime dt)
    {
        if (dt.Kind == DateTimeKind.Utc)
            return TimeZoneInfo.ConvertTimeFromUtc(dt, _vnTz);

        if (dt.Kind == DateTimeKind.Local)
            return TimeZoneInfo.ConvertTime(dt, _vnTz);

        return DateTime.SpecifyKind(dt, DateTimeKind.Unspecified);
    }

    private readonly AppDbContext _context;
    private readonly IParkingRepository _parkingRepo;
    private readonly PayOS.PayOSClient _payOS;

    public BookingService(AppDbContext context, IParkingRepository parkingRepo, PayOS.PayOSClient payOS)
    {
        _context = context;
        _parkingRepo = parkingRepo;
        _payOS = payOS;
    }

    // ─── GET PRICE ESTIMATE ────────────────────────────────────────────────────

    public async Task<BookingPriceResponse> GetPriceEstimateAsync(BookingPriceRequest request)
    {
        var expectedArrivalUtc = ToUtcFromVn(request.ExpectedArrival);

        if (expectedArrivalUtc < DateTime.UtcNow.AddMinutes(60))
            throw new ArgumentException("Thời gian đặt chỗ dự kiến phải trước ít nhất 60 phút tính từ thời điểm hiện tại.");

        if (expectedArrivalUtc > DateTime.UtcNow.AddHours(8))
            throw new ArgumentException("Thời gian đặt chỗ dự kiến chỉ được cách thời điểm hiện tại tối đa 8 tiếng.");

        DateTime expiredAt = request.ExpiredAt ?? request.ExpectedArrival.AddHours(2);

        if (expiredAt <= request.ExpectedArrival)
            throw new ArgumentException("Exit time must be after entry time.");

        var duration = expiredAt - request.ExpectedArrival;
        if (duration.TotalMinutes < 60)
            throw new ArgumentException("Thời lượng đặt chỗ tối thiểu phải là 1 tiếng.");

        var policy = await _parkingRepo.GetActivePricingPolicyByVehicleTypeAsync(request.VehicleTypeId);
        decimal estimatedFee = ParkingCalculationHelper.CalculateBookingEstimatedFee(request.ExpectedArrival, expiredAt, policy);
        decimal basePrice = policy?.BasePrice ?? (request.VehicleTypeId == 1 ? 5000m : 15000m);
        int baseHours = policy?.BaseHours ?? 4;
        decimal subsequentRate = policy?.SubsequentRate ?? 2000m;
        int subsequentHours = policy?.SubsequentHours ?? 1;
        decimal dailyMaxPrice = policy?.DailyMaxPrice ?? 50000m;
        decimal handlingFee = policy?.HandlingFee ?? 2000m;

        var vehicleType = await _context.VehicleTypes.FindAsync(request.VehicleTypeId);
        string vehicleTypeName = vehicleType?.VehicleTypeName ?? "Unknown";

        string feeNote = $"Base Price: {basePrice:N0} VND for first {baseHours} hours, then {subsequentRate:N0} VND per {subsequentHours} hour(s). Max daily: {dailyMaxPrice:N0} VND.";

        return new BookingPriceResponse
        {
            SlotId = "",
            SlotName = "Assigned at Check-in",
            VehicleTypeName = vehicleTypeName,
            ExpectedArrival = ToVnTime(request.ExpectedArrival),
            ExpiredAt = ToVnTime(expiredAt),
            BasePrice = basePrice,
            HourlyRate = subsequentRate,
            BaseHours = baseHours,
            SubsequentRate = subsequentRate,
            SubsequentHours = subsequentHours,
            DailyMaxPrice = dailyMaxPrice,
            HandlingFee = handlingFee,
            EstimatedFee = estimatedFee,
            FeeNote = feeNote
        };
    }

    // ─── CREATE BOOKING ─────────────────────────────────

    public async Task<BookingResponse> CreateBookingAsync(string userId, CreateBookingRequest request)
    {
        var user = await _context.Users.FindAsync(userId)
            ?? throw new UnauthorizedAccessException("Không tìm thấy người dùng.");

        if (string.IsNullOrWhiteSpace(user.Phone))
        {
            throw new InvalidOperationException("PHONE_REQUIRED");
        }

        await AutoCancelExpiredBookingsAsync();
        var vnNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, _vnTz);
        var checkTime = vnNow.AddHours(-24);

        // ── Spam lock: block if account cancelled >= 6 times in last 24 hours ──
        var cancellationsLast24h = await _context.Bookings
            .Where(b => b.VehicleUserId == userId
                        && b.Status == "CANCELLED"
                        && b.BookingTime >= checkTime
                        && b.Notes != "CANCELLED_EARLY")   // early-cancel (refunded) not counted
            .CountAsync();

        if (cancellationsLast24h >= 6)
        {
            throw new InvalidOperationException("Tài khoản của bạn tạm thời bị khóa tính năng đặt chỗ trước trong 24 giờ do hủy lịch quá 6 lần/ngày.");
        }

        // ── Daily booking limit: tối đa 6 lần đặt / ngày ────────────────────────
        var startOfToday = vnNow.Date;                // local midnight
        var bookingsLast24h = await _context.Bookings
            .CountAsync(b => b.VehicleUserId == userId && b.BookingTime >= checkTime);

        if (bookingsLast24h >= 6)
        {
            throw new InvalidOperationException("Bạn đã đạt giới hạn đặt chỗ tối đa 6 lần trong 24 giờ.");
        }

        // ── Concurrent CONFIRMED limit: tối đa 2 booking đang CONFIRMED / PENDING ─
        var activeBookingCount = await _context.Bookings
            .CountAsync(b => b.VehicleUserId == userId
                          && (b.Status == "CONFIRMED" || b.Status == "PENDING"));

        if (activeBookingCount >= 2)
        {
            throw new InvalidOperationException("Bạn chỉ được có tối đa 2 đặt chỗ đang hoạt động cùng lúc. Vui lòng hoàn thành hoặc hủy bớt đặt chỗ hiện tại.");
        }

        // Validate arrival time
        var expectedArrivalUtc = ToUtcFromVn(request.ExpectedArrival);

        if (expectedArrivalUtc < DateTime.UtcNow.AddMinutes(60))
            throw new ArgumentException("Thời gian đặt chỗ dự kiến phải trước ít nhất 60 phút tính từ thời điểm hiện tại.");

        if (expectedArrivalUtc > DateTime.UtcNow.AddHours(8))
            throw new ArgumentException("Thời gian đặt chỗ dự kiến chỉ được cách thời điểm hiện tại tối đa 8 tiếng.");

        DateTime expiredAt = request.ExpiredAt ?? request.ExpectedArrival.AddHours(2);

        if (expiredAt <= request.ExpectedArrival)
            throw new ArgumentException("Exit time must be after entry time.");

        var dur = expiredAt - request.ExpectedArrival;
        if (dur.TotalMinutes < 60)
            throw new ArgumentException("Thời lượng đặt chỗ tối thiểu phải là 1 tiếng.");

        // Check for vehicle type consistency for this license plate
        await ValidationUtils.ValidateVehicleTypeConsistencyAsync(_context, request.LicensePlate, request.VehicleTypeId);

        // Validate license plate format and check for duplicate bookings
        var cleanPlate = request.LicensePlate.Replace("-", "").Replace(".", "").Replace(" ", "").ToUpper();

        var vnExpectedArrival = ToVnTime(request.ExpectedArrival);
        var vnExpiredAt = ToVnTime(expiredAt);

        var isOverlappingBookingExists = await _context.Bookings
            .AnyAsync(b => (b.Status == "PENDING" || b.Status == "CONFIRMED")
                        && b.ExpectedArrival < vnExpiredAt
                        && vnExpectedArrival < b.ExpiredAt
                        && b.LicensePlate.Replace("-", "").Replace(".", "").Replace(" ", "").ToUpper() == cleanPlate);

        if (isOverlappingBookingExists)
        {
            throw new InvalidOperationException("Biển số xe này đã có lịch đặt chỗ trùng lặp trong khoảng thời gian đã chọn.");
        }

        // Validate license plate is not already active in parking lot
        if (await _parkingRepo.IsVehicleActiveInParkingAsync(request.LicensePlate))
            throw new InvalidOperationException("This vehicle is already inside the parking lot.");

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // Capacity check: ensure at least one zone has available capacity for this vehicle type
            var availableZone = await _parkingRepo.FindBestAvailableZoneAsync(request.VehicleTypeId);
            if (availableZone == null)
                throw new InvalidOperationException("Parking lot is currently full for this vehicle type. Cannot book at this time.");

            // ── 50% booking cap: chỉ cho phép booking chiếm tối đa 50% tổng capacity của loại xe ──
            // Tổng capacity (tất cả slot của loại xe, bất kể trạng thái)
            var totalCapacityForType = await _context.FloorZones
                .Where(z => z.VehicleTypeId == request.VehicleTypeId && z.Status == "ACTIVE")
                .SumAsync(z => z.Capacity);

            int bookingSlotCap = totalCapacityForType / 2; // làm tròn xuống

            // Số booking đang PENDING/CONFIRMED (đã chiếm slot)
            var currentBookedCount = await _context.Bookings
                .CountAsync(b => b.VehicleTypeId == request.VehicleTypeId
                              && (b.Status == "PENDING" || b.Status == "CONFIRMED"));

            if (currentBookedCount >= bookingSlotCap)
                throw new InvalidOperationException($"Hệ thống đã đạt giới hạn đặt chỗ trước ({bookingSlotCap} chỗ) cho loại xe này. Vui lòng thử lại sau.");

            var bookingId = "BKG-" + Guid.NewGuid().ToString("N").Substring(0, 10).ToUpper();

            // Compute estimated fee from DB pricing policy
            var policy = await _parkingRepo.GetActivePricingPolicyByVehicleTypeAsync(request.VehicleTypeId);
            decimal estimatedFee = ParkingCalculationHelper.CalculateBookingEstimatedFee(request.ExpectedArrival, expiredAt, policy);

            var booking = new Booking
            {
                BookingId = bookingId,
                VehicleUserId = userId,
                LicensePlate = request.LicensePlate.Trim().ToUpper(),
                VehicleTypeId = request.VehicleTypeId,
                ZoneId = availableZone.ZoneId, // Store the reserved zone
                ExpectedArrival = vnExpectedArrival,
                ExpiredAt = vnExpiredAt,
                BookingTime = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, _vnTz),
                Status = "PENDING",
                Notes = request.Notes
            };

            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync();

            // ── Trừ 1 slot trong AvailableCapacity của zone để tránh overbook ──
            await _parkingRepo.DecrementZoneCapacityAsync(availableZone.ZoneId);

            await transaction.CommitAsync();

            // Load VehicleType for mapping
            await _context.Entry(booking).Reference(b => b.VehicleType).LoadAsync();

            return await MapToBookingResponseAsync(booking);
        }
        catch (Exception)
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    // ─── GET MY BOOKINGS ───────────────────────────────────────────────────────

    public async Task<List<BookingResponse>> GetMyBookingsAsync(string userId)
    {
        await SyncPendingPayOsBookingsAsync(userId);
        await AutoCancelExpiredBookingsAsync();

        var bookings = await _context.Bookings
            .Include(b => b.VehicleType)
            .Include(b => b.Zone)
            .Include(b => b.Payments)
            .Include(b => b.ParkingSessions)
                .ThenInclude(ps => ps.Payments)
            .Where(b => b.VehicleUserId == userId)
            .OrderByDescending(b => b.BookingTime)
            .ToListAsync();

        var resultList = new List<BookingResponse>();
        foreach (var b in bookings)
        {
            resultList.Add(await MapToBookingResponseAsync(b));
        }
        return resultList;
    }

    // ─── CANCEL BOOKING ────────────────────────────────────────────────────────

    public async Task<BookingResponse> CancelBookingAsync(string bookingId, string userId)
    {
        var booking = await _context.Bookings
            .Include(b => b.VehicleType)
            .Include(b => b.Zone)
            .Include(b => b.Payments)
            .FirstOrDefaultAsync(b => b.BookingId == bookingId && b.VehicleUserId == userId)
            ?? throw new KeyNotFoundException("Booking not found.");

        if (booking.Status == "CANCELLED")
            throw new InvalidOperationException("Booking is already cancelled.");

        bool isCheckedIn = await _context.ParkingSessions.AnyAsync(s => s.BookingId == bookingId && s.Status == "ACTIVE");
        if (isCheckedIn || booking.Status == "COMPLETED")
        {
            throw new InvalidOperationException("Không thể hủy đặt chỗ khi xe đã check-in hoặc đặt chỗ đã hoàn thành.");
        }

        // If the booking is PENDING, we delete it from DB and increment capacity back.
        if (booking.Status == "PENDING")
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Remove the booking record
                _context.Bookings.Remove(booking);
                await _context.SaveChangesAsync();

                // Increment zone capacity back
                var zoneToRestore = booking.ZoneId.HasValue
                    ? await _context.FloorZones.FindAsync(booking.ZoneId.Value)
                    : await _context.FloorZones
                        .Where(z => z.VehicleTypeId == booking.VehicleTypeId && z.Status == "ACTIVE")
                        .OrderBy(z => z.FloorNumber)
                        .FirstOrDefaultAsync();

                if (zoneToRestore != null)
                    await _parkingRepo.IncrementZoneCapacityAsync(zoneToRestore.ZoneId);

                await transaction.CommitAsync();

                return await MapToBookingResponseAsync(booking);
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
        else
        {
            var vnNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, _vnTz);
            if (vnNow >= booking.ExpectedArrival)
            {
                throw new InvalidOperationException("Không thể hủy đặt chỗ khi đã quá giờ hẹn.");
            }

            var leadTime = booking.ExpectedArrival - vnNow;
            if (leadTime.TotalMinutes < 60)
            {
                throw new InvalidOperationException("Không thể hủy đặt chỗ khi thời gian tới giờ hẹn còn lại dưới 60 phút.");
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                booking.Status = "CANCELLED";
                booking.Notes = "CANCELLED_EARLY";

                await _context.SaveChangesAsync();

                // ── Hoàn lại slot vào AvailableCapacity của zone ──
                var zoneToRestore = booking.ZoneId.HasValue
                    ? await _context.FloorZones.FindAsync(booking.ZoneId.Value)
                    : await _context.FloorZones
                        .Where(z => z.VehicleTypeId == booking.VehicleTypeId && z.Status == "ACTIVE")
                        .OrderBy(z => z.FloorNumber)
                        .FirstOrDefaultAsync();

                if (zoneToRestore != null)
                    await _parkingRepo.IncrementZoneCapacityAsync(zoneToRestore.ZoneId);

                await transaction.CommitAsync();

                return await MapToBookingResponseAsync(booking);
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
    }

    // ─── DASHBOARD STATS ───────────────────────────────────────────────────────

    public async Task<BookingDashboardStatsResponse> GetBookingStatsAsync(string userId)
    {
        await SyncPendingPayOsBookingsAsync(userId);
        await AutoCancelExpiredBookingsAsync();

        var totalBookings = await _context.Bookings.CountAsync(b => b.VehicleUserId == userId);

        var today = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, _vnTz);
        var startOfMonth = new DateTime(today.Year, today.Month, 1);
        var thisMonthNew = await _context.Bookings
            .CountAsync(b => b.VehicleUserId == userId && b.BookingTime >= startOfMonth);

        // Count active sessions where LicensePlate matches any booking by this user
        var userPlates = await _context.Bookings
            .Where(b => b.VehicleUserId == userId)
            .Select(b => b.LicensePlate)
            .Distinct()
            .ToListAsync();

        var activeSessions = await _context.ParkingSessions
            .CountAsync(ps => userPlates.Contains(ps.LicensePlateIn) && ps.Status == "ACTIVE");

        var totalCost = await _context.Payments
            .Where(p => p.UserId == userId && p.Status == "SUCCESS")
            .SumAsync(p => (decimal?)p.AmountPaid) ?? 0m;

        return new BookingDashboardStatsResponse
        {
            TotalBookings = totalBookings,
            ThisMonthNew = thisMonthNew,
            ActiveSessions = activeSessions,
            TotalCost = totalCost
        };
    }

    // ─── GET ACTIVE BOOKINGS ───────────────────────────────────────────────────

    public async Task<List<BookingResponse>> GetActiveBookingsAsync(string userId)
    {
        await SyncPendingPayOsBookingsAsync(userId);
        await AutoCancelExpiredBookingsAsync();

        var activeBookings = await _context.Bookings
            .Include(b => b.VehicleType)
            .Include(b => b.Zone)
            .Include(b => b.Payments)
            .Include(b => b.ParkingSessions)
                .ThenInclude(ps => ps.Payments)
            .Where(b => b.VehicleUserId == userId && (b.Status == "PENDING" || b.Status == "CONFIRMED" || b.ParkingSessions.Any(ps => ps.Status == "ACTIVE")))
            .OrderBy(b => b.ExpectedArrival)
            .ToListAsync();

        var activeList = new List<BookingResponse>();
        foreach (var b in activeBookings)
            activeList.Add(await MapToBookingResponseAsync(b));
        return activeList;
    }

    // ─── GET BOOKING HISTORY ───────────────────────────────────────────────────

    public async Task<List<BookingResponse>> GetBookingHistoryAsync(string userId)
    {
        await SyncPendingPayOsBookingsAsync(userId);
        await AutoCancelExpiredBookingsAsync();

        var historyBookings = await _context.Bookings
            .Include(b => b.VehicleType)
            .Include(b => b.Zone)
            .Include(b => b.Payments)
            .Include(b => b.ParkingSessions)
                .ThenInclude(ps => ps.Payments)
            .Where(b => b.VehicleUserId == userId && ((b.Status == "COMPLETED" && !b.ParkingSessions.Any(ps => ps.Status == "ACTIVE")) || b.Status == "CANCELLED"))
            .OrderByDescending(b => b.BookingTime)
            .ToListAsync();

        var historyList = new List<BookingResponse>();
        foreach (var b in historyBookings)
            historyList.Add(await MapToBookingResponseAsync(b));
        return historyList;
    }



    // ─── PAY BOOKING (VNPAY only — no CASH) ───────────────────────────────────

    public async Task<BookingResponse> PayBookingAsync(string bookingId, string userId)
    {
        var booking = await _context.Bookings
            .Include(b => b.VehicleType)
            .Include(b => b.Zone)
            .Include(b => b.Payments)
            .Include(b => b.ParkingSessions)
                .ThenInclude(ps => ps.Payments)
            .FirstOrDefaultAsync(b => b.BookingId == bookingId && b.VehicleUserId == userId)
            ?? throw new KeyNotFoundException("Booking not found.");

        bool isParkedActive = booking.ParkingSessions.Any(ps => ps.Status == "ACTIVE");
        if (isParkedActive)
        {
            throw new InvalidOperationException("Phí quá giờ phải thanh toán bằng tiền mặt trực tiếp tại cổng check-out.");
        }
        if (booking.Status != "CONFIRMED" && booking.Status != "PENDING")
            throw new InvalidOperationException("Cannot pay for a booking that is not in active or confirmed status.");

        var responseDto = await MapToBookingResponseAsync(booking);
        var remainingAmount = responseDto.EstimatedFee - responseDto.DepositPaid;

        if (remainingAmount > 0)
        {
            var payment = new Payment
            {
                PaymentId = "PAY-" + Guid.NewGuid().ToString("N").Substring(0, 10).ToUpper(),
                PaymentType = "BOOKING",
                AmountDue = remainingAmount,
                AmountPaid = remainingAmount,
                PaymentMethod = "VNPAY", // Booking payments are VNPAY-only
                PaymentTime = DateTime.UtcNow,
                Status = "SUCCESS",
                BookingId = booking.BookingId,
                UserId = userId
            };
            _context.Payments.Add(payment);
        }

        if (!isParkedActive)
        {
            booking.Status = "CONFIRMED";
        }
        await _context.SaveChangesAsync();

        return await MapToBookingResponseAsync(booking);
    }

    public async Task<BookingResponse> GetBookingByIdAsync(string bookingId, string userId)
    {
        await SyncPendingPayOsBookingsAsync(userId);
        await AutoCancelExpiredBookingsAsync();

        var booking = await _context.Bookings
            .Include(b => b.VehicleType)
            .Include(b => b.Zone)
            .Include(b => b.Payments)
            .Include(b => b.ParkingSessions)
                .ThenInclude(ps => ps.Payments)
            .FirstOrDefaultAsync(b => b.BookingId == bookingId && b.VehicleUserId == userId)
            ?? throw new KeyNotFoundException("Booking not found.");

        return await MapToBookingResponseAsync(booking);
    }

    public async Task<bool> UnlockBookingAsync(string bookingId, string userId)
    {
        var session = await _context.ParkingSessions
            .Include(s => s.Booking)
            .FirstOrDefaultAsync(s => s.BookingId == bookingId && s.Status == "ACTIVE" && s.Booking!.VehicleUserId == userId);

        if (session == null)
            return false;

        session.IsLocked = false;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> LockBookingAsync(string bookingId, string userId)
    {
        var session = await _context.ParkingSessions
            .Include(s => s.Booking)
            .FirstOrDefaultAsync(s => s.BookingId == bookingId && s.Status == "ACTIVE" && s.Booking!.VehicleUserId == userId);

        if (session == null)
            return false;

        session.IsLocked = true;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<BookingCapacityStatusResponse> GetBookingCapacityStatusAsync(int vehicleTypeId)
    {
        await AutoCancelExpiredBookingsAsync();
        var totalCapacity = await _context.FloorZones
            .Where(z => z.VehicleTypeId == vehicleTypeId && z.Status == "ACTIVE")
            .SumAsync(z => z.Capacity);

        int bookingCap = totalCapacity / 2;

        var currentBooked = await _context.Bookings
            .CountAsync(b => b.VehicleTypeId == vehicleTypeId
                          && (b.Status == "CONFIRMED" || b.Status == "COMPLETED"));

        return new BookingCapacityStatusResponse
        {
            VehicleTypeId = vehicleTypeId,
            TotalCapacity = totalCapacity,
            BookingCap = bookingCap,
            CurrentBooked = currentBooked,
            IsFull = currentBooked >= bookingCap
        };
    }

    private async Task SyncPendingPayOsBookingsAsync(string userId)
    {
        var vnNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, _vnTz);
        
        var bookingsToSync = await _context.Bookings
            .Include(b => b.Payments)
            .Where(b => b.VehicleUserId == userId && b.Status == "PENDING")
            .ToListAsync();

        foreach (var booking in bookingsToSync)
        {
            var pendingPayOsPayment = booking.Payments
                .Where(p => p.PaymentMethod == "PAYOS" && p.Status == "PENDING")
                .OrderByDescending(p => p.PaymentTime)
                .FirstOrDefault();

            if (pendingPayOsPayment != null)
            {
                try
                {
                    string paymentId = pendingPayOsPayment.PaymentId;
                    string hexPart = paymentId.Replace("pay_", "");
                    long orderCode = Convert.ToInt64(hexPart, 16);

                    var payOsInfo = await _payOS.PaymentRequests.GetAsync(orderCode);
                    if (payOsInfo != null && payOsInfo.Status.ToString().Equals("PAID", StringComparison.OrdinalIgnoreCase))
                    {
                        pendingPayOsPayment.Status = "SUCCESS";
                        pendingPayOsPayment.TransactionId = "payos_" + Guid.NewGuid().ToString().Substring(0, 8).ToUpper();
                        pendingPayOsPayment.PaymentTime = vnNow;
                        pendingPayOsPayment.AmountPaid = payOsInfo.Amount;

                        booking.Status = "CONFIRMED";
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error syncing booking PayOS status: {ex.Message}");
                }
            }
        }
        
        await _context.SaveChangesAsync();
    }

    private async Task AutoCancelExpiredBookingsAsync()
    {
        var vnNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, _vnTz);
        var expiredBookings = await _context.Bookings
            .Where(b => (b.Status == "PENDING" && ((b.BookingTime.HasValue && b.BookingTime.Value.AddMinutes(5) < vnNow) || b.ExpectedArrival.AddMinutes(30) < vnNow))
                        || (b.Status == "CONFIRMED" && b.ExpectedArrival.AddMinutes(30) < vnNow))
            .ToListAsync();

        if (expiredBookings.Any())
        {
            foreach (var b in expiredBookings)
            {
                if (b.Status == "PENDING")
                {
                    b.Notes = "unpaid";
                }

                // Mark all expired bookings as CANCELLED instead of deleting,
                // to avoid FK constraint violation when payments are linked to the booking.
                b.Status = "CANCELLED";

                // Hoàn lại slot vào AvailableCapacity
                var zoneToRestore = b.ZoneId.HasValue
                    ? await _context.FloorZones.FindAsync(b.ZoneId.Value)
                    : await _context.FloorZones
                        .Where(z => z.VehicleTypeId == b.VehicleTypeId && z.Status == "ACTIVE")
                        .OrderBy(z => z.FloorNumber)
                        .FirstOrDefaultAsync();

                if (zoneToRestore != null)
                    await _parkingRepo.IncrementZoneCapacityAsync(zoneToRestore.ZoneId);
            }
            await _context.SaveChangesAsync();
        }
    }

    // ─── PRIVATE HELPER: MAP TO RESPONSE ──────────────────────────────────────

    private async Task<BookingResponse> MapToBookingResponseAsync(Booking b)
    {
        var policy = await _parkingRepo.GetActivePricingPolicyByVehicleTypeAsync(b.VehicleTypeId);

        var vnNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, _vnTz);
        var expiredAt = b.ExpiredAt ?? b.ExpectedArrival.AddHours(2);

        decimal originalEstimatedFee = ParkingCalculationHelper.CalculateBookingEstimatedFee(b.ExpectedArrival, expiredAt, policy);

        decimal estimatedFee = originalEstimatedFee;

        var activeSession = b.ParkingSessions?.FirstOrDefault(ps => ps.Status == "ACTIVE");
        
        var directPayments = b.Payments?.Where(p => p.Status == "SUCCESS").Sum(p => (decimal?)p.AmountPaid) ?? 0m;
        var sessionPayments = b.ParkingSessions?.SelectMany(ps => ps.Payments).Where(p => p.Status == "SUCCESS").Sum(p => (decimal?)p.AmountPaid) ?? 0m;
        var successPaymentSum = directPayments + sessionPayments;

        decimal earlyFee = 0;
        decimal penaltyFee = 0;
        DateTime? actualCheckIn = null;
        DateTime? actualCheckOut = null;

        var session = b.ParkingSessions?.FirstOrDefault();
        if (session != null)
        {
            try
            {
                string operatingHours = await _parkingRepo.GetOperatingHoursForDayAsync(b.ExpectedArrival);
                var checkOutTime = session.CheckOutTime ?? vnNow;

                var details = ParkingCalculationHelper.CalculateBookingFeeDetails(
                    session.CheckInTime,
                    checkOutTime,
                    b,
                    policy,
                    operatingHours
                );

                earlyFee = details.EarlyArrivalFee;
                penaltyFee = details.LateCheckoutFee;

                actualCheckIn = session.CheckInTime.HasValue
                    ? DateTime.SpecifyKind(TimeZoneInfo.ConvertTimeToUtc(session.CheckInTime.Value, _vnTz), DateTimeKind.Utc)
                    : (DateTime?)null;
                actualCheckOut = session.CheckOutTime.HasValue
                    ? DateTime.SpecifyKind(TimeZoneInfo.ConvertTimeToUtc(session.CheckOutTime.Value, _vnTz), DateTimeKind.Utc)
                    : (DateTime?)null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error calculating check-in/penalty details for booking {b.BookingId}: {ex.Message}");
            }
        }

        if (activeSession != null)
        {
            decimal overduePenaltyFee = ParkingCalculationHelper.CalculateOverdueFee(vnNow, expiredAt, policy);
            estimatedFee = originalEstimatedFee + overduePenaltyFee;
        }
        else if (b.Status?.Equals("COMPLETED", StringComparison.OrdinalIgnoreCase) == true)
        {
            if (successPaymentSum > 0)
            {
                estimatedFee = successPaymentSum;
            }
            else
            {
                estimatedFee = originalEstimatedFee;
            }
        }
        else
        {
            if (successPaymentSum > 0)
            {
                estimatedFee = successPaymentSum;
            }
            else
            {
                estimatedFee = originalEstimatedFee;
            }
        }


        return new BookingResponse
        {
            BookingId = b.BookingId,
            VehicleUserId = b.VehicleUserId ?? string.Empty,
            LicensePlate = b.LicensePlate ?? string.Empty,
            VehicleType = b.VehicleType?.VehicleTypeName ?? "Unknown",
            VehicleTypeId = b.VehicleTypeId,
            SlotId = null,
            SlotName = "Assigned at Check-in",
            FloorNumber = b.Zone?.FloorNumber,
            ZoneName = b.Zone?.ZoneName,
            ExpectedArrival = b.ExpectedArrival,
            ExpiredAt = b.ExpiredAt,
            // Đảm bảo BookingTime có DateTimeKind.Utc để JSON serializer thêm hậu tố 'Z',
            // giúp trình duyệt parse đúng múi giờ UTC thay vì hiểu nhầm thành giờ địa phương.
            // Vì BookingTime lưu theo giờ địa phương Việt Nam (UTC+7), ta chuyển lại sang UTC trước khi gắn nhãn.
            BookingTime = b.BookingTime.HasValue
                ? DateTime.SpecifyKind(TimeZoneInfo.ConvertTimeToUtc(b.BookingTime.Value, _vnTz), DateTimeKind.Utc)
                : (DateTime?)null,
            Status = activeSession != null ? "ACTIVE" : b.Status,
            IsLocked = activeSession != null ? activeSession.IsLocked : false,
            Notes = b.Notes,
            EstimatedFee = estimatedFee,
            DepositPaid = successPaymentSum,
            QrCodeData = $"Ticket_Valid_BKG_{b.BookingId}_Plate_{b.LicensePlate}",
            EarlyFee = earlyFee,
            PenaltyFee = penaltyFee,
            ActualCheckIn = actualCheckIn,
            ActualCheckOut = actualCheckOut,
            PaymentMethod = b.Payments?.FirstOrDefault(p => p.Status == "SUCCESS")?.PaymentMethod 
                ?? b.ParkingSessions?.SelectMany(ps => ps.Payments).FirstOrDefault(p => p.Status == "SUCCESS")?.PaymentMethod
        };
    }

    public async Task<List<StaffBookingResponse>> GetStaffBookingsAsync()
    {
        await AutoCancelExpiredBookingsAsync();

        var bookings = await _context.Bookings
            .Include(b => b.VehicleType)
            .Include(b => b.Zone)
            .Include(b => b.VehicleUser)
            .Include(b => b.ParkingSessions)
                .ThenInclude(ps => ps.Payments)
            .Include(b => b.Payments)
            .Where(b => b.Status != "CANCELLED")
            .OrderByDescending(b => b.BookingTime)
            .ToListAsync();

        var resultList = new List<StaffBookingResponse>();
        foreach (var b in bookings)
        {
            var bookingRes = await MapToBookingResponseAsync(b);

            decimal earlyFee = 0;
            decimal penaltyFee = 0;

            var session = b.ParkingSessions?.FirstOrDefault();
            if (session != null)
            {
                try
                {
                    var policy = await _parkingRepo.GetActivePricingPolicyByVehicleTypeAsync(b.VehicleTypeId);
                    string operatingHours = await _parkingRepo.GetOperatingHoursForDayAsync(b.ExpectedArrival);
                    var vnNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, _vnTz);
                    var checkOutTime = session.CheckOutTime ?? vnNow;

                    var details = ParkingCalculationHelper.CalculateBookingFeeDetails(
                        session.CheckInTime,
                        checkOutTime,
                        b,
                        policy,
                        operatingHours
                    );

                    earlyFee = details.EarlyArrivalFee;
                    penaltyFee = details.LateCheckoutFee;
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error calculating check-in/penalty details for booking {b.BookingId}: {ex.Message}");
                }
            }

            resultList.Add(new StaffBookingResponse
            {
                BookingId = b.BookingId,
                FullName = b.VehicleUser?.FullName,
                Phone = b.VehicleUser?.Phone,
                Email = b.VehicleUser?.Email,
                LicensePlate = b.LicensePlate,
                VehicleType = b.VehicleType?.VehicleTypeName ?? "Unknown",
                VehicleTypeId = b.VehicleTypeId,
                ExpectedArrival = b.ExpectedArrival,
                ExpiredAt = b.ExpiredAt,
                BookingTime = b.BookingTime.HasValue
                    ? DateTime.SpecifyKind(TimeZoneInfo.ConvertTimeToUtc(b.BookingTime.Value, _vnTz), DateTimeKind.Utc)
                    : (DateTime?)null,
                Status = bookingRes.Status,
                Notes = b.Notes,
                ZoneName = b.Zone?.ZoneName,
                FloorNumber = b.Zone?.FloorNumber,
                EstimatedFee = bookingRes.EstimatedFee,
                DepositPaid = bookingRes.DepositPaid,
                EarlyFee = earlyFee,
                PenaltyFee = penaltyFee,
                ActualCheckIn = session?.CheckInTime.HasValue == true
                    ? DateTime.SpecifyKind(TimeZoneInfo.ConvertTimeToUtc(session.CheckInTime.Value, _vnTz), DateTimeKind.Utc)
                    : (DateTime?)null,
                ActualCheckOut = session?.CheckOutTime.HasValue == true
                    ? DateTime.SpecifyKind(TimeZoneInfo.ConvertTimeToUtc(session.CheckOutTime.Value, _vnTz), DateTimeKind.Utc)
                    : (DateTime?)null
            });
        }
        return resultList;
    }
}