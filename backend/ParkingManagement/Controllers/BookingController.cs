using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ParkingManagement.Data;
using ParkingManagement.DTOs.Building;
using ParkingManagement.DTOs.Booking;
using ParkingManagement.Models;
using System.Security.Claims;

namespace ParkingManagement.Controllers
{
    [ApiController]
    [Route("api/v1/bookings")]
    [Authorize]
    public class BookingController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BookingController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/v1/bookings/stats
        [HttpGet("stats")]
        public async Task<IActionResult> GetBookingStats()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(ApiResponse<object>.Fail("Invalid token"));
            }

            var totalBookings = await _context.Bookings.CountAsync(b => b.VehicleUserId == userId);

            var today = DateTime.UtcNow;
            var startOfMonth = new DateTime(today.Year, today.Month, 1);
            var thisMonthNew = await _context.Bookings.CountAsync(b => b.VehicleUserId == userId && b.BookingTime >= startOfMonth);

            var userPlates = await _context.Vehicles
                .Where(v => v.VehicleUserId == userId)
                .Select(v => v.VehiclePlateNumber)
                .ToListAsync();

            var activeSessions = await _context.ParkingSessions
                .CountAsync(ps => userPlates.Contains(ps.LicensePlateIn) && ps.Status == "ACTIVE");

            var totalCost = await _context.Payments
                .Where(p => p.UserId == userId && p.Status == "SUCCESS")
                .SumAsync(p => (decimal?)p.AmountPaid) ?? 0m;

            var stats = new BookingDashboardStatsResponse
            {
                TotalBookings = totalBookings,
                ThisMonthNew = thisMonthNew,
                ActiveSessions = activeSessions,
                TotalCost = totalCost
            };

            return Ok(ApiResponse<BookingDashboardStatsResponse>.Ok(stats));
        }

        // GET: api/v1/bookings/active
        [HttpGet("active")]
        public async Task<IActionResult> GetActiveBookings()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(ApiResponse<object>.Fail("Invalid token"));
            }

            var activeBookings = await _context.Bookings
                .Include(b => b.Vehicle)
                .ThenInclude(v => v.VehicleType)
                .Include(b => b.Slot)
                .ThenInclude(s => s.Zone)
                .Where(b => b.VehicleUserId == userId && (b.Status == "PENDING" || b.Status == "CONFIRMED"))
                .OrderBy(b => b.ExpectedArrival)
                .Select(b => new BookingResponse
                {
                    BookingId = b.BookingId,
                    VehicleUserId = b.VehicleUserId,
                    VehicleId = b.VehicleId,
                    VehiclePlateNumber = b.Vehicle != null ? b.Vehicle.VehiclePlateNumber : "N/A",
                    VehicleType = b.Vehicle != null && b.Vehicle.VehicleType != null ? b.Vehicle.VehicleType.VehicleTypeName : "Car",
                    SlotId = b.SlotId,
                    SlotName = b.Slot != null ? b.Slot.SlotName : "N/A",
                    FloorName = b.Slot != null && b.Slot.Zone != null ? $"Basement B{b.Slot.Zone.FloorNumber}" : "Basement B1",
                    ExpectedArrival = b.ExpectedArrival,
                    ExpiredAt = b.ExpiredAt,
                    BookingTime = b.BookingTime,
                    Status = b.Status,
                    Notes = b.Notes,
                    DepositPaid = b.Payments.Where(p => p.Status == "SUCCESS").Sum(p => (decimal?)p.AmountPaid) ?? 0m,
                    QrCodeData = $"Ticket_Valid_Slot_{b.SlotId}_Plate_{b.Vehicle.VehiclePlateNumber}"
                })
                .ToListAsync();

            return Ok(ApiResponse<List<BookingResponse>>.Ok(activeBookings));
        }

        // GET: api/v1/bookings/history
        [HttpGet("history")]
        public async Task<IActionResult> GetBookingHistory()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(ApiResponse<object>.Fail("Invalid token"));
            }

            var historyBookings = await _context.Bookings
                .Include(b => b.Vehicle)
                .ThenInclude(v => v.VehicleType)
                .Include(b => b.Slot)
                .ThenInclude(s => s.Zone)
                .Where(b => b.VehicleUserId == userId && (b.Status == "COMPLETED" || b.Status == "CANCELLED"))
                .OrderByDescending(b => b.BookingTime)
                .Select(b => new BookingResponse
                {
                    BookingId = b.BookingId,
                    VehicleUserId = b.VehicleUserId,
                    VehicleId = b.VehicleId,
                    VehiclePlateNumber = b.Vehicle != null ? b.Vehicle.VehiclePlateNumber : "N/A",
                    VehicleType = b.Vehicle != null && b.Vehicle.VehicleType != null ? b.Vehicle.VehicleType.VehicleTypeName : "Car",
                    SlotId = b.SlotId,
                    SlotName = b.Slot != null ? b.Slot.SlotName : "N/A",
                    FloorName = b.Slot != null && b.Slot.Zone != null ? $"Basement B{b.Slot.Zone.FloorNumber}" : "Basement B1",
                    ExpectedArrival = b.ExpectedArrival,
                    ExpiredAt = b.ExpiredAt,
                    BookingTime = b.BookingTime,
                    Status = b.Status,
                    Notes = b.Notes,
                    DepositPaid = b.Payments.Where(p => p.Status == "SUCCESS").Sum(p => (decimal?)p.AmountPaid) ?? 0m,
                    QrCodeData = $"Ticket_Valid_Slot_{b.SlotId}_Plate_{b.Vehicle.VehiclePlateNumber}"
                })
                .ToListAsync();

            return Ok(ApiResponse<List<BookingResponse>>.Ok(historyBookings));
        }

        // POST: api/v1/bookings
        [HttpPost]
        public async Task<IActionResult> CreateBooking([FromBody] CreateBookingRequest request)
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

            // Verify vehicle ownership
            var vehicle = await _context.Vehicles.FirstOrDefaultAsync(v => v.VehicleId == request.VehicleId && v.VehicleUserId == userId);
            if (vehicle == null)
            {
                return BadRequest(ApiResponse<object>.Fail("Invalid vehicle selection. The vehicle does not belong to you."));
            }

            using (var transaction = await _context.Database.BeginTransactionAsync())
            {
                try
                {
                    var slot = await _context.ParkingSlots.FirstOrDefaultAsync(s => s.SlotId == request.SlotId);
                    if (slot == null)
                    {
                        return NotFound(ApiResponse<object>.Fail("Parking slot not found."));
                    }

                    if (slot.Status != "AVAILABLE")
                    {
                        return BadRequest(ApiResponse<object>.Fail("Slot is not available. Please choose another one."));
                    }

                    // Assign and reserve slot
                    slot.Status = "RESERVED";
                    slot.LastUpdated = DateTime.UtcNow;

                    var bookingId = "BKG-" + Guid.NewGuid().ToString("N").Substring(0, 10).ToUpper();

                    var booking = new Booking
                    {
                        BookingId = bookingId,
                        VehicleUserId = userId,
                        VehicleId = request.VehicleId,
                        SlotId = request.SlotId,
                        ExpectedArrival = request.ExpectedArrival,
                        ExpiredAt = request.ExpiredAt,
                        BookingTime = DateTime.UtcNow,
                        Status = "CONFIRMED",
                        Notes = request.Notes
                    };

                    _context.Bookings.Add(booking);

                    var payment = new Payment
                    {
                        PaymentId = "PAY-" + Guid.NewGuid().ToString("N").Substring(0, 10).ToUpper(),
                        PaymentType = "BOOKING",
                        AmountDue = 10000m,
                        AmountPaid = 10000m,
                        PaymentMethod = "VNPAY",
                        PaymentTime = DateTime.UtcNow,
                        Status = "SUCCESS",
                        BookingId = bookingId,
                        UserId = userId
                    };

                    _context.Payments.Add(payment);

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    // Load relations
                    await _context.Entry(booking).Reference(b => b.Vehicle).LoadAsync();
                    await _context.Entry(booking).Reference(b => b.Slot).LoadAsync();
                    if (booking.Slot != null)
                    {
                        await _context.Entry(booking.Slot).Reference(s => s.Zone).LoadAsync();
                    }

                    var response = new BookingResponse
                    {
                        BookingId = booking.BookingId,
                        VehicleUserId = booking.VehicleUserId,
                        VehicleId = booking.VehicleId,
                        VehiclePlateNumber = booking.Vehicle != null ? booking.Vehicle.VehiclePlateNumber : "N/A",
                        VehicleType = booking.Vehicle != null && booking.Vehicle.VehicleType != null ? booking.Vehicle.VehicleType.VehicleTypeName : "Car",
                        SlotId = booking.SlotId,
                        SlotName = booking.Slot != null ? booking.Slot.SlotName : "N/A",
                        FloorName = booking.Slot != null && booking.Slot.Zone != null ? $"Basement B{booking.Slot.Zone.FloorNumber}" : "Basement B1",
                        ExpectedArrival = booking.ExpectedArrival,
                        ExpiredAt = booking.ExpiredAt,
                        BookingTime = booking.BookingTime,
                        Status = booking.Status,
                        Notes = booking.Notes,
                        DepositPaid = 10000m,
                        QrCodeData = $"Ticket_Valid_Slot_{booking.SlotId}_Plate_{booking.Vehicle?.VehiclePlateNumber}"
                    };

                    return StatusCode(201, ApiResponse<BookingResponse>.Ok(response, "Slot booked successfully."));
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    return StatusCode(500, ApiResponse<object>.Fail("System error creating booking: " + ex.Message));
                }
            }
        }

        // PUT: api/v1/bookings/{bookingId}/cancel
        [HttpPut("{bookingId}/cancel")]
        public async Task<IActionResult> CancelBooking(string bookingId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(ApiResponse<object>.Fail("Invalid token"));
            }

            var booking = await _context.Bookings
                .Include(b => b.Slot)
                .FirstOrDefaultAsync(b => b.BookingId == bookingId && b.VehicleUserId == userId);

            if (booking == null)
            {
                return NotFound(ApiResponse<object>.Fail("Booking not found."));
            }

            if (booking.Status == "CANCELLED")
            {
                return BadRequest(ApiResponse<object>.Fail("Booking is already cancelled."));
            }

            if (booking.Status == "COMPLETED")
            {
                return BadRequest(ApiResponse<object>.Fail("Cannot cancel a completed booking."));
            }

            using (var transaction = await _context.Database.BeginTransactionAsync())
            {
                try
                {
                    booking.Status = "CANCELLED";

                    if (booking.Slot != null && booking.Slot.Status == "RESERVED")
                    {
                        booking.Slot.Status = "AVAILABLE";
                        booking.Slot.LastUpdated = DateTime.UtcNow;
                    }

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return Ok(ApiResponse<object>.Ok(new { }, "Booking cancelled successfully."));
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    return StatusCode(500, ApiResponse<object>.Fail("System error cancelling booking: " + ex.Message));
                }
            }
        }

        // PUT: api/v1/bookings/{bookingId}/adjust
        [HttpPut("{bookingId}/adjust")]
        public async Task<IActionResult> AdjustBooking(string bookingId, [FromBody] AdjustBookingRequest request)
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

            var booking = await _context.Bookings
                .Include(b => b.Vehicle)
                .Include(b => b.Slot)
                .FirstOrDefaultAsync(b => b.BookingId == bookingId && b.VehicleUserId == userId);

            if (booking == null)
            {
                return NotFound(ApiResponse<object>.Fail("Booking not found."));
            }

            if (booking.Status != "CONFIRMED" && booking.Status != "PENDING")
            {
                return BadRequest(ApiResponse<object>.Fail("Cannot adjust bookings that are not in active status."));
            }

            booking.ExpectedArrival = request.ExpectedArrival;
            booking.ExpiredAt = request.ExpiredAt;

            await _context.SaveChangesAsync();

            var response = new BookingResponse
            {
                BookingId = booking.BookingId,
                VehicleUserId = booking.VehicleUserId,
                VehicleId = booking.VehicleId,
                VehiclePlateNumber = booking.Vehicle != null ? booking.Vehicle.VehiclePlateNumber : "N/A",
                VehicleType = booking.Vehicle != null && booking.Vehicle.VehicleType != null ? booking.Vehicle.VehicleType.VehicleTypeName : "Car",
                SlotId = booking.SlotId,
                SlotName = booking.Slot != null ? booking.Slot.SlotName : "N/A",
                FloorName = booking.Slot != null && booking.Slot.Zone != null ? $"Basement B{booking.Slot.Zone.FloorNumber}" : "Basement B1",
                ExpectedArrival = booking.ExpectedArrival,
                ExpiredAt = booking.ExpiredAt,
                BookingTime = booking.BookingTime,
                Status = booking.Status,
                Notes = booking.Notes,
                DepositPaid = booking.Payments.Where(p => p.Status == "SUCCESS").Sum(p => (decimal?)p.AmountPaid) ?? 0m,
                QrCodeData = $"Ticket_Valid_Slot_{booking.SlotId}_Plate_{booking.Vehicle?.VehiclePlateNumber}"
            };

            return Ok(ApiResponse<BookingResponse>.Ok(response, "Booking schedule adjusted successfully."));
        }
    }
}
