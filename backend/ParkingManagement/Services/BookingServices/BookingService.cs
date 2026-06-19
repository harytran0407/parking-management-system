<<<<<<< HEAD
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
        // Spam check: block if they cancelled >= 3 unpaid bookings in the last 24 hours
        var checkTime = DateTime.UtcNow.AddHours(-24);
        var spamCancellationsLast24h = await _context.Bookings
            .Include(b => b.Payments)
            .Where(b => b.VehicleUserId == userId 
                        && b.Status == "CANCELLED" 
                        && b.BookingTime >= checkTime)
            .ToListAsync();

        int spamCount = 0;
        foreach (var b in spamCancellationsLast24h)
        {
            if (b.Notes == "CANCELLED_EARLY")
            {
                continue;
            }

            bool wasPaid = b.Payments.Any(p => p.Status == "SUCCESS" && p.PaymentType == "BOOKING");
            if (!wasPaid)
            {
                spamCount++;
            }
        }

        if (spamCount >= 3)
        {
            throw new InvalidOperationException("Tài khoản của bạn tạm thời bị khóa tính năng đặt chỗ trước trong 24 giờ do hủy lịch quá 3 lần/ngày.");
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
=======
﻿using ParkingManagement.DTOs.Booking;
using ParkingManagement.Models;
using ParkingManagement.Repositories;

namespace ParkingManagement.Services.BookingServices;

public interface IBookingService
{
    Task<BookingPriceResponse> GetPriceEstimateAsync(BookingPriceRequest request);
    Task<BookingResponse> CreateBookingAsync(string userId, CreateBookingRequest request);
    Task<List<BookingResponse>> GetMyBookingsAsync(string userId);
    Task<BookingResponse> CancelBookingAsync(string bookingId, string userId);
}

public class BookingService : IBookingService
{
    private readonly IBookingServiceRepository _repo;

    // Booking expires sau 30 phút nếu không check-in
    private const int BookingExpiryMinutes = 30;
    // Tối thiểu phải book trước 30 phút
    private const int MinBookingAdvanceMinutes = 30;

    public BookingService(IBookingServiceRepository repo)
    {
        _repo = repo;
    }

    // ── AC2: Price recalculates in realtime ───────────────────────────────────

    public async Task<BookingPriceResponse> GetPriceEstimateAsync(BookingPriceRequest request)
    {
        // AC3: Cannot select time in the past
        if (request.ExpectedArrival <= DateTime.UtcNow)
            throw new ArgumentException("Expected arrival time cannot be in the past");

        var slot = await _repo.GetSlotWithZoneAsync(request.SlotId)
            ?? throw new KeyNotFoundException($"Slot '{request.SlotId}' not found");

        if (slot.Status != "AVAILABLE" && slot.Status != "RESERVED")
            throw new InvalidOperationException($"Slot '{request.SlotId}' is not available for booking");

        int vehicleTypeId = slot.Zone.VehicleTypeId;
        var policy = await _repo.GetActivePolicyAsync(vehicleTypeId)
            ?? throw new InvalidOperationException("No pricing policy found for this vehicle type");

        // Estimated fee = base price (1 giờ đầu)
        decimal estimatedFee = policy.BasePrice;

        return new BookingPriceResponse
        {
            SlotId = slot.SlotId,
            SlotName = slot.SlotName,
            VehicleTypeName = slot.Zone.VehicleType.VehicleTypeName,
            ExpectedArrival = request.ExpectedArrival,
            BasePrice = policy.BasePrice,
            HourlyRate = policy.HourlyRate,
            EstimatedFee = estimatedFee,
            FeeNote = $"Base price covers first hour. Additional hours charged at {policy.HourlyRate:N0} VND/hour."
        };
    }

    // ── POST: Create booking ──────────────────────────────────────────────────

    public async Task<BookingResponse> CreateBookingAsync(string userId, CreateBookingRequest request)
    {
        // AC3: Cannot select time in the past
        if (request.ExpectedArrival <= DateTime.UtcNow)
            throw new ArgumentException("Expected arrival time cannot be in the past");

        // AC4: Validate minimum booking duration — phải book trước ít nhất 30 phút
        if (request.ExpectedArrival < DateTime.UtcNow.AddMinutes(MinBookingAdvanceMinutes))
            throw new ArgumentException($"Booking must be made at least {MinBookingAdvanceMinutes} minutes in advance");

        var slot = await _repo.GetSlotWithZoneAsync(request.SlotId)
            ?? throw new KeyNotFoundException($"Slot '{request.SlotId}' not found");

        if (slot.Status != "AVAILABLE")
            throw new InvalidOperationException($"Slot '{request.SlotId}' is not available");

        var vehicle = await _repo.GetVehicleAsync(request.VehicleId, userId)
            ?? throw new KeyNotFoundException($"Vehicle {request.VehicleId} not found or does not belong to you");

        // Check vehicle type khớp với zone
        if (vehicle.VehicleTypeId != slot.Zone.VehicleTypeId)
            throw new InvalidOperationException(
                $"Vehicle type does not match slot zone. This zone is for {slot.Zone.VehicleType.VehicleTypeName}");

        // Check conflict booking
        bool hasConflict = await _repo.HasConflictingBookingAsync(request.SlotId, request.ExpectedArrival);
        if (hasConflict)
            throw new InvalidOperationException("This slot already has a booking around that time");

        var policy = await _repo.GetActivePolicyAsync(slot.Zone.VehicleTypeId);

        var booking = new Booking
        {
            BookingId = "BK_" + DateTime.UtcNow.ToString("yyMMddHHmmss") + new Random().Next(100, 999),
            VehicleUserId = userId,
            VehicleId = request.VehicleId,
            SlotId = request.SlotId,
            ExpectedArrival = request.ExpectedArrival,
            ExpiredAt = request.ExpectedArrival.AddMinutes(BookingExpiryMinutes),
            BookingTime = DateTime.UtcNow,
            Status = "PENDING",
            Notes = request.Notes
        };

        var created = await _repo.CreateAsync(booking);

        return ToResponse(created, slot, policy?.BasePrice ?? 0);
    }

    // ── GET: My bookings ──────────────────────────────────────────────────────

    public async Task<List<BookingResponse>> GetMyBookingsAsync(string userId)
    {
        var bookings = await _repo.GetByUserAsync(userId);
        return bookings.Select(b => ToResponse(b, b.Slot, 0)).ToList();
    }

    // ── Cancel ────────────────────────────────────────────────────────────────

    public async Task<BookingResponse> CancelBookingAsync(string bookingId, string userId)
    {
        var booking = await _repo.GetByIdAsync(bookingId, userId)
            ?? throw new KeyNotFoundException($"Booking '{bookingId}' not found");

        if (booking.Status == "COMPLETED" || booking.Status == "CANCELLED")
            throw new InvalidOperationException($"Cannot cancel booking with status '{booking.Status}'");

        booking.Status = "CANCELLED";
        await _repo.UpdateAsync(booking);

        return ToResponse(booking, booking.Slot, 0);
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private static BookingResponse ToResponse(Booking b, ParkingSlot? slot, decimal estimatedFee) => new()
    {
        BookingId = b.BookingId,
        SlotId = b.SlotId,
        SlotName = slot?.SlotName,
        FloorNumber = slot?.Zone?.FloorNumber,
        ZoneName = slot?.Zone?.ZoneName,
        VehicleId = b.VehicleId,
        ExpectedArrival = b.ExpectedArrival,
        ExpiredAt = b.ExpiredAt,
        BookingTime = b.BookingTime,
        Status = b.Status,
        Notes = b.Notes,
        EstimatedFee = estimatedFee
    };
>>>>>>> origin/main
}
