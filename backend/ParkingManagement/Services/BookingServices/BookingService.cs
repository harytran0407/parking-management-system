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
    private readonly AppDbContext _context;
    private readonly IParkingRepository _parkingRepo;

    public BookingService(AppDbContext context, IParkingRepository parkingRepo)
    {
        _context = context;
        _parkingRepo = parkingRepo;
    }

    // ─── FRIEND'S IMPLEMENTED METHOD: GET PRICE ESTIMATE (IMPROVED WITH VALIDATION & DB POLICIES) ──────────────────

    public async Task<BookingPriceResponse> GetPriceEstimateAsync(BookingPriceRequest request)
    {
        // ─── VALIDATION (AC3 & AC4 ADDED BY ANTIGRAVITY) ───
        if (request.ExpectedArrival < DateTime.UtcNow.AddMinutes(-10))
        {
            throw new ArgumentException("Expected arrival time cannot be in the past.");
        }

        DateTime expiredAt = request.ExpiredAt ?? request.ExpectedArrival.AddHours(2);

        if (expiredAt <= request.ExpectedArrival)
        {
            throw new ArgumentException("Exit time must be after entry time.");
        }

        var duration = expiredAt - request.ExpectedArrival;
        if (duration.TotalMinutes < 30)
        {
            throw new ArgumentException("Booking duration must be at least 30 minutes.");
        }

        string slotId = request.SlotId ?? "";
        if (string.IsNullOrEmpty(slotId))
        {
            // If slot is not selected, we fallback to default slot lookup or default info
            // For now, let's find a slot of type car (type id 2) as default
            var availableSlot = await _parkingRepo.FindFirstAvailableSlotAsync(2);
            slotId = availableSlot?.SlotId ?? throw new InvalidOperationException("No available slots for price estimate.");
        }

        var slot = await _context.ParkingSlots
            .Include(s => s.Zone)
            .ThenInclude(z => z.VehicleType)
            .FirstOrDefaultAsync(s => s.SlotId == slotId)
            ?? throw new KeyNotFoundException($"Parking slot {slotId} not found");

        decimal estimatedFee = 15000m;
        var billedHours = (int)Math.Ceiling(duration.TotalMinutes / 60.0);
        if (billedHours > 1)
        {
            estimatedFee += (billedHours - 1) * 2000m;
        }

        return new BookingPriceResponse
        {
            SlotId = slot.SlotId,
            SlotName = slot.SlotName,
            VehicleTypeName = slot.Zone.VehicleType.VehicleTypeName,
            ExpectedArrival = request.ExpectedArrival,
            ExpiredAt = expiredAt,
            BasePrice = 15000m,
            HourlyRate = 2000m,
            EstimatedFee = estimatedFee,
            FeeNote = "Base Price: 15,000 VND for 1st hour, then 2,000 VND/hour."
        };
    }

    // ─── FRIEND'S IMPLEMENTED METHOD: CREATE BOOKING (IMPROVED WITH TRANSACTION & VALIDATIONS) ─────────────────────

    public async Task<BookingResponse> CreateBookingAsync(string userId, CreateBookingRequest request)
    {
        // ─── VALIDATION (AC3 & AC4 ADDED BY ANTIGRAVITY) ───
        if (request.ExpectedArrival < DateTime.UtcNow.AddMinutes(-10))
        {
            throw new ArgumentException("Expected arrival time cannot be in the past.");
        }

        if (request.ExpiredAt.HasValue)
        {
            if (request.ExpiredAt.Value <= request.ExpectedArrival)
            {
                throw new ArgumentException("Exit time must be after entry time.");
            }

            var duration = request.ExpiredAt.Value - request.ExpectedArrival;
            if (duration.TotalMinutes < 30)
            {
                throw new ArgumentException("Booking duration must be at least 30 minutes.");
            }
        }

        // Verify vehicle ownership
        var vehicle = await _context.Vehicles
            .FirstOrDefaultAsync(v => v.VehicleId == request.VehicleId && v.VehicleUserId == userId)
            ?? throw new ArgumentException("Invalid vehicle selection. The vehicle does not belong to you.");

        using (var transaction = await _context.Database.BeginTransactionAsync())
        {
            try
            {
                // ─── AUTO-ASSIGN SLOT IF NULL (ADDED BY ANTIGRAVITY) ───
                string? slotId = request.SlotId;
                if (string.IsNullOrEmpty(slotId))
                {
                    var availableSlot = await _parkingRepo.FindFirstAvailableSlotAsync(vehicle.VehicleTypeId);
                    slotId = availableSlot?.SlotId ?? throw new InvalidOperationException("No available slots for this vehicle type.");
                }

                var slot = await _context.ParkingSlots
                    .Include(s => s.Zone)
                    .ThenInclude(z => z.VehicleType)
                    .FirstOrDefaultAsync(s => s.SlotId == slotId)
                    ?? throw new KeyNotFoundException("Parking slot not found.");

                if (slot.Status != "AVAILABLE")
                {
                    throw new InvalidOperationException("Slot is not available. Please choose another one.");
                }

                // Reserve the slot
                slot.Status = "RESERVED";
                slot.LastUpdated = DateTime.UtcNow;

                var bookingId = "BKG-" + Guid.NewGuid().ToString("N").Substring(0, 10).ToUpper();

                // Expiry defaults to 2 hours after arrival if not provided
                DateTime expiredAt = request.ExpiredAt ?? request.ExpectedArrival.AddHours(2);

                var booking = new Booking
                {
                    BookingId = bookingId,
                    VehicleUserId = userId,
                    VehicleId = request.VehicleId,
                    SlotId = slotId,
                    ExpectedArrival = request.ExpectedArrival,
                    ExpiredAt = expiredAt,
                    BookingTime = DateTime.UtcNow,
                    Status = "CONFIRMED",
                    Notes = request.Notes
                };

                _context.Bookings.Add(booking);

                // Add payment record (Reservation deposit fee is fixed at 15,000 VND)
                var payment = new Payment
                {
                    PaymentId = "PAY-" + Guid.NewGuid().ToString("N").Substring(0, 10).ToUpper(),
                    PaymentType = "BOOKING",
                    AmountDue = 15000m, /* MODIFIED BY ANTIGRAVITY: 15,000 VND */
                    AmountPaid = 15000m, /* MODIFIED BY ANTIGRAVITY: 15,000 VND */
                    PaymentMethod = "VNPAY",
                    PaymentTime = DateTime.UtcNow,
                    Status = "SUCCESS",
                    BookingId = bookingId,
                    UserId = userId
                };

                _context.Payments.Add(payment);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Explicitly load relations for mapping response
                await _context.Entry(booking).Reference(b => b.Vehicle).LoadAsync();
                await _context.Entry(booking).Reference(b => b.Slot).LoadAsync();
                if (booking.Slot != null)
                {
                    await _context.Entry(booking.Slot).Reference(s => s.Zone).LoadAsync();
                    if (booking.Slot.Zone != null)
                    {
                        await _context.Entry(booking.Slot.Zone).Reference(z => z.VehicleType).LoadAsync();
                        if (booking.Slot.Zone.VehicleType != null)
                        {
                            await _context.Entry(booking.Slot.Zone.VehicleType).Collection(vt => vt.PricingPolicies).LoadAsync();
                        }
                    }
                }

                return MapToBookingResponse(booking);
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
    }

    // ─── FRIEND'S IMPLEMENTED METHOD: GET MY BOOKINGS ─────────────────────────────────────────────────────────────

    public async Task<List<BookingResponse>> GetMyBookingsAsync(string userId)
    {
        var bookings = await _context.Bookings
            .Include(b => b.Vehicle)
                .ThenInclude(v => v.VehicleType)
            .Include(b => b.Slot)
                .ThenInclude(s => s.Zone)
                    .ThenInclude(z => z.VehicleType)
                        .ThenInclude(vt => vt.PricingPolicies)
            .Include(b => b.Payments)
            .Where(b => b.VehicleUserId == userId)
            .OrderByDescending(b => b.BookingTime)
            .ToListAsync();

        return bookings.Select(MapToBookingResponse).ToList();
    }

    // ─── FRIEND'S IMPLEMENTED METHOD: CANCEL BOOKING ──────────────────────────────────────────────────────────────

    public async Task<BookingResponse> CancelBookingAsync(string bookingId, string userId)
    {
        var booking = await _context.Bookings
            .Include(b => b.Vehicle)
                .ThenInclude(v => v.VehicleType)
            .Include(b => b.Slot)
                .ThenInclude(s => s.Zone)
                    .ThenInclude(z => z.VehicleType)
                        .ThenInclude(vt => vt.PricingPolicies)
            .Include(b => b.Payments)
            .FirstOrDefaultAsync(b => b.BookingId == bookingId && b.VehicleUserId == userId)
            ?? throw new KeyNotFoundException("Booking not found.");

        if (booking.Status == "CANCELLED")
        {
            throw new InvalidOperationException("Booking is already cancelled.");
        }

        if (booking.Status == "COMPLETED")
        {
            throw new InvalidOperationException("Cannot cancel a completed booking.");
        }

        using (var transaction = await _context.Database.BeginTransactionAsync())
        {
            try
            {
                booking.Status = "CANCELLED";

                if (booking.Slot != null && booking.Slot.Status == "RESERVED")
                {
                    booking.Slot.Status = "AVAILABLE";
                    booking.Slot.LastUpdated = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return MapToBookingResponse(booking);
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
    }


    // ─── ADDED BY ANTIGRAVITY (BACKWARD COMPATIBILITY & ADDITIONAL SYSTEM SERVICES) ───────────────────────────────

    public async Task<BookingDashboardStatsResponse> GetBookingStatsAsync(string userId)
    {
        var totalBookings = await _context.Bookings.CountAsync(b => b.VehicleUserId == userId);

        var today = DateTime.UtcNow;
        var startOfMonth = new DateTime(today.Year, today.Month, 1);
        var thisMonthNew = await _context.Bookings.CountAsync(b => b.VehicleUserId == userId && b.BookingTime >= startOfMonth);

        var userPlates = await _context.Vehicles
            .Where(v => v.VehicleUserId == userId)
            .Select(v => v.VehiclePlateNumber)
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

    public async Task<List<BookingResponse>> GetActiveBookingsAsync(string userId)
    {
        var activeBookings = await _context.Bookings
            .Include(b => b.Vehicle)
                .ThenInclude(v => v.VehicleType)
            .Include(b => b.Slot)
                .ThenInclude(s => s.Zone)
                    .ThenInclude(z => z.VehicleType)
                        .ThenInclude(vt => vt.PricingPolicies)
            .Include(b => b.Payments)
            .Where(b => b.VehicleUserId == userId && (b.Status == "PENDING" || b.Status == "CONFIRMED"))
            .OrderBy(b => b.ExpectedArrival)
            .ToListAsync();

        return activeBookings.Select(MapToBookingResponse).ToList();
    }

    public async Task<List<BookingResponse>> GetBookingHistoryAsync(string userId)
    {
        var historyBookings = await _context.Bookings
            .Include(b => b.Vehicle)
                .ThenInclude(v => v.VehicleType)
            .Include(b => b.Slot)
                .ThenInclude(s => s.Zone)
                    .ThenInclude(z => z.VehicleType)
                        .ThenInclude(vt => vt.PricingPolicies)
            .Include(b => b.Payments)
            .Where(b => b.VehicleUserId == userId && (b.Status == "COMPLETED" || b.Status == "CANCELLED"))
            .OrderByDescending(b => b.BookingTime)
            .ToListAsync();

        return historyBookings.Select(MapToBookingResponse).ToList();
    }

    public async Task<BookingResponse> AdjustBookingAsync(string bookingId, string userId, AdjustBookingRequest request)
    {
        // Validation
        if (request.ExpectedArrival < DateTime.UtcNow.AddMinutes(-10))
        {
            throw new ArgumentException("Expected arrival time cannot be in the past.");
        }

        DateTime expiredAt = request.ExpiredAt ?? request.ExpectedArrival.AddHours(2);

        if (expiredAt <= request.ExpectedArrival)
        {
            throw new ArgumentException("Exit time must be after entry time.");
        }

        var duration = expiredAt - request.ExpectedArrival;
        if (duration.TotalMinutes < 30)
        {
            throw new ArgumentException("Booking duration must be at least 30 minutes.");
        }

        var booking = await _context.Bookings
            .Include(b => b.Vehicle)
                .ThenInclude(v => v.VehicleType)
            .Include(b => b.Slot)
                .ThenInclude(s => s.Zone)
                    .ThenInclude(z => z.VehicleType)
                        .ThenInclude(vt => vt.PricingPolicies)
            .Include(b => b.Payments)
            .FirstOrDefaultAsync(b => b.BookingId == bookingId && b.VehicleUserId == userId)
            ?? throw new KeyNotFoundException("Booking not found.");

        if (booking.Status != "CONFIRMED" && booking.Status != "PENDING")
        {
            throw new InvalidOperationException("Cannot adjust bookings that are not in active status.");
        }

        booking.ExpectedArrival = request.ExpectedArrival;
        booking.ExpiredAt = expiredAt;

        await _context.SaveChangesAsync();

        return MapToBookingResponse(booking);
    }

    // ─── PRIVATE HELPER METHODS FOR MAPPING & ESTIMATIONS ────────────────────────────────────────────────────────

    private static BookingResponse MapToBookingResponse(Booking b)
    {
        decimal estimatedFee = 15000m; // Base price is 15,000 VND

        DateTime referenceTime = DateTime.UtcNow;
        if (b.Status?.Equals("COMPLETED", StringComparison.OrdinalIgnoreCase) == true && b.ExpiredAt.HasValue)
        {
            referenceTime = b.ExpiredAt.Value;
        }

        if (b.Status?.Equals("CANCELLED", StringComparison.OrdinalIgnoreCase) == true)
        {
            estimatedFee = b.Payments.Where(p => p.Status == "SUCCESS").Sum(p => (decimal?)p.AmountPaid) ?? 15000m;
        }
        else if (referenceTime > b.ExpectedArrival)
        {
            var duration = referenceTime - b.ExpectedArrival;
            var billedHours = (int)Math.Ceiling(duration.TotalMinutes / 60.0);
            if (billedHours > 1)
            {
                estimatedFee += (billedHours - 1) * 2000m;
            }
        }

        return new BookingResponse
        {
            BookingId = b.BookingId,
            VehicleUserId = b.VehicleUserId,
            VehicleId = b.VehicleId,
            VehiclePlateNumber = b.Vehicle != null ? b.Vehicle.VehiclePlateNumber : "N/A",
            VehicleType = b.Vehicle?.VehicleType != null ? b.Vehicle.VehicleType.VehicleTypeName : "Car",
            SlotId = b.SlotId,
            SlotName = b.Slot != null ? b.Slot.SlotName : "N/A",
            FloorNumber = b.Slot?.Zone?.FloorNumber,
            FloorName = b.Slot?.Zone != null ? $"Basement B{b.Slot.Zone.FloorNumber}" : "Basement B1",
            ZoneName = b.Slot?.Zone?.ZoneName,
            ExpectedArrival = b.ExpectedArrival,
            ExpiredAt = b.ExpiredAt,
            BookingTime = b.BookingTime,
            Status = b.Status,
            Notes = b.Notes,
            EstimatedFee = estimatedFee,
            DepositPaid = b.Payments.Where(p => p.Status == "SUCCESS").Sum(p => (decimal?)p.AmountPaid) ?? 0m,
            QrCodeData = $"Ticket_Valid_Slot_{b.SlotId}_Plate_{b.Vehicle?.VehiclePlateNumber}"
        };
    }
}
