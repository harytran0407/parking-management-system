using Microsoft.AspNetCore.Mvc;
using ParkingManagement.DTOs.Building;
using ParkingManagement.Services.BuildingServices;
using Microsoft.AspNetCore.Authorization;
namespace ParkingManagement.Controllers;

[ApiController]
[Route("api/v1/admin/vehicle-types")]
public class VehicleTypeController : ControllerBase
{
    private readonly IVehicleTypeService _service;

    public VehicleTypeController(IVehicleTypeService service)
    {
        _service = service;
    }

    // GET /api/v1/admin/vehicle-types
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<VehicleTypeResponse>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        var data = await _service.GetAllAsync();
        return Ok(ApiResponse<List<VehicleTypeResponse>>.Ok(data));
    }

    // GET /api/v1/admin/vehicle-types/{id}
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<VehicleTypeResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var data = await _service.GetByIdAsync(id);
        return Ok(ApiResponse<VehicleTypeResponse>.Ok(data));
    }

    // POST /api/v1/admin/vehicle-types
    [Authorize(Roles = "ParkingManager")]
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<VehicleTypeResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create([FromBody] CreateVehicleTypeRequest request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage);
            return BadRequest(ApiResponse<object>.Fail(string.Join("; ", errors)));
        }

        var data = await _service.CreateAsync(request);
        return StatusCode(201, ApiResponse<VehicleTypeResponse>.Ok(data, "Vehicle type created successfully."));
    }

    // PUT /api/v1/admin/vehicle-types/{id}
    [Authorize(Roles = "ParkingManager")]
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<VehicleTypeResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateVehicleTypeRequest request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage);
            return BadRequest(ApiResponse<object>.Fail(string.Join("; ", errors)));
        }

        var data = await _service.UpdateAsync(id, request);
        return Ok(ApiResponse<VehicleTypeResponse>.Ok(data, "Vehicle type updated successfully."));
    }

    // GET /api/v1/admin/vehicle-types/{id}/delete-preview
    // AC3: Show related slots count before deleting
    [Authorize(Roles = "ParkingManager")]
    [HttpGet("{id:int}/delete-preview")]
    [ProducesResponseType(typeof(ApiResponse<DeleteVehicleTypePreview>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDeletePreview(int id)
    {
        var data = await _service.GetDeletePreviewAsync(id);
        return Ok(ApiResponse<DeleteVehicleTypePreview>.Ok(data));
    }

    // DELETE /api/v1/admin/vehicle-types/{id}
    // AC2: Block delete if has active slots or sessions
    [Authorize(Roles = "ParkingManager")]
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Delete(int id)
    {
        await _service.DeleteAsync(id);
        return NoContent();
    }
}
