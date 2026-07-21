using Microsoft.EntityFrameworkCore;
using ParkingManagement.Data;
using ParkingManagement.Models;
using ParkingManagement.DTOs.Building;

namespace ParkingManagement.Repositories;

public interface IBuildingRepository
{
    Task<ParkingBuilding?> GetByIdAsync(string buildingId);
    Task<(int occupied, int available)> GetOccupancyAsync(string buildingId);
    Task<List<VehicleTypeAvailabilityDto>> GetOccupancyByVehicleTypeAsync(string buildingId);
    Task UpdateAsync(ParkingBuilding building);
}

public class BuildingRepository : IBuildingRepository
{
    private readonly AppDbContext _db;

    public BuildingRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<ParkingBuilding?> GetByIdAsync(string buildingId)
    {
        var building = await _db.ParkingBuildings.FirstOrDefaultAsync(b => b.BuildingId == buildingId);
        if (building == null) return null;

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

        return building;
    }

    public async Task<(int occupied, int available)> GetOccupancyAsync(string buildingId)
    {
        var zones = await _db.FloorZones
            .Where(z => z.BuildingId == buildingId && z.Status == "ACTIVE")
            .ToListAsync();

        int total = zones.Sum(z => z.Capacity);
        int available = zones.Sum(z => z.AvailableCapacity);
        int occupied = total - available;
        return (occupied, available);
    }

    public async Task<List<VehicleTypeAvailabilityDto>> GetOccupancyByVehicleTypeAsync(string buildingId)
    {
        var zones = await _db.FloorZones
            .Include(z => z.VehicleType)
            .Where(z => z.BuildingId == buildingId && z.Status == "ACTIVE")
            .ToListAsync();

        return zones
            .GroupBy(z => new { z.VehicleTypeId, z.VehicleType.VehicleTypeName })
            .Select(g =>
            {
                int total = g.Sum(z => z.Capacity);
                int available = g.Sum(z => z.AvailableCapacity);
                return new VehicleTypeAvailabilityDto
                {
                    VehicleTypeId = g.Key.VehicleTypeId,
                    VehicleTypeName = g.Key.VehicleTypeName,
                    TotalSlots = total,
                    AvailableSlots = available,
                    OccupiedSlots = total - available
                };
            })
            .OrderBy(x => x.VehicleTypeId)
            .ToList();
    }

    public async Task UpdateAsync(ParkingBuilding building)
    {
        _db.ParkingBuildings.Update(building);
        await _db.SaveChangesAsync();
    }
}
