using Microsoft.EntityFrameworkCore;
using ParkingManagement.Data;
using ParkingManagement.Models;

namespace ParkingManagement.Repositories;

public interface IBookingServiceRepository
{
    Task<ParkingSlot?> GetSlotWithZoneAsync(string slotId);
    Task<Vehicle?> GetVehicleAsync(int vehicleId, string userId);
    Task<PricingPolicy?> GetActivePolicyAsync(int vehicleTypeId);
    Task<bool> HasConflictingBookingAsync(string slotId, DateTime expectedArrival);
    Task<Booking> CreateAsync(Booking booking);
    Task<Booking?> GetByIdAsync(string bookingId, string userId);
    Task<List<Booking>> GetByUserAsync(string userId);
    Task UpdateAsync(Booking booking);
}

public class BookingServiceRepository : IBookingServiceRepository
{
    private readonly AppDbContext _db;

    public BookingServiceRepository(AppDbContext db)
    {
        _db = db;
    }

    public Task<ParkingSlot?> GetSlotWithZoneAsync(string slotId) =>
        _db.ParkingSlots
           .Include(s => s.Zone)
               .ThenInclude(z => z.VehicleType)
           .FirstOrDefaultAsync(s => s.SlotId == slotId);

    public Task<Vehicle?> GetVehicleAsync(int vehicleId, string userId) =>
        _db.Vehicles.FirstOrDefaultAsync(v => v.VehicleId == vehicleId && v.VehicleUserId == userId);

    // Lấy pricing policy mới nhất có hiệu lực
    public Task<PricingPolicy?> GetActivePolicyAsync(int vehicleTypeId)
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        return _db.PricingPolicies
            .Where(p => p.VehicleTypeId == vehicleTypeId && p.EffectiveDate <= today)
            .OrderByDescending(p => p.EffectiveDate)
            .FirstOrDefaultAsync();
    }

    // Kiểm tra slot đã có booking PENDING/CONFIRMED trong khoảng thời gian đó chưa
    public Task<bool> HasConflictingBookingAsync(string slotId, DateTime expectedArrival) =>
        _db.Bookings.AnyAsync(b =>
            b.SlotId == slotId &&
            (b.Status == "PENDING" || b.Status == "CONFIRMED") &&
            b.ExpiredAt > DateTime.UtcNow &&
            Math.Abs(EF.Functions.DateDiffMinute(b.ExpectedArrival, expectedArrival)) < 15);

    public async Task<Booking> CreateAsync(Booking booking)
    {
        _db.Bookings.Add(booking);
        await _db.SaveChangesAsync();
        return booking;
    }

    public Task<Booking?> GetByIdAsync(string bookingId, string userId) =>
        _db.Bookings
           .Include(b => b.Slot)
               .ThenInclude(s => s!.Zone)
           .FirstOrDefaultAsync(b => b.BookingId == bookingId && b.VehicleUserId == userId);

    public Task<List<Booking>> GetByUserAsync(string userId) =>
        _db.Bookings
           .Include(b => b.Slot)
               .ThenInclude(s => s!.Zone)
           .Where(b => b.VehicleUserId == userId)
           .OrderByDescending(b => b.BookingTime)
           .ToListAsync();

    public async Task UpdateAsync(Booking booking)
    {
        _db.Bookings.Update(booking);
        await _db.SaveChangesAsync();
    }
}
