using Microsoft.EntityFrameworkCore;
using ParkingManagement.Data;
using ParkingManagement.Models;

namespace ParkingManagement.Repositories;

public interface IPricingPolicyRepository
{
    Task<List<PricingPolicy>> GetAllAsync();
    Task<List<PricingPolicy>> GetByVehicleTypeAsync(int vehicleTypeId);
    Task<PricingPolicy?> GetByIdAsync(int policyId);
    Task<VehicleType?> GetVehicleTypeAsync(int vehicleTypeId);
    Task<PricingPolicy> CreateAsync(PricingPolicy policy);
    Task UpdateAsync(PricingPolicy policy);
    Task DeleteAsync(PricingPolicy policy);
    Task<bool> ExistsOnDateAsync(int vehicleTypeId, DateOnly effectiveDate);

}

public class PricingPolicyRepository : IPricingPolicyRepository
{
    private readonly AppDbContext _db;

    public PricingPolicyRepository(AppDbContext db)
    {
        _db = db;
    }

    public Task<List<PricingPolicy>> GetAllAsync() =>
        _db.PricingPolicies
           .Include(p => p.VehicleType)
           .OrderBy(p => p.VehicleTypeId)
           .ThenByDescending(p => p.EffectiveDate)
           .ToListAsync();

    public Task<List<PricingPolicy>> GetByVehicleTypeAsync(int vehicleTypeId) =>
        _db.PricingPolicies
           .Include(p => p.VehicleType)
           .Where(p => p.VehicleTypeId == vehicleTypeId)
           .OrderByDescending(p => p.EffectiveDate)
           .ToListAsync();

    public Task<PricingPolicy?> GetByIdAsync(int policyId) =>
        _db.PricingPolicies
           .Include(p => p.VehicleType)
           .FirstOrDefaultAsync(p => p.PolicyId == policyId);

    public Task<VehicleType?> GetVehicleTypeAsync(int vehicleTypeId) =>
        _db.VehicleTypes.FirstOrDefaultAsync(v => v.VehicleTypeId == vehicleTypeId);

    public async Task<PricingPolicy> CreateAsync(PricingPolicy policy)
    {
        _db.PricingPolicies.Add(policy);
        await _db.SaveChangesAsync();
        return policy;
    }

    public async Task UpdateAsync(PricingPolicy policy)
    {
        _db.PricingPolicies.Update(policy);
        await _db.SaveChangesAsync();
    }

    public async Task DeleteAsync(PricingPolicy policy)
    {
        _db.PricingPolicies.Remove(policy);
        await _db.SaveChangesAsync();
    }
    public Task<bool> ExistsOnDateAsync(int vehicleTypeId, DateOnly effectiveDate) =>
    _db.PricingPolicies.AnyAsync(p =>
        p.VehicleTypeId == vehicleTypeId &&
        p.EffectiveDate == effectiveDate);
}
