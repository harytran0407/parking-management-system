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
    Task UpdateAsync(FloorZone zone);
    Task<FloorZone> CreateAsync(FloorZone zone);
    Task<bool> FloorNumberExistsAsync(string buildingId, int floorNumber);
    Task DeleteZoneAsync(FloorZone zoneId);
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
    public Task<bool> FloorNumberExistsAsync(string buildingId, int floorNumber) =>
    _db.FloorZones.AnyAsync(z => z.BuildingId == buildingId && z.FloorNumber == floorNumber);

    public async Task DeleteZoneAsync(FloorZone zoneId)
    {
        _db.FloorZones.Remove(zoneId);
        await _db.SaveChangesAsync();
    }
}
