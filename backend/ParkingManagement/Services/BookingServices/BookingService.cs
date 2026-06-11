using ParkingManagement.DTOs.Booking;
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
        if (request.ExpectedArrival <= DateTime.Now)
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
        if (request.ExpectedArrival <= DateTime.Now)
            throw new ArgumentException("Expected arrival time cannot be in the past");

        // AC4: Validate minimum booking duration — phải book trước ít nhất 30 phút
        if (request.ExpectedArrival < DateTime.Now.AddMinutes(MinBookingAdvanceMinutes))
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
            BookingId = "BK_" + DateTime.Now.ToString("yyMMddHHmmss") + new Random().Next(100, 999),
            VehicleUserId = userId,
            VehicleId = request.VehicleId,
            SlotId = request.SlotId,
            ExpectedArrival = request.ExpectedArrival,
            ExpiredAt = request.ExpectedArrival.AddMinutes(BookingExpiryMinutes),
            BookingTime = DateTime.Now,
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
}
