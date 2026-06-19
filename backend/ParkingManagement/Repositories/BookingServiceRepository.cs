<<<<<<< HEAD
using Microsoft.EntityFrameworkCore;
=======
﻿using Microsoft.EntityFrameworkCore;
>>>>>>> origin/main
using ParkingManagement.Data;
using ParkingManagement.Models;

namespace ParkingManagement.Repositories;

public interface IBookingServiceRepository
{
    Task<ParkingSlot?> GetSlotWithZoneAsync(string slotId);
<<<<<<< HEAD
    Task<PricingPolicy?> GetActivePolicyAsync(int vehicleTypeId);
    Task<bool> HasConflictingBookingAsync(int? zoneId, DateTime expectedArrival);
=======
    Task<Vehicle?> GetVehicleAsync(int vehicleId, string userId);
    Task<PricingPolicy?> GetActivePolicyAsync(int vehicleTypeId);
    Task<bool> HasConflictingBookingAsync(string slotId, DateTime expectedArrival);
>>>>>>> origin/main
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

<<<<<<< HEAD
=======
    public Task<Vehicle?> GetVehicleAsync(int vehicleId, string userId) =>
        _db.Vehicles.FirstOrDefaultAsync(v => v.VehicleId == vehicleId && v.VehicleUserId == userId);

>>>>>>> origin/main
    // Lấy pricing policy mới nhất có hiệu lực
    public Task<PricingPolicy?> GetActivePolicyAsync(int vehicleTypeId)
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        return _db.PricingPolicies
            .Where(p => p.VehicleTypeId == vehicleTypeId && p.EffectiveDate <= today)
            .OrderByDescending(p => p.EffectiveDate)
            .FirstOrDefaultAsync();
    }

<<<<<<< HEAD
    // Kiểm tra zone đã có booking PENDING/CONFIRMED trong khoảng thời gian đó chưa
    public Task<bool> HasConflictingBookingAsync(int? zoneId, DateTime expectedArrival) =>
        _db.Bookings.AnyAsync(b =>
            b.ZoneId == zoneId &&
=======
    // Kiểm tra slot đã có booking PENDING/CONFIRMED trong khoảng thời gian đó chưa
    public Task<bool> HasConflictingBookingAsync(string slotId, DateTime expectedArrival) =>
        _db.Bookings.AnyAsync(b =>
            b.SlotId == slotId &&
>>>>>>> origin/main
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
<<<<<<< HEAD
           .Include(b => b.Zone)
=======
           .Include(b => b.Slot)
               .ThenInclude(s => s!.Zone)
>>>>>>> origin/main
           .FirstOrDefaultAsync(b => b.BookingId == bookingId && b.VehicleUserId == userId);

    public Task<List<Booking>> GetByUserAsync(string userId) =>
        _db.Bookings
<<<<<<< HEAD
           .Include(b => b.Zone)
=======
           .Include(b => b.Slot)
               .ThenInclude(s => s!.Zone)
>>>>>>> origin/main
           .Where(b => b.VehicleUserId == userId)
           .OrderByDescending(b => b.BookingTime)
           .ToListAsync();

    public async Task UpdateAsync(Booking booking)
    {
        _db.Bookings.Update(booking);
        await _db.SaveChangesAsync();
    }
}
