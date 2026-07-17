using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ParkingManagement.DTOs.Booking;
using ParkingManagement.Services.BookingServices;
using System.Security.Claims;
using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using System.Linq;

namespace ParkingManagement.Controllers;

[ApiController]
[Route("api/v1/bookings")]
public class BookingController : ControllerBase
{
    private readonly IBookingService _service;

    public BookingController(IBookingService service)
    {
        _service = service;
    }

    // GET /api/v1/bookings/price-estimate
    // AC2: Price recalculates in realtime — frontend gọi mỗi khi user thay đổi thời gian
    [HttpGet("price-estimate")]
    [Authorize]
    [ProducesResponseType(typeof(BookingPriceResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPriceEstimate([FromQuery] BookingPriceRequest request)
    {
        try
        {
            var result = await _service.GetPriceEstimateAsync(request);
            return Ok(new { success = true, data = result });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    // POST /api/v1/bookings
    // AC1: Date-time picker data từ frontend gửi lên
    // AC3: Validate không chọn thời gian trong quá khứ
    // AC4: Validate minimum booking duration
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(BookingResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> CreateBooking([FromBody] CreateBookingRequest request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage);
            return BadRequest(new { success = false, message = string.Join("; ", errors) });
        }

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException("Invalid token");

        try
        {
            var data = await _service.CreateBookingAsync(userId, request);
            return StatusCode(201, new { success = true, message = "Booking created successfully.", data });
        }
        catch (InvalidOperationException ex) when (ex.Message == "PHONE_REQUIRED")
        {
            return BadRequest(new { success = false, error_code = "PHONE_REQUIRED", message = "Số điện thoại là bắt buộc để thực hiện đặt chỗ." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    // GET /api/v1/bookings/my
    // Lấy danh sách booking của user hiện tại
    [HttpGet("my")]
    [Authorize]
    [ProducesResponseType(typeof(List<BookingResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyBookings()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException("Invalid token");

        var data = await _service.GetMyBookingsAsync(userId);
        return Ok(new { success = true, data });
    }

    // PUT /api/v1/bookings/{bookingId}/cancel
    [HttpPut("{bookingId}/cancel")]
    [Authorize]
    [ProducesResponseType(typeof(BookingResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> CancelBooking(string bookingId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException("Invalid token");

        var data = await _service.CancelBookingAsync(bookingId, userId);
        return Ok(new { success = true, message = "Booking cancelled.", data });
    }

    /* ─── ADDED BY ANTIGRAVITY (REQUIRED FOR FRONTEND BACKWARD COMPATIBILITY) ─── */

    // GET: api/v1/bookings/stats
    [HttpGet("stats")]
    [Authorize]
    [ProducesResponseType(typeof(BookingDashboardStatsResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBookingStats()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException("Invalid token");

        var data = await _service.GetBookingStatsAsync(userId);
        return Ok(new { success = true, data });
    }

    // GET: api/v1/bookings/active
    [HttpGet("active")]
    [Authorize]
    [ProducesResponseType(typeof(List<BookingResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetActiveBookings()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException("Invalid token");

        var data = await _service.GetActiveBookingsAsync(userId);
        return Ok(new { success = true, data });
    }

    // GET: api/v1/bookings/history
    [HttpGet("history")]
    [Authorize]
    [ProducesResponseType(typeof(List<BookingResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBookingHistory()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException("Invalid token");

        var data = await _service.GetBookingHistoryAsync(userId);
        return Ok(new { success = true, data });
    }



    // PUT: api/v1/bookings/{bookingId}/pay
    [HttpPut("{bookingId}/pay")]
    [Authorize]
    [ProducesResponseType(typeof(BookingResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> PayBooking(string bookingId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException("Invalid token");

        var data = await _service.PayBookingAsync(bookingId, userId);
        return Ok(new { success = true, message = "Booking paid successfully.", data });
    }

    // PUT: api/v1/bookings/{bookingId}/unlock
    [HttpPut("{bookingId}/unlock")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UnlockBooking(string bookingId)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? throw new UnauthorizedAccessException("Invalid token");

            var success = await _service.UnlockBookingAsync(bookingId, userId);
            if (success)
            {
                return Ok(new { success = true, message = "Xe đã được mở khóa thành công." });
            }
            return BadRequest(new { success = false, message = "Không thể mở khóa xe tại thời điểm này. Đơn đỗ xe có thể đã kết thúc hoặc không tồn tại." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    // PUT: api/v1/bookings/{bookingId}/lock
    [HttpPut("{bookingId}/lock")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> LockBooking(string bookingId)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? throw new UnauthorizedAccessException("Invalid token");

            var success = await _service.LockBookingAsync(bookingId, userId);
            if (success)
            {
                return Ok(new { success = true, message = "Xe đã được khóa thành công." });
            }
            return BadRequest(new { success = false, message = "Không thể khóa xe tại thời điểm này. Đơn đỗ xe có thể đã kết thúc hoặc không tồn tại." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    // GET: api/v1/bookings/{bookingId}
    [HttpGet("{bookingId}")]
    [Authorize]
    [ProducesResponseType(typeof(BookingResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetBookingById(string bookingId)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? throw new UnauthorizedAccessException("Invalid token");

            var data = await _service.GetBookingByIdAsync(bookingId, userId);
            return Ok(new { success = true, data });
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { success = false, message = "Không tìm thấy thông tin đặt chỗ." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    // GET: api/v1/bookings/capacity-status?vehicle_type_id=1
    // Kiểm tra xem loại xe đó còn slot để book không (chưa vượt 50% cap)
    [HttpGet("capacity-status")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBookingCapacityStatus([FromQuery] int vehicle_type_id)
    {
        var data = await _service.GetBookingCapacityStatusAsync(vehicle_type_id);
        return Ok(new { success = true, data });
    }

    // GET: api/v1/bookings/staff-all
    [HttpGet("staff-all")]
    [Authorize(Roles = "ParkingStaff,ParkingManager,SystemAdmin")]
    [ProducesResponseType(typeof(List<StaffBookingResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStaffBookings()
    {
        try
        {
            var data = await _service.GetStaffBookingsAsync();
            return Ok(new { success = true, data });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }
}