using Microsoft.EntityFrameworkCore;
using ParkingManagement.Data;
using ParkingManagement.Models;

namespace ParkingManagement.Repositories;

public interface ISlotManagementRepository
{
    Task<FloorZone?> GetZoneWithTypeAsync(int zoneId);
    Task<ParkingSlot?> GetSlotByIdAsync(string slotId);
    Task<bool> SlotIdExistsAsync(string slotId);
    Task<bool> SlotNameExistsAsync(string slotName);
    Task<int> CountSlotsInZoneAsync(int zoneId);
    Task<int> GetMaxSlotNumberAsync(int floorNumber); // <-- THÊM DÒNG NÀY
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
           .Include(z => z.ParkingSlots)
           .FirstOrDefaultAsync(z => z.ZoneId == zoneId);


    public Task<ParkingSlot?> GetSlotByIdAsync(string slotId) =>
        _db.ParkingSlots
           .Include(s => s.Zone)
           .FirstOrDefaultAsync(s => s.SlotId == slotId);

    public Task<bool> SlotIdExistsAsync(string slotId) =>
        _db.ParkingSlots.AnyAsync(s => s.SlotId == slotId);

    public Task<bool> SlotNameExistsAsync(string slotName) =>
        _db.ParkingSlots.AnyAsync(s => s.SlotName == slotName);

    public Task<int> CountSlotsInZoneAsync(int zoneId) =>
        _db.ParkingSlots.CountAsync(s => s.ZoneId == zoneId);

    public async Task<int> GetMaxSlotNumberAsync(int floorNumber)
    {
        string idPrefix = $"slt_{floorNumber}";
    
        var slotIds = await _db.ParkingSlots
            .Where(s => s.SlotId.StartsWith(idPrefix))
            .Select(s => s.SlotId)
            .ToListAsync();
    
        if (!slotIds.Any()) return 0;
    
        int maxNumber = 0;
        foreach (var id in slotIds)
        {
            string numberPart = id.Substring(idPrefix.Length); // "slt_101" -> "01"
    
            if (int.TryParse(numberPart, out int parsedNum))
            {
                if (parsedNum > maxNumber) maxNumber = parsedNum;
            }
        }
    
        return maxNumber;
    }

    // Lấy session ACTIVE đang chiếm slot này
    public Task<ParkingSession?> GetActiveSessionBySlotAsync(string slotId) =>
        _db.ParkingSessions
           .FirstOrDefaultAsync(s => s.SlotId == slotId && s.Status == "ACTIVE");

    private async Task SyncBuildingStatsAsync(string buildingId)
    {
        var building = await _db.ParkingBuildings.FirstOrDefaultAsync(b => b.BuildingId == buildingId);
        if (building == null) return;

        int activeFloors = await _db.FloorZones
            .Where(z => z.BuildingId == buildingId)
            .Select(z => z.FloorNumber)
            .Distinct()
            .CountAsync();

        int totalSlots = await _db.FloorZones
            .Where(z => z.BuildingId == buildingId)
            .SumAsync(z => z.Capacity);

        if (building.TotalFloors != activeFloors || building.TotalSlots != totalSlots)
        {
            building.TotalFloors = activeFloors;
            building.TotalSlots = totalSlots;
            _db.ParkingBuildings.Update(building);
            await _db.SaveChangesAsync();
        }
    }

    public async Task AddSlotsAsync(List<ParkingSlot> slots)
    {
        _db.ParkingSlots.AddRange(slots);
        await _db.SaveChangesAsync();

        if (slots.Any())
        {
            var zoneId = slots.First().ZoneId;
            var zone = await _db.FloorZones.FirstOrDefaultAsync(z => z.ZoneId == zoneId);
            if (zone != null && !string.IsNullOrEmpty(zone.BuildingId))
            {
                await SyncBuildingStatsAsync(zone.BuildingId);
            }
        }
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
        var zone = slot.Zone;
        if (zone == null)
        {
            zone = await _db.FloorZones.FirstOrDefaultAsync(z => z.ZoneId == slot.ZoneId);
        }

        if (zone != null && zone.Capacity > 0)
        {
            zone.Capacity--;
            zone.AvailableCapacity--;
        }
        _db.ParkingSlots.Remove(slot);
        await _db.SaveChangesAsync();

        if (zone != null && !string.IsNullOrEmpty(zone.BuildingId))
        {
            await SyncBuildingStatsAsync(zone.BuildingId);
        }
    }
}
