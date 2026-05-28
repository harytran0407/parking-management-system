using Microsoft.EntityFrameworkCore;
using ParkingManagement.Data;
using ParkingManagement.Models;

namespace ParkingManagement.Repositories;

public interface IVehicleTypeRepository
{
    Task<List<VehicleType>> GetAllAsync();
    Task<VehicleType?> GetByIdAsync(int id);
    Task<bool> ExistsByNameAsync(string name, int? excludeId = null);
    Task<int> CountRelatedSlotsAsync(int vehicleTypeId);
    Task<int> CountActiveSessionsAsync(int vehicleTypeId);
    Task<VehicleType> CreateAsync(VehicleType vehicleType);
    Task UpdateAsync(VehicleType vehicleType);
    Task DeleteAsync(VehicleType vehicleType);
}

public class VehicleTypeRepository : IVehicleTypeRepository
{
    private readonly AppDbContext _db;

    public VehicleTypeRepository(AppDbContext db)
    {
        _db = db;
    }

    public Task<List<VehicleType>> GetAllAsync() =>
        _db.VehicleTypes.OrderBy(v => v.VehicleTypeId).ToListAsync();

    public Task<VehicleType?> GetByIdAsync(int id) =>
        _db.VehicleTypes.FirstOrDefaultAsync(v => v.VehicleTypeId == id);

    public Task<bool> ExistsByNameAsync(string name, int? excludeId = null) =>
        _db.VehicleTypes.AnyAsync(v =>
            v.VehicleTypeName == name &&
            (excludeId == null || v.VehicleTypeId != excludeId));

    // Đếm slots liên quan qua FloorZone (zone theo loại xe → slot trong zone đó)
    public Task<int> CountRelatedSlotsAsync(int vehicleTypeId) =>
        _db.ParkingSlots
            .Include(s => s.Zone)
            .CountAsync(s => s.Zone.VehicleTypeId == vehicleTypeId);

    // Đếm session đang ACTIVE của loại xe này
    public Task<int> CountActiveSessionsAsync(int vehicleTypeId) =>
        _db.ParkingSessions
            .CountAsync(s => s.VehicleTypeId == vehicleTypeId && s.Status == "ACTIVE");

    public async Task<VehicleType> CreateAsync(VehicleType vehicleType)
    {
        _db.VehicleTypes.Add(vehicleType);
        await _db.SaveChangesAsync();
        return vehicleType;
    }

    public async Task UpdateAsync(VehicleType vehicleType)
    {
        _db.VehicleTypes.Update(vehicleType);
        await _db.SaveChangesAsync();
    }

    public async Task DeleteAsync(VehicleType vehicleType)
    {
        _db.VehicleTypes.Remove(vehicleType);
        await _db.SaveChangesAsync();
    }
}
