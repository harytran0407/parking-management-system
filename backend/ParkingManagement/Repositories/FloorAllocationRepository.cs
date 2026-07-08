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

    public async Task UpdateAsync(FloorZone zone)
    {
        _db.FloorZones.Update(zone);
        await _db.SaveChangesAsync();
    }

    public async Task<FloorZone> CreateAsync(FloorZone zone)
    {
        _db.FloorZones.Add(zone);
        await _db.SaveChangesAsync();
        return zone;
    }
    public Task<bool> FloorNumberExistsAsync(string buildingId, int floorNumber, string zoneName) =>
        _db.FloorZones.AnyAsync(z => z.BuildingId == buildingId && z.FloorNumber == floorNumber && z.ZoneName == zoneName);

    public async Task DeleteZoneAsync(FloorZone zoneId)
    {
        var slots = await _db.ParkingSlots.Where(s => s.ZoneId == zoneId.ZoneId).ToListAsync();
        _db.ParkingSlots.RemoveRange(slots);

        _db.FloorZones.Remove(zoneId);
        await _db.SaveChangesAsync();
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

            // Calculate the maximum slot number (STT) currently existing in this zone to prevent collisions
            int maxSlotNumber = 0;
            foreach (var s in zone.ParkingSlots)
            {
                if (!string.IsNullOrEmpty(s.SlotId))
                {
                    string cleanId = s.SlotId.Contains("_") ? s.SlotId.Split('_')[0] : s.SlotId;
                    if (cleanId.Length >= 2)
                    {
                        string lastTwo = cleanId.Substring(cleanId.Length - 2);
                        if (int.TryParse(lastTwo, out int num))
                        {
                            if (num > maxSlotNumber) maxSlotNumber = num;
                        }
                    }
                }
            }

            for (int i = 1; i <= countToCreate; i++)
            {
                int slotNumber = maxSlotNumber + i;
                string zoneLetter = zone.ZoneName.Length > 5 ? zone.ZoneName[5].ToString() : "X";
                string slotId = $"{zoneLetter}{zone.FloorNumber}{slotNumber:D2}";

                int suffix = 0;
                string candidateId = slotId;
                while (await _db.ParkingSlots.AnyAsync(s => s.SlotId == candidateId))
                {
                    suffix++;
                    candidateId = $"{slotId}_{suffix}";
                }
                slotId = candidateId;

                var slot = new ParkingSlot
                {
                    SlotId = slotId,
                    SlotName = slotId,
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
