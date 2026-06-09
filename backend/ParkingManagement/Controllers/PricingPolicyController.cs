using Microsoft.AspNetCore.Mvc;
using ParkingManagement.DTOs.Building;
using ParkingManagement.Services.BuildingServices;

namespace ParkingManagement.Controllers;

[ApiController]
[Route("api/v1/admin/pricing")]
public class PricingPolicyController : ControllerBase
{
    private readonly IPricingPolicyService _service;

    public PricingPolicyController(IPricingPolicyService service)
    {
        _service = service;
    }

    // GET /api/v1/admin/pricing
    [HttpGet]
    [ProducesResponseType(typeof(List<PricingPolicyResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        var data = await _service.GetAllAsync();
        return Ok(new { success = true, data });
    }

    // GET /api/v1/admin/pricing/vehicle-type/{vehicleTypeId}
    // AC3: price change history — lấy tất cả policy theo loại xe, sort mới nhất trước
    [HttpGet("vehicle-type/{vehicleTypeId:int}")]
    [ProducesResponseType(typeof(List<PricingPolicyResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByVehicleType(int vehicleTypeId)
    {
        var data = await _service.GetByVehicleTypeAsync(vehicleTypeId);
        return Ok(new { success = true, data });
    }

    // GET /api/v1/admin/pricing/{policyId}
    [HttpGet("{policyId:int}")]
    [ProducesResponseType(typeof(PricingPolicyResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int policyId)
    {
        var data = await _service.GetByIdAsync(policyId);
        return Ok(new { success = true, data });
    }

    // POST /api/v1/admin/pricing
    // AC1: configure price by vehicle type x time slot x duration
    // AC2: price effective from specified date
    // [Authorize(Roles = "ParkingManager")]
    [HttpPost]
    [ProducesResponseType(typeof(PricingPolicyResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Create([FromBody] CreatePricingPolicyRequest request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage);
            return BadRequest(new { success = false, message = string.Join("; ", errors) });
        }

        var data = await _service.CreateAsync(request);
        return StatusCode(201, new { success = true, message = "Pricing policy created successfully.", data });
    }

    // PUT /api/v1/admin/pricing/{policyId}
    // [Authorize(Roles = "ParkingManager")]
    [HttpPut("{policyId:int}")]
    [ProducesResponseType(typeof(PricingPolicyResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int policyId, [FromBody] UpdatePricingPolicyRequest request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage);
            return BadRequest(new { success = false, message = string.Join("; ", errors) });
        }

        var data = await _service.UpdateAsync(policyId, request);
        return Ok(new { success = true, message = "Pricing policy updated successfully.", data });
    }

    // DELETE /api/v1/admin/pricing/{policyId}
    // [Authorize(Roles = "ParkingManager")]
    [HttpDelete("{policyId:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int policyId)
    {
        await _service.DeleteAsync(policyId);
        return NoContent();
    }
}
