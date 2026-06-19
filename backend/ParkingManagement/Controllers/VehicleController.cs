// NOTE: The Vehicle table has been removed from the new database schema.
// This controller now only exposes the VehicleType lookup endpoint needed by the booking form.
// The old CRUD endpoints (/api/v1/vehicles) return 410 Gone.

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ParkingManagement.Data;
using ParkingManagement.DTOs.Building;
using ParkingManagement.Models;

namespace ParkingManagement.Controllers
{
    [ApiController]
    [Authorize]
    public class VehicleController : ControllerBase
    {
        private readonly AppDbContext _context;

        public VehicleController(AppDbContext context)
        {
            _context = context;
        }

        // ─── GET all vehicle types (used by booking form dropdown) ────────────
        // GET: api/v1/vehicle-types
        [HttpGet("api/v1/vehicle-types")]
        [AllowAnonymous]
        public async Task<IActionResult> GetVehicleTypes()
        {
            var types = await _context.VehicleTypes
                .OrderBy(t => t.VehicleTypeId)
                .Select(t => new { t.VehicleTypeId, t.VehicleTypeName })
                .ToListAsync();

            return Ok(ApiResponse<object>.Ok(types));
        }

        // ─── DEPRECATED: old vehicle CRUD routes now return 410 Gone ─────────

        [HttpGet("api/v1/vehicles")]
        [Obsolete]
        public IActionResult GetMyVehicles_Deprecated()
            => StatusCode(410, ApiResponse<object>.Fail(
                "The /api/v1/vehicles endpoint has been removed. " +
                "Vehicle information is now entered directly when creating a booking."));

        [HttpPost("api/v1/vehicles")]
        [Obsolete]
        public IActionResult RegisterVehicle_Deprecated()
            => StatusCode(410, ApiResponse<object>.Fail(
                "The /api/v1/vehicles endpoint has been removed. " +
                "Vehicle information is now entered directly when creating a booking."));

        [HttpPut("api/v1/vehicles/{id:int}")]
        [Obsolete]
        public IActionResult UpdateVehicle_Deprecated(int id)
            => StatusCode(410, ApiResponse<object>.Fail(
                "The /api/v1/vehicles endpoint has been removed. " +
                "Vehicle information is now entered directly when creating a booking."));

        [HttpDelete("api/v1/vehicles/{id:int}")]
        [Obsolete]
        public IActionResult DeleteVehicle_Deprecated(int id)
            => StatusCode(410, ApiResponse<object>.Fail(
                "The /api/v1/vehicles endpoint has been removed. " +
                "Vehicle information is now entered directly when creating a booking."));
    }
}
