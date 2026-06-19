<<<<<<< HEAD
using Microsoft.AspNetCore.Mvc;
=======
﻿using Microsoft.AspNetCore.Mvc;
>>>>>>> origin/main
using ParkingManagement.DTOs.Building;
using ParkingManagement.Services.BuildingServices;

namespace ParkingManagement.Controllers;

[ApiController]
[Route("api/v1/parking/floors")]
public class FloorAllocationController : ControllerBase
{
    private readonly IFloorAllocationService _service;
<<<<<<< HEAD
    private const string BuildingId = "B001";
=======
    private const string BuildingId = "B01";
>>>>>>> origin/main

    public FloorAllocationController(IFloorAllocationService service)
    {
        _service = service;
    }

    // GET /api/v1/parking/floors
    // AC1: Interface to view all floor-zone-vehicle type assignments
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<FloorZoneResponse>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        var data = await _service.GetAllAsync(BuildingId);
        return Ok(ApiResponse<List<FloorZoneResponse>>.Ok(data));
    }

    // PUT /api/v1/parking/floors/{zoneId}
    // AC1: Assign vehicle type to floor/zone
    // AC2: Warning if active vehicles exist
    // AC3: Changes take effect from save time
    // [Authorize(Roles = "ParkingManager")]
    [HttpPut("{zoneId:int}")]
    [ProducesResponseType(typeof(ApiResponse<UpdateFloorAllocationResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateAllocation(int zoneId, [FromBody] UpdateFloorAllocationRequest request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage);
            return BadRequest(ApiResponse<object>.Fail(string.Join("; ", errors)));
        }

        var data = await _service.UpdateAllocationAsync(zoneId, request);
        return Ok(ApiResponse<UpdateFloorAllocationResponse>.Ok(data, "Floor allocation updated successfully."));
    }
    // POST /api/v1/parking/floors
    // [Authorize(Roles = "ParkingManager")]
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<FloorZoneResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateZone([FromBody] CreateFloorZoneRequest request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage);
            return BadRequest(ApiResponse<object>.Fail(string.Join("; ", errors)));
        }

        var data = await _service.CreateZoneAsync(BuildingId, request);
        return StatusCode(201, ApiResponse<FloorZoneResponse>.Ok(data, "Floor zone created successfully."));
    }
    // DELETE /api/v1/parking/floors/{zoneId}
    // [Authorize(Roles = "ParkingManager")]
    [HttpDelete("{zoneId:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> DeleteZone(int zoneId)
    {
        await _service.DeleteZoneAsync(zoneId);
        return NoContent();
    }
}
