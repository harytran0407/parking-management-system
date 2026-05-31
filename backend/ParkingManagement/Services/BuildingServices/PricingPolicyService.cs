using ParkingManagement.DTOs.Building;
using ParkingManagement.Models;
using ParkingManagement.Repositories;

namespace ParkingManagement.Services.BuildingServices;

public interface IPricingPolicyService
{
    Task<List<PricingPolicyResponse>> GetAllAsync();
    Task<List<PricingPolicyResponse>> GetByVehicleTypeAsync(int vehicleTypeId);
    Task<PricingPolicyResponse> GetByIdAsync(int policyId);
    Task<PricingPolicyResponse> CreateAsync(CreatePricingPolicyRequest request);
    Task<PricingPolicyResponse> UpdateAsync(int policyId, UpdatePricingPolicyRequest request);
    Task DeleteAsync(int policyId);
}

public class PricingPolicyService : IPricingPolicyService
{
    private readonly IPricingPolicyRepository _repo;

    public PricingPolicyService(IPricingPolicyRepository repo)
    {
        _repo = repo;
    }

    // ── GET ALL ───────────────────────────────────────────────────────────────

    public async Task<List<PricingPolicyResponse>> GetAllAsync()
    {
        var policies = await _repo.GetAllAsync();
        return policies.Select(ToResponse).ToList();
    }

    // ── GET BY VEHICLE TYPE — AC3: price change history ───────────────────────

    public async Task<List<PricingPolicyResponse>> GetByVehicleTypeAsync(int vehicleTypeId)
    {
        var policies = await _repo.GetByVehicleTypeAsync(vehicleTypeId);
        return policies.Select(ToResponse).ToList();
    }

    // ── GET BY ID ─────────────────────────────────────────────────────────────

    public async Task<PricingPolicyResponse> GetByIdAsync(int policyId)
    {
        var policy = await _repo.GetByIdAsync(policyId)
            ?? throw new KeyNotFoundException($"Pricing policy {policyId} not found");
        return ToResponse(policy);
    }

    // ── CREATE — AC1: configure price, AC2: effective from date ───────────────

    public async Task<PricingPolicyResponse> CreateAsync(CreatePricingPolicyRequest request)
    {
        // Validate vehicle type
        var vehicleType = await _repo.GetVehicleTypeAsync(request.VehicleTypeId)
            ?? throw new KeyNotFoundException($"Vehicle type {request.VehicleTypeId} not found");

        // Parse effective date
        if (!DateOnly.TryParse(request.EffectiveDate, out var effectiveDate))
            throw new ArgumentException("effective_date must be in format YYYY-MM-DD");

        // Check for existing policy on the same date for the same vehicle type
        if (await _repo.ExistsOnDateAsync(request.VehicleTypeId, effectiveDate))
            throw new InvalidOperationException(
                $"A pricing policy for this vehicle type already exists on {request.EffectiveDate}");

        var policy = new PricingPolicy
        {
            VehicleTypeId = request.VehicleTypeId,
            BasePrice = request.BasePrice,
            HourlyRate = request.HourlyRate,
            OvernightFee = request.OvernightFee,
            EffectiveDate = effectiveDate
        };

        var created = await _repo.CreateAsync(policy);
        created.VehicleType = vehicleType;
        return ToResponse(created);
    }

    // ── UPDATE ────────────────────────────────────────────────────────────────

    public async Task<PricingPolicyResponse> UpdateAsync(int policyId, UpdatePricingPolicyRequest request)
    {
        var policy = await _repo.GetByIdAsync(policyId)
            ?? throw new KeyNotFoundException($"Pricing policy {policyId} not found");

        if (request.BasePrice.HasValue)
            policy.BasePrice = request.BasePrice.Value;

        if (request.HourlyRate.HasValue)
            policy.HourlyRate = request.HourlyRate.Value;

        if (request.OvernightFee.HasValue)
            policy.OvernightFee = request.OvernightFee.Value;

        if (!string.IsNullOrEmpty(request.EffectiveDate))
        {
            if (!DateOnly.TryParse(request.EffectiveDate, out var effectiveDate))
                throw new ArgumentException("effective_date must be in format YYYY-MM-DD");
            policy.EffectiveDate = effectiveDate;
        }

        await _repo.UpdateAsync(policy);
        return ToResponse(policy);
    }

    // ── DELETE ────────────────────────────────────────────────────────────────

    public async Task DeleteAsync(int policyId)
    {
        var policy = await _repo.GetByIdAsync(policyId)
            ?? throw new KeyNotFoundException($"Pricing policy {policyId} not found");

        await _repo.DeleteAsync(policy);
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private static PricingPolicyResponse ToResponse(PricingPolicy p) => new()
    {
        PolicyId = p.PolicyId,
        VehicleTypeId = p.VehicleTypeId,
        VehicleTypeName = p.VehicleType?.VehicleTypeName ?? "",
        BasePrice = p.BasePrice,
        HourlyRate = p.HourlyRate,
        OvernightFee = p.OvernightFee,
        EffectiveDate = p.EffectiveDate.ToString("yyyy-MM-dd")
    };
}
