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
        var data = await _service.GetPriceEstimateAsync(request);
        return Ok(new { success = true, data });
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

        var data = await _service.CreateBookingAsync(userId, request);
        return StatusCode(201, new { success = true, message = "Booking created successfully.", data });
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

    // PUT: api/v1/bookings/{bookingId}/adjust
    [HttpPut("{bookingId}/adjust")]
    [Authorize]
    [ProducesResponseType(typeof(BookingResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> AdjustBooking(string bookingId, [FromBody] AdjustBookingRequest request)
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

        var data = await _service.AdjustBookingAsync(bookingId, userId, request);
        return Ok(new { success = true, message = "Booking schedule adjusted successfully.", data });
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
}
