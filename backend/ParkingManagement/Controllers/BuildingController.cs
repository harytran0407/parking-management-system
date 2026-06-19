using Microsoft.AspNetCore.Mvc;
using ParkingManagement.DTOs.Building;
using ParkingManagement.Services.BuildingServices;
using ParkingManagement.Repositories;

namespace ParkingManagement.Controllers;

[ApiController]
[Route("api/v1/parking/buildings")]
public class BuildingController : ControllerBase
{
    private readonly IBuildingService _service;
    private readonly IPricingPolicyRepository _pricingRepo;
    // Hệ thống 1 tòa nhà — ID cố định
    private const string BuildingId = "B001";

    public BuildingController(IBuildingService service, IPricingPolicyRepository pricingRepo)
    {
        _service = service;
        _pricingRepo = pricingRepo;
    }

    // GET /api/v1/parking/buildings/info — public
    [HttpGet("info")]
    [ProducesResponseType(typeof(ApiResponse<BuildingInfoResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetInfo()
    {
        var data = await _service.GetBuildingInfoAsync(BuildingId);
        return Ok(ApiResponse<BuildingInfoResponse>.Ok(data));
    }

    // PUT /api/v1/parking/buildings/info — ParkingManager
    [HttpPut("info")]
    // [Authorize(Roles = "ParkingManager")]   // uncomment khi có JWT
    [ProducesResponseType(typeof(ApiResponse<UpdateBuildingResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateInfo([FromBody] UpdateBuildingRequest request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage);
            return BadRequest(ApiResponse<object>.Fail(string.Join("; ", errors)));
        }

        var data = await _service.UpdateBuildingInfoAsync(BuildingId, request);
        return Ok(ApiResponse<UpdateBuildingResponse>.Ok(data, "Building information updated successfully."));
    }
    // /GET /api/v1/parking/buildings/pricing/current
    // =========================================================================
    [HttpGet("pricing/current")]
    [ProducesResponseType(typeof(ApiResponse<List<PricingPolicyResponse>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCurrentPricing()
    {
        var allPolicies = await _pricingRepo.GetAllAsync();
        var today = DateOnly.FromDateTime(DateTime.Today);

        var currentActivePolicies = allPolicies
            .Where(p => p.EffectiveDate <= today)
            .GroupBy(p => p.VehicleTypeId)
            .Select(g => g.OrderByDescending(p => p.EffectiveDate).First())
            .Select(p => new PricingPolicyResponse
            {
                PolicyId = p.PolicyId,
                VehicleTypeId = p.VehicleTypeId,
                VehicleTypeName = p.VehicleType?.VehicleTypeName ?? (p.VehicleTypeId == 2 ? "Car" : "Motorbike"),
                BasePrice = p.BasePrice,
                HourlyRate = p.HourlyRate,
                OvernightFee = p.OvernightFee,
                EffectiveDate = p.EffectiveDate.ToString("yyyy-MM-dd")
            })
            .ToList();

        return Ok(ApiResponse<List<PricingPolicyResponse>>.Ok(currentActivePolicies));
    }
}
