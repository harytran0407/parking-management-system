<<<<<<< HEAD
using Microsoft.EntityFrameworkCore;
using ParkingManagement.Data;
using ParkingManagement.Models;
using ParkingManagement.DTOs.Building;
=======
﻿using Microsoft.EntityFrameworkCore;
using ParkingManagement.Data;
using ParkingManagement.Models;
>>>>>>> origin/main

namespace ParkingManagement.Repositories;

public interface IBuildingRepository
{
    Task<ParkingBuilding?> GetByIdAsync(string buildingId);
    Task<(int occupied, int available)> GetOccupancyAsync(string buildingId);
<<<<<<< HEAD
    Task<List<VehicleTypeAvailabilityDto>> GetOccupancyByVehicleTypeAsync(string buildingId);
=======
>>>>>>> origin/main
    Task UpdateAsync(ParkingBuilding building);
}

public class BuildingRepository : IBuildingRepository
{
    private readonly AppDbContext _db;

    public BuildingRepository(AppDbContext db)
    {
        _db = db;
    }

    public Task<ParkingBuilding?> GetByIdAsync(string buildingId) =>
        _db.ParkingBuildings.FirstOrDefaultAsync(b => b.BuildingId == buildingId);

    public async Task<(int occupied, int available)> GetOccupancyAsync(string buildingId)
    {
<<<<<<< HEAD
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

=======
        var slots = await _db.ParkingSlots
            .Include(s => s.Zone)
            .Where(s => s.Zone.BuildingId == buildingId)
            .GroupBy(s => s.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync();

        int occupied = slots.Where(s => s.Status == "OCCUPIED").Sum(s => s.Count);
        int available = slots.Where(s => s.Status == "AVAILABLE").Sum(s => s.Count);
        return (occupied, available);
    }

>>>>>>> origin/main
    public async Task UpdateAsync(ParkingBuilding building)
    {
        _db.ParkingBuildings.Update(building);
        await _db.SaveChangesAsync();
    }
}
