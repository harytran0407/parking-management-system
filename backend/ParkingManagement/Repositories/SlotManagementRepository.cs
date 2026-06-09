using Microsoft.EntityFrameworkCore;
using ParkingManagement.Data;
using ParkingManagement.Models;

namespace ParkingManagement.Repositories;

public interface ISlotManagementRepository
{
    Task<FloorZone?> GetZoneWithTypeAsync(int zoneId);
    Task<List<ParkingSlot>> GetSlotsByZoneAsync(int zoneId);
    Task<ParkingSlot?> GetSlotByIdAsync(string slotId);
    Task<bool> SlotIdExistsAsync(string slotId);
    Task<int> CountSlotsInZoneAsync(int zoneId);
    Task<ParkingSession?> GetActiveSessionBySlotAsync(string slotId);
    Task AddSlotsAsync(List<ParkingSlot> slots);
    Task UpdateSlotAsync(ParkingSlot slot);
    Task UpdateSessionAsync(ParkingSession session);
    Task DeleteSlotAsync(ParkingSlot slot);
}

public class SlotManagementRepository : ISlotManagementRepository
{
    private readonly AppDbContext _db;

    public SlotManagementRepository(AppDbContext db)
    {
        _db = db;
    }

    public Task<FloorZone?> GetZoneWithTypeAsync(int zoneId) =>
        _db.FloorZones
           .Include(z => z.VehicleType)
           .FirstOrDefaultAsync(z => z.ZoneId == zoneId);

    public Task<List<ParkingSlot>> GetSlotsByZoneAsync(int zoneId) =>
        _db.ParkingSlots
           .Where(s => s.ZoneId == zoneId)
           .OrderBy(s => s.SlotName)
           .ToListAsync();

    public Task<ParkingSlot?> GetSlotByIdAsync(string slotId) =>
        _db.ParkingSlots
           .Include(s => s.Zone)
           .FirstOrDefaultAsync(s => s.SlotId == slotId);

    public Task<bool> SlotIdExistsAsync(string slotId) =>
        _db.ParkingSlots.AnyAsync(s => s.SlotId == slotId);

    public Task<int> CountSlotsInZoneAsync(int zoneId) =>
        _db.ParkingSlots.CountAsync(s => s.ZoneId == zoneId);

    // Lấy session ACTIVE đang chiếm slot này
    public Task<ParkingSession?> GetActiveSessionBySlotAsync(string slotId) =>
        _db.ParkingSessions
           .FirstOrDefaultAsync(s => s.SlotId == slotId && s.Status == "ACTIVE");

    public async Task AddSlotsAsync(List<ParkingSlot> slots)
    {
        _db.ParkingSlots.AddRange(slots);
        await _db.SaveChangesAsync();
    }

    public async Task UpdateSlotAsync(ParkingSlot slot)
    {
        _db.ParkingSlots.Update(slot);
        await _db.SaveChangesAsync();
    }

    public async Task UpdateSessionAsync(ParkingSession session)
    {
        _db.ParkingSessions.Update(session);
        await _db.SaveChangesAsync();
    }

    public async Task DeleteSlotAsync(ParkingSlot slot)
    {
        _db.ParkingSlots.Remove(slot);
        await _db.SaveChangesAsync();
    }
}
