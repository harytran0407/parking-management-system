using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ParkingManagement.Data;
using ParkingManagement.DTOs.Building;
using ParkingManagement.DTOs.Vehicle;
using ParkingManagement.Models;
using System.Security.Claims;

namespace ParkingManagement.Controllers
{
    [ApiController]
    [Route("api/v1/vehicles")]
    [Authorize]
    public class VehicleController : ControllerBase
    {
        private readonly AppDbContext _context;

        public VehicleController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/v1/vehicles
        [HttpGet]
        public async Task<IActionResult> GetMyVehicles()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(ApiResponse<object>.Fail("Invalid token"));
            }

            var vehicles = await _context.Vehicles
                .Include(v => v.VehicleType)
                .Where(v => v.VehicleUserId == userId)
                .Select(v => new VehicleResponse
                {
                    VehicleId = v.VehicleId,
                    VehiclePlateNumber = v.VehiclePlateNumber,
                    VehicleDescription = v.VehicleDescription,
                    Brand = v.Brand,
                    Model = v.Model,
                    Color = v.Color,
                    VehicleTypeId = v.VehicleTypeId,
                    VehicleTypeName = v.VehicleType.VehicleTypeName
                })
                .ToListAsync();

            return Ok(ApiResponse<List<VehicleResponse>>.Ok(vehicles));
        }

        // POST: api/v1/vehicles
        [HttpPost]
        public async Task<IActionResult> RegisterVehicle([FromBody] CreateVehicleRequest request)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(ApiResponse<object>.Fail("Invalid token"));
            }

            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
                return BadRequest(ApiResponse<object>.Fail(string.Join("; ", errors)));
            }

            // Normalize plate number
            var plateNormalized = request.VehiclePlateNumber.Trim().ToUpper();

            // Check uniqueness
            var exists = await _context.Vehicles.AnyAsync(v => v.VehiclePlateNumber == plateNormalized);
            if (exists)
            {
                return Conflict(ApiResponse<object>.Fail("Plate number is already registered in the system."));
            }

            // Check if vehicle type exists
            var typeExists = await _context.VehicleTypes.AnyAsync(t => t.VehicleTypeId == request.VehicleTypeId);
            if (!typeExists)
            {
                return BadRequest(ApiResponse<object>.Fail("Invalid Vehicle Type ID."));
            }

            var vehicle = new Vehicle
            {
                VehiclePlateNumber = plateNormalized,
                VehicleDescription = request.VehicleDescription,
                Brand = request.Brand,
                Model = request.Model,
                Color = request.Color,
                VehicleTypeId = request.VehicleTypeId,
                VehicleUserId = userId
            };

            _context.Vehicles.Add(vehicle);
            await _context.SaveChangesAsync();

            // Load vehicle type relation
            await _context.Entry(vehicle).Reference(v => v.VehicleType).LoadAsync();

            var response = new VehicleResponse
            {
                VehicleId = vehicle.VehicleId,
                VehiclePlateNumber = vehicle.VehiclePlateNumber,
                VehicleDescription = vehicle.VehicleDescription,
                Brand = vehicle.Brand,
                Model = vehicle.Model,
                Color = vehicle.Color,
                VehicleTypeId = vehicle.VehicleTypeId,
                VehicleTypeName = vehicle.VehicleType.VehicleTypeName
            };

            return StatusCode(201, ApiResponse<VehicleResponse>.Ok(response, "Vehicle registered successfully."));
        }

        // PUT: api/v1/vehicles/{id:int}
        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateVehicle(int id, [FromBody] CreateVehicleRequest request)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(ApiResponse<object>.Fail("Invalid token"));
            }

            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
                return BadRequest(ApiResponse<object>.Fail(string.Join("; ", errors)));
            }

            var vehicle = await _context.Vehicles.FirstOrDefaultAsync(v => v.VehicleId == id && v.VehicleUserId == userId);
            if (vehicle == null)
            {
                return NotFound(ApiResponse<object>.Fail("Vehicle not found or does not belong to you."));
            }

            var plateNormalized = request.VehiclePlateNumber.Trim().ToUpper();

            var exists = await _context.Vehicles.AnyAsync(v => v.VehiclePlateNumber == plateNormalized && v.VehicleId != id);
            if (exists)
            {
                return Conflict(ApiResponse<object>.Fail("Plate number is already registered by another vehicle."));
            }

            vehicle.VehiclePlateNumber = plateNormalized;
            vehicle.VehicleDescription = request.VehicleDescription;
            vehicle.Brand = request.Brand;
            vehicle.Model = request.Model;
            vehicle.Color = request.Color;
            vehicle.VehicleTypeId = request.VehicleTypeId;

            await _context.SaveChangesAsync();

            await _context.Entry(vehicle).Reference(v => v.VehicleType).LoadAsync();

            var response = new VehicleResponse
            {
                VehicleId = vehicle.VehicleId,
                VehiclePlateNumber = vehicle.VehiclePlateNumber,
                VehicleDescription = vehicle.VehicleDescription,
                Brand = vehicle.Brand,
                Model = vehicle.Model,
                Color = vehicle.Color,
                VehicleTypeId = vehicle.VehicleTypeId,
                VehicleTypeName = vehicle.VehicleType.VehicleTypeName
            };

            return Ok(ApiResponse<VehicleResponse>.Ok(response, "Vehicle updated successfully."));
        }

        // DELETE: api/v1/vehicles/{id}
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteVehicle(int id)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(ApiResponse<object>.Fail("Invalid token"));
            }

            var vehicle = await _context.Vehicles.FirstOrDefaultAsync(v => v.VehicleId == id && v.VehicleUserId == userId);
            if (vehicle == null)
            {
                return NotFound(ApiResponse<object>.Fail("Vehicle not found or does not belong to you."));
            }

            // Verify if there are active parking sessions
            var activeSessionExists = await _context.ParkingSessions
                .AnyAsync(ps => ps.LicensePlateIn == vehicle.VehiclePlateNumber && ps.Status == "ACTIVE");
            if (activeSessionExists)
            {
                return UnprocessableEntity(ApiResponse<object>.Fail("Cannot delete vehicle because it is currently parked in the building."));
            }

            _context.Vehicles.Remove(vehicle);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<object>.Ok(new { }, "Vehicle deleted successfully."));
        }
    }
}
