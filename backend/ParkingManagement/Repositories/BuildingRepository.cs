using Microsoft.EntityFrameworkCore;
using ParkingManagement.Data;
using ParkingManagement.Models;

namespace ParkingManagement.Repositories;

public interface IBuildingRepository
{
    Task<ParkingBuilding?> GetByIdAsync(string buildingId);
    Task<(int occupied, int available)> GetOccupancyAsync(string buildingId);
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

    public async Task UpdateAsync(ParkingBuilding building)
    {
        _db.ParkingBuildings.Update(building);
        await _db.SaveChangesAsync();
    }
}
