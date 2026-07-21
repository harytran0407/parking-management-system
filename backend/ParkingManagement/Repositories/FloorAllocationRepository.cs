using Microsoft.EntityFrameworkCore;
using ParkingManagement.Data;
using ParkingManagement.Models;

namespace ParkingManagement.Repositories;

public interface IFloorAllocationRepository
{
    Task<List<FloorZone>> GetAllByBuildingAsync(string buildingId);
    Task<FloorZone?> GetByIdAsync(int zoneId);
    Task<VehicleType?> GetVehicleTypeAsync(int vehicleTypeId);
    Task<int> CountActiveVehiclesAsync(int zoneId);
    Task<bool> HasActiveBookingsAsync(int zoneId);
    Task UpdateAsync(FloorZone zone);
    Task<FloorZone> CreateAsync(FloorZone zone);
    Task<bool> FloorNumberExistsAsync(string buildingId, int floorNumber, string zoneName);
    Task DeleteZoneAsync(FloorZone zoneId);
    Task SyncZoneSlotsAsync(int zoneId, int targetCapacity);
}

public class FloorAllocationRepository : IFloorAllocationRepository
{
    private readonly AppDbContext _db;

    public FloorAllocationRepository(AppDbContext db)
    {
        _db = db;
    }

    public Task<List<FloorZone>> GetAllByBuildingAsync(string buildingId) =>
        _db.FloorZones
           .Include(z => z.VehicleType)
           .Where(z => z.BuildingId == buildingId)
           .OrderBy(z => z.FloorNumber)
           .ThenBy(z => z.ZoneName)
           .ToListAsync();

    public Task<FloorZone?> GetByIdAsync(int zoneId) =>
        _db.FloorZones
           .Include(z => z.VehicleType)
           .FirstOrDefaultAsync(z => z.ZoneId == zoneId);

    public Task<VehicleType?> GetVehicleTypeAsync(int vehicleTypeId) =>
        _db.VehicleTypes.FirstOrDefaultAsync(v => v.VehicleTypeId == vehicleTypeId);

    // Đếm xe đang ACTIVE trong zone này (dựa trên cột ZoneId trực tiếp của ParkingSession trong cơ chế mới)
    public Task<int> CountActiveVehiclesAsync(int zoneId) =>
        _db.ParkingSessions
           .CountAsync(s => s.ZoneId == zoneId &&
                            s.Status == "ACTIVE");

    public Task<bool> HasActiveBookingsAsync(int zoneId) =>
        _db.Bookings
           .AnyAsync(b => b.ZoneId == zoneId &&
                            (b.Status == "CONFIRMED" || b.Status == "PENDING"));

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

    public async Task UpdateAsync(FloorZone zone)
    {
        _db.FloorZones.Update(zone);
        await _db.SaveChangesAsync();
        if (!string.IsNullOrEmpty(zone.BuildingId))
        {
            await SyncBuildingStatsAsync(zone.BuildingId);
        }
    }

    public async Task<FloorZone> CreateAsync(FloorZone zone)
    {
        _db.FloorZones.Add(zone);
        await _db.SaveChangesAsync();
        if (!string.IsNullOrEmpty(zone.BuildingId))
        {
            await SyncBuildingStatsAsync(zone.BuildingId);
        }
        return zone;
    }
    public Task<bool> FloorNumberExistsAsync(string buildingId, int floorNumber, string zoneName) =>
        _db.FloorZones.AnyAsync(z => z.BuildingId == buildingId && z.FloorNumber == floorNumber && z.ZoneName == zoneName);

    public async Task DeleteZoneAsync(FloorZone zoneId)
    {
        string? buildingId = zoneId.BuildingId;

        // Nullify ZoneId reference in bookings
        var bookings = await _db.Bookings.Where(b => b.ZoneId == zoneId.ZoneId).ToListAsync();
        foreach (var b in bookings)
        {
            b.ZoneId = null;
        }

        // Nullify ZoneId reference in parking sessions
        var sessions = await _db.ParkingSessions.Where(s => s.ZoneId == zoneId.ZoneId).ToListAsync();
        foreach (var s in sessions)
        {
            s.ZoneId = null;
        }

        var slots = await _db.ParkingSlots.Where(s => s.ZoneId == zoneId.ZoneId).ToListAsync();

        // Nullify SlotId reference in parking sessions for slots in this zone
        var slotIds = slots.Select(s => s.SlotId).ToList();
        var sessionsWithSlots = await _db.ParkingSessions.Where(s => s.SlotId != null && slotIds.Contains(s.SlotId)).ToListAsync();
        foreach (var s in sessionsWithSlots)
        {
            s.SlotId = null;
        }

        _db.ParkingSlots.RemoveRange(slots);
 
        _db.FloorZones.Remove(zoneId);
        await _db.SaveChangesAsync();

        if (!string.IsNullOrEmpty(buildingId))
        {
            await SyncBuildingStatsAsync(buildingId);
        }
    }

    public async Task SyncZoneSlotsAsync(int zoneId, int targetCapacity)
    {
        var zone = await _db.FloorZones
            .Include(z => z.ParkingSlots)
            .Include(z => z.VehicleType)
            .FirstOrDefaultAsync(z => z.ZoneId == zoneId);
    
        if (zone == null) return;
    
        int currentSlotsCount = zone.ParkingSlots.Count;
        if (targetCapacity == currentSlotsCount) return;
    
        if (targetCapacity > currentSlotsCount)
        {
            var newSlots = new List<ParkingSlot>();
            int countToCreate = targetCapacity - currentSlotsCount;
    
            string idPrefix = $"slt_{zone.FloorNumber}";
            int maxSlotNumber = 0;
    
            var allFloorSlotIds = await _db.ParkingSlots
                .Where(s => s.SlotId.StartsWith(idPrefix))
                .Select(s => s.SlotId)
                .ToListAsync();

            foreach (var baseId in allFloorSlotIds)
            {
                if (string.IsNullOrEmpty(baseId)) continue;
    
                string parsedBaseId = baseId;
    
                // Nếu id có hậu tố "_x" do lần tạo trước bị trùng (vd: slt_101_1),
                // chỉ cắt bỏ phần hậu tố ĐÓ, không cắt từ dấu "_" đầu tiên của prefix.
                int underscoreAfterPrefix = parsedBaseId.IndexOf('_', idPrefix.Length);
                if (underscoreAfterPrefix > 0)
                {
                    parsedBaseId = parsedBaseId.Substring(0, underscoreAfterPrefix);
                }
    
                if (parsedBaseId.StartsWith(idPrefix))
                {
                    string numberPart = parsedBaseId.Substring(idPrefix.Length);
                    if (int.TryParse(numberPart, out int num))
                    {
                        if (num > maxSlotNumber) maxSlotNumber = num;
                    }
                }
            }
    
            string zoneLetter = "Z";
            if (!string.IsNullOrEmpty(zone.ZoneName))
            {
                string cleanZoneName = zone.ZoneName.Replace("Zone", "", StringComparison.OrdinalIgnoreCase).Trim();
                if (!string.IsNullOrEmpty(cleanZoneName))
                {
                    zoneLetter = cleanZoneName.Substring(0, 1).ToUpper();
                }
                else
                {
                    zoneLetter = zone.ZoneName.Substring(0, 1).ToUpper();
                }
            }
    
            for (int i = 1; i <= countToCreate; i++)
            {
                int slotNumber = maxSlotNumber + i;
                string slotId = $"slt_{zone.FloorNumber}{slotNumber:D2}";
                string slotName = $"{zoneLetter}{zone.FloorNumber}{slotNumber:D2}";
    
                int suffix = 0;
                string candidateId = slotId;
                string candidateName = slotName;
                while (await _db.ParkingSlots.AnyAsync(s => s.SlotId == candidateId || s.SlotName == candidateName))
                {
                    suffix++;
                    candidateId = $"{slotId}_{suffix}";
                    candidateName = $"{slotName}_{suffix}";
                }
                slotId = candidateId;
                slotName = candidateName;
    
                var slot = new ParkingSlot
                {
                    SlotId = slotId,
                    SlotName = slotName,
                    Status = "AVAILABLE",
                    IsHandicap = false,
                    IsElectricCharging = false,
                    ZoneId = zoneId,
                    LastUpdated = DateTime.UtcNow
                };
                newSlots.Add(slot);
            }
            _db.ParkingSlots.AddRange(newSlots);
        }
        else
        {
            int countToDelete = currentSlotsCount - targetCapacity;
            var availableSlots = zone.ParkingSlots
                .Where(s => s.Status == "AVAILABLE")
                .OrderByDescending(s => s.SlotId)
                .Take(countToDelete)
                .ToList();
    
            if (availableSlots.Count < countToDelete)
            {
                throw new InvalidOperationException($"Cannot reduce capacity: not enough AVAILABLE slots to delete. Need to delete {countToDelete} slot(s), but only found {availableSlots.Count} AVAILABLE slot(s).");
            }
    
            _db.ParkingSlots.RemoveRange(availableSlots);
        }
    
        await _db.SaveChangesAsync();
    }
}
