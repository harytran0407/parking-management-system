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
            localVnTime = DateTime.SpecifyKind(localVnTime, DateTimeKind.Unspecified);

        return TimeZoneInfo.ConvertTimeToUtc(localVnTime, _vnTz);
    }

    private readonly AppDbContext _context;
    private readonly IParkingRepository _parkingRepo;

    public BookingService(AppDbContext context, IParkingRepository parkingRepo)
    {
        _context = context;
        _parkingRepo = parkingRepo;
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
        decimal basePrice = policy?.BasePrice ?? 15000m;
        decimal hourlyRate = policy?.HourlyRate ?? 2000m;

        var vehicleType = await _context.VehicleTypes.FindAsync(request.VehicleTypeId);
        string vehicleTypeName = vehicleType?.VehicleTypeName ?? "Unknown";

        return new BookingPriceResponse
        {
            SlotId = "",
            SlotName = "Assigned at Check-in",
            VehicleTypeName = vehicleTypeName,
            ExpectedArrival = request.ExpectedArrival,
            ExpiredAt = expiredAt,
            BasePrice = basePrice,
            HourlyRate = hourlyRate,
            EstimatedFee = estimatedFee,
            FeeNote = $"Base Price: {basePrice:N0} VND for 1st hour, then {hourlyRate:N0} VND/hour."
        };
    }

    // ─── CREATE BOOKING ─────────────────────────────────

    public async Task<BookingResponse> CreateBookingAsync(string userId, CreateBookingRequest request)
    {
        var checkTime = DateTime.UtcNow.AddHours(-24);

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
        var startOfToday = DateTime.UtcNow.Date;                // UTC midnight — safe cross-timezone (VN is UTC+7 so booking at 00:00 VN = 17:00 prev UTC day; using a 24-hour rolling window via checkTime is more accurate)
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

        // Validate license plate format and check for duplicate bookings
        var cleanPlate = request.LicensePlate.Replace("-", "").Replace(".", "").Replace(" ", "").ToUpper();

        var isOverlappingBookingExists = await _context.Bookings
            .AnyAsync(b => (b.Status == "PENDING" || b.Status == "CONFIRMED")
                        && b.ExpectedArrival < expiredAt
                        && request.ExpectedArrival < b.ExpiredAt
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
                ZoneId = null, // Assigned at check-in
                ExpectedArrival = request.ExpectedArrival,
                ExpiredAt = expiredAt,
                BookingTime = DateTime.UtcNow,
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
        await AutoCancelExpiredBookingsAsync(userId);

        var bookings = await _context.Bookings
            .Include(b => b.VehicleType)
            .Include(b => b.Zone)
            .Include(b => b.Payments)
            .Include(b => b.ParkingSessions)
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
            // Tìm zone phù hợp với vehicle type để hoàn trả (booking không nhất thiết gắn với zone cụ thể lúc tạo)
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

    // ─── DASHBOARD STATS ───────────────────────────────────────────────────────

    public async Task<BookingDashboardStatsResponse> GetBookingStatsAsync(string userId)
    {
        await AutoCancelExpiredBookingsAsync(userId);

        var totalBookings = await _context.Bookings.CountAsync(b => b.VehicleUserId == userId);

        var today = DateTime.UtcNow;
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
        await AutoCancelExpiredBookingsAsync(userId);

        var activeBookings = await _context.Bookings
            .Include(b => b.VehicleType)
            .Include(b => b.Zone)
            .Include(b => b.Payments)
            .Include(b => b.ParkingSessions)
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
        await AutoCancelExpiredBookingsAsync(userId);

        var historyBookings = await _context.Bookings
            .Include(b => b.VehicleType)
            .Include(b => b.Zone)
            .Include(b => b.Payments)
            .Include(b => b.ParkingSessions)
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
            booking.Status = "COMPLETED";
        }
        await _context.SaveChangesAsync();

        return await MapToBookingResponseAsync(booking);
    }

    public async Task<BookingResponse> GetBookingByIdAsync(string bookingId, string userId)
    {
        await AutoCancelExpiredBookingsAsync(userId);

        var booking = await _context.Bookings
            .Include(b => b.VehicleType)
            .Include(b => b.Zone)
            .Include(b => b.Payments)
            .Include(b => b.ParkingSessions)
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

    private async Task AutoCancelExpiredBookingsAsync(string userId)
    {
        var vnNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, _vnTz);
        var expiredBookings = await _context.Bookings
            .Where(b => b.VehicleUserId == userId
                        && (b.Status == "PENDING" || b.Status == "CONFIRMED")
                        && b.ExpectedArrival.AddMinutes(30) < vnNow)
            .ToListAsync();

        if (expiredBookings.Any())
        {
            foreach (var b in expiredBookings)
            {
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
        if (activeSession != null)
        {
            decimal overduePenaltyFee = ParkingCalculationHelper.CalculateOverdueFee(vnNow, expiredAt, policy);
            estimatedFee = originalEstimatedFee + overduePenaltyFee;
        }
        else if (b.Status?.Equals("COMPLETED", StringComparison.OrdinalIgnoreCase) == true)
        {
            var successPaymentSum = b.Payments?.Where(p => p.Status == "SUCCESS").Sum(p => (decimal?)p.AmountPaid) ?? 0m;
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
            var successPaymentSum = b.Payments?.Where(p => p.Status == "SUCCESS").Sum(p => (decimal?)p.AmountPaid) ?? 0m;
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
            VehicleType = b.VehicleType?.VehicleTypeName ?? "Car",
            VehicleTypeId = b.VehicleTypeId,
            SlotId = null,
            SlotName = "Assigned at Check-in",
            FloorNumber = b.Zone?.FloorNumber,
            ZoneName = b.Zone?.ZoneName,
            ExpectedArrival = b.ExpectedArrival,
            ExpiredAt = b.ExpiredAt,
            BookingTime = b.BookingTime,
            Status = activeSession != null ? "ACTIVE" : b.Status,
            IsLocked = activeSession != null ? activeSession.IsLocked : false,
            Notes = b.Notes,
            EstimatedFee = estimatedFee,
            DepositPaid = b.Payments?.Where(p => p.Status == "SUCCESS").Sum(p => (decimal?)p.AmountPaid) ?? 0m,
            QrCodeData = $"Ticket_Valid_BKG_{b.BookingId}_Plate_{b.LicensePlate}"
        };
    }
}