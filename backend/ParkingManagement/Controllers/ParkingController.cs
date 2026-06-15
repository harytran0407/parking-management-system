using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ParkingManagement.DTOs;
using ParkingManagement.DTOs.Building;
using ParkingManagement.Services;
using ParkingManagement.Services.BuildingServices;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

namespace ParkingManagement.Controllers
{
    /// <summary>
    /// Controller chịu trách nhiệm tiếp nhận và điều hướng các HTTP Request liên quan đến nghiệp vụ bãi xe.
    /// </summary>
    [ApiController]
    [Route("api/v1/parking")]
    [Authorize]
    public class ParkingController : ControllerBase
    {
        private readonly IParkingService _parkingService;
        private readonly ISlotManagementService _slotManagementService;

        public ParkingController(IParkingService parkingService, ISlotManagementService slotManagementService)
        {
            _parkingService = parkingService;
            _slotManagementService = slotManagementService;
        }

        /// <summary>
        /// Endpoint xử lý tính năng Check-in đưa phương tiện vào bãi xe.
        /// </summary>
        [HttpPost("check-in")]
        [Authorize(Roles = "ParkingStaff")] 
        [ProducesResponseType(typeof(CheckInResponseDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> CheckIn([FromBody] VehicleCheckInDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, error_code = "INVALID_VEHICLE_TYPE", message = "Loại phương tiện hoặc dữ liệu đầu vào không hợp lệ." });
            }

            string? staffId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                           ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(staffId))
            {
                return StatusCode(StatusCodes.Status401Unauthorized, new
                {
                    success = false,
                    error_code = "UNAUTHORIZED_ACCESS",
                    message = "Phiên làm việc đã hết hạn, vui lòng đăng nhập lại."
                });
            }

            try
            {
                var response = await _parkingService.ProcessCheckInAsync(dto, staffId);
                return Ok(response);
            }
            catch (InvalidOperationException ex) when (ex.Message == "ACTIVE_SESSION_EXISTS")
            {
                return StatusCode(StatusCodes.Status409Conflict, new
                {
                    success = false,
                    error_code = "ACTIVE_SESSION_EXISTS",
                    message = "Xe hiện đang ở trong bãi, vui lòng kiểm tra lại biển số."
                });
            }
            catch (InvalidOperationException ex) when (ex.Message == "NO_AVAILABLE_SLOT")
            {
                return StatusCode(StatusCodes.Status422UnprocessableEntity, new
                {
                    success = false,
                    error_code = "NO_AVAILABLE_SLOT",
                    message = "Bãi xe đã đầy chỗ cho loại phương tiện này."
                });
            }
            catch (KeyNotFoundException ex) when (ex.Message == "NO_VALID_BOOKING_FOUND_FOR_THIS_PLATE")
            {
                return StatusCode(StatusCodes.Status404NotFound, new
                {
                    success = false,
                    error_code = "NO_VALID_BOOKING_FOUND",
                    message = "Không tìm thấy đơn đặt chỗ hợp lệ cho biển số xe này tại thời điểm hiện tại."
                });
            }
            catch (InvalidOperationException ex) when (ex.Message == "BOOKED_SLOT_STATE_INVALID_OR_NOT_RESERVED")
            {
                return StatusCode(StatusCodes.Status400BadRequest, new
                {
                    success = false,
                    error_code = "BOOKED_SLOT_STATE_INVALID",
                    message = "Vị trí đỗ đã đặt trước đang ở trạng thái không hợp lệ hoặc không được bảo lưu (RESERVED)."
                });
            }
            catch (InvalidOperationException ex) when (ex.Message == "CONCURRENCY_CONFLICT")
            {
                return StatusCode(StatusCodes.Status409Conflict, new
                {
                    success = false,
                    error_code = "CONCURRENCY_CONFLICT",
                    message = "Vị trí đỗ vừa bị thay đổi trạng thái bởi một phiên làm việc khác, vui lòng thử lại."
                });
            }
            catch (Exception ex)
            {
                var innerMessage = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    success = false,
                    error_code = "SERVER_INTERNAL_ERROR",
                    message = "Hệ thống gặp sự cố trong quá trình xử lý Check-in.",
                    details = innerMessage
                });
            }
        }

        /// <summary>
        /// Endpoint xử lý tính năng Check-out chung cho cả phương tiện Vãng lai và Đặt chỗ trước.
        /// </summary>
        [HttpPost("check-out")]
        [Authorize(Roles = "ParkingStaff")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> CheckOut([FromBody] VehicleCheckOutDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, error_code = "INVALID_DATA", message = "Dữ liệu gửi lên không hợp lệ." });
            }

            string? staffId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                           ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(staffId))
            {
                return StatusCode(StatusCodes.Status401Unauthorized, new
                {
                    success = false,
                    error_code = "UNAUTHORIZED_ACCESS",
                    message = "Phiên làm việc đã hết hạn, vui lòng đăng nhập lại."
                });
            }

            if (string.IsNullOrWhiteSpace(dto.TicketCode) && string.IsNullOrWhiteSpace(dto.BookingId))
            {
                return BadRequest(new
                {
                    success = false,
                    error_code = "TICKET_OR_BOOKING_REQUIRED",
                    message = "Bắt buộc phải nhập/quét mã vé hoặc mã đặt chỗ (Booking) để thực hiện check-out."
                });
            }

            try
            {
                var response = await _parkingService.ProcessCheckOutAsync(dto, staffId);
                return Ok(response);
            }
            catch (InvalidOperationException ex) when (ex.Message == "INVALID_TICKET" || ex.Message == "ACTIVE_SESSION_NOT_FOUND")
            {
                return NotFound(new
                {
                    success = false,
                    error_code = "INVALID_TICKET",
                    message = "Không tìm thấy thông tin lượt gửi xe hoặc mã vé/mã đặt chỗ không hợp lệ."
                });
            }
            catch (InvalidOperationException ex) when (ex.Message == "PAYMENT_FAILED")
            {
                return StatusCode(StatusCodes.Status422UnprocessableEntity, new
                {
                    success = false,
                    error_code = "PAYMENT_FAILED",
                    message = "Thanh toán thất bại, vui lòng kiểm tra lại số dư tài khoản hoặc phương thức thanh toán."
                });
            }
            catch (InvalidOperationException ex) when (ex.Message == "CONCURRENCY_CONFLICT")
            {
                return StatusCode(StatusCodes.Status409Conflict, new
                {
                    success = false,
                    error_code = "CONCURRENCY_CONFLICT",
                    message = "Thao tác check-out thất bại do xung đột dữ liệu đồng thời. Vui lòng thử lại."
                });
            }
            catch (Exception ex)
            {
                var innerMessage = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    success = false,
                    error_code = "DATABASE_UPDATE_FAILED",
                    message = "Lỗi kết nối cơ sở dữ liệu, hành động chưa được ghi nhận.",
                    details = innerMessage
                });
            }
        }

        /// <summary>
        /// 5.3 Get Active Session by License Plate
        /// </summary>
        [HttpGet("sessions/active/{license_plate}")]
        [Authorize(Roles = "ParkingStaff,ParkingManager")] 
        [ProducesResponseType(typeof(ActiveSessionResponseDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetActiveSessionByLicensePlate([FromRoute(Name = "license_plate")] string licensePlate)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(licensePlate))
                {
                    return BadRequest(new { success = false, error_code = "INVALID_TICKET", message = "Biển số xe không được để trống" });
                }

                var response = await _parkingService.GetActiveSessionByLicensePlateAsync(licensePlate);
                return Ok(response);
            }
            catch (InvalidOperationException ex) when (ex.Message == "INVALID_TICKET" || ex.Message == "ACTIVE_SESSION_NOT_FOUND")
            {
                return NotFound(new
                {
                    success = false,
                    error_code = "INVALID_TICKET",
                    message = "Không tìm thấy thông tin lượt gửi xe này (Mã phiên/Vé không hợp lệ)."
                });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    success = false,
                    error_code = "DATABASE_UPDATE_FAILED",
                    message = "Lỗi kết nối cơ sở dữ liệu, hành động chưa được ghi nhận.",
                    details = ex.Message
                });
            }
        }

        /// <summary>
        /// Get Active Session by Ticket Code 
        /// </summary>
        [HttpGet("tickets/{ticket_code}/active")]
        [Authorize(Roles = "ParkingStaff,ParkingManager")]
        [ProducesResponseType(typeof(ActiveSessionResponseDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetActiveSessionByTicketCode([FromRoute(Name = "ticket_code")] string ticketCode)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(ticketCode))
                {
                    return BadRequest(new
                    {
                        success = false,
                        error_code = "INVALID_TICKET",
                        message = "Mã vé không được để trống."
                    });
                }

                var response = await _parkingService.GetActiveSessionByTicketCodeAsync(ticketCode);

                return Ok(response);
            }
            catch (InvalidOperationException ex) when (ex.Message == "INVALID_TICKET")
            {
                return NotFound(new
                {
                    success = false,
                    error_code = "INVALID_TICKET",
                    message = "Không tìm thấy thông tin lượt gửi xe nào khớp với mã vé này hoặc vé đã được thanh toán."
                });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    success = false,
                    error_code = "DATABASE_QUERY_FAILED",
                    message = "Lỗi hệ thống khi tra cứu mã vé.",
                    details = ex.Message
                });
            }
        }

        /// <summary>
        /// Get Active Session by Slot Name (Phục vụ xử lý sai lệch OCR trên Frontend)
        /// </summary>
        [HttpGet("slots/active-session/{slot_name}")]
        [Authorize(Roles = "ParkingStaff,ParkingManager")] 
        [ProducesResponseType(typeof(ActiveSessionResponseDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetActiveSessionBySlotName([FromRoute(Name = "slot_name")] string slotName)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(slotName))
                {
                    return BadRequest(new { success = false, error_code = "INVALID_SLOT", message = "Tên ô đỗ không được để trống." });
                }

                var response = await _parkingService.GetActiveSessionBySlotNameAsync(slotName);
                return Ok(response);
            }
            catch (InvalidOperationException ex) when (ex.Message == "SLOT_NOT_FOUND" || ex.Message == "ACTIVE_SESSION_NOT_FOUND")
            {
                return NotFound(new
                {
                    success = false,
                    error_code = "ACTIVE_SESSION_NOT_FOUND",
                    message = "Ô đỗ này hiện đang trống hoặc không có phiên gửi xe nào hoạt động."
                });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    success = false,
                    error_code = "DATABASE_QUERY_FAILED",
                    message = "Lỗi kết nối cơ sở dữ liệu khi truy vấn thông tin ô đỗ.",
                    details = ex.Message
                });
            }
        }

        /// <summary>
        /// 5.4 Pre-check-out — Calculate Fee
        /// </summary>
        [HttpGet("sessions/{session_id}/calculate-fee")]
        [Authorize(Roles = "ParkingStaff,ParkingManager")] // Staff và Manager được tính phí
        [ProducesResponseType(typeof(PreCheckOutResponseDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> CalculatePreCheckOutFee([FromRoute(Name = "session_id")] string sessionId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(sessionId))
                {
                    return BadRequest(new { success = false, error_code = "INVALID_TICKET", message = "Session ID không được để trống" });
                }

                var response = await _parkingService.CalculatePreCheckOutFeeAsync(sessionId);
                return Ok(response);
            }
            catch (InvalidOperationException ex) when (ex.Message == "INVALID_TICKET")
            {
                return NotFound(new
                {
                    success = false,
                    error_code = "INVALID_TICKET",
                    message = "Không tìm thấy thông tin lượt gửi xe này (Mã phiên/Vé không hợp lệ)."
                });
            }
            catch (InvalidOperationException ex) when (ex.Message == "PRICING_POLICY_NOT_CONFIGURED")
            {
                return StatusCode(StatusCodes.Status422UnprocessableEntity, new
                {
                    success = false,
                    error_code = "PRICING_POLICY_NOT_CONFIGURED",
                    message = "Chưa cấu hình chính sách giá cho loại phương tiện này."
                });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    success = false,
                    error_code = "DATABASE_UPDATE_FAILED",
                    message = "Lỗi kết nối cơ sở dữ liệu, hành động chưa được ghi nhận.",
                    details = ex.Message
                });
            }
        }

        /// <summary>
        /// [FR-GATE-05] Cập nhật trạng thái ô đỗ
        /// </summary>
        [HttpPut("slots/{slot_id}/status")]
        [Authorize(Roles = "ParkingStaff,ParkingManager")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> UpdateSlotStatus(string slot_id, [FromBody] UpdateSlotStatusDto dto)
        {
            string? staffId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(staffId))
            {
                return StatusCode(StatusCodes.Status401Unauthorized, new
                {
                    success = false,
                    error_code = "UNAUTHORIZED_ACCESS",
                    message = "Phiên làm việc đã hết hạn, vui lòng đăng nhập lại."
                });
            }

            try
            {
                dto.SlotId = slot_id;
                var response = await _parkingService.UpdateSlotStatusAsync(dto, staffId);
                return Ok(response);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { success = false, error_code = "SLOT_NOT_AVAILABLE", message = ex.Message });
            }
            catch (KeyNotFoundException)
            {
                return BadRequest(new
                {
                    success = false,
                    error_code = "SLOT_NOT_AVAILABLE",
                    message = "Ô đỗ không tồn tại, vui lòng kiểm tra lại."
                });
            }
            catch (InvalidOperationException ex) when (ex.Message == "CANNOT_MAINTAIN_OCCUPIED_SLOT")
            {
                return StatusCode(StatusCodes.Status422UnprocessableEntity, new
                {
                    success = false,
                    error_code = "CANNOT_MAINTAIN_OCCUPIED_SLOT",
                    message = "Không thể bảo trì ô đỗ đang có xe gửi."
                });
            }
            catch (InvalidOperationException ex) when (ex.Message == "CONCURRENCY_CONFLICT")
            {
                return StatusCode(StatusCodes.Status409Conflict, new
                {
                    success = false,
                    error_code = "CONCURRENCY_CONFLICT",
                    message = "Thao tác thất bại do xung đột dữ liệu đồng thời. Vui lòng thử lại."
                });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    success = false,
                    error_code = "DATABASE_UPDATE_FAILED",
                    message = "Lỗi kết nối cơ sở dữ liệu, hành động chưa được ghi nhận.",
                    details = ex.Message
                });
            }
        }

        /// <summary>
        /// 3.2 Get Parking Slots with Real-time Status
        /// </summary>
        [HttpGet("slots")]
        [Authorize(Roles = "ParkingStaff,ParkingManager")] // Staff và Manager xem tình trạng ô đỗ
        [ProducesResponseType(typeof(ParkingSlotsResponseDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetRealtimeParkingSlots([FromQuery] SlotQueryFilterDto filter)
        {
            try
            {
                // Đảm bảo dữ liệu phân trang luôn hợp lệ
                if (filter.Page < 1) filter.Page = 1;
                if (filter.PageSize < 1 || filter.PageSize > 100) filter.PageSize = 20;

                var response = await _parkingService.GetRealtimeSlotsAsync(filter);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    success = false,
                    error_code = "DATABASE_UPDATE_FAILED",
                    message = "Lỗi kết nối cơ sở dữ liệu khi truy vấn danh sách ô đỗ.",
                    details = ex.Message
                });
            }
        }
        /// <summary>
        /// Bulk create slots for a zone
        /// </summary>
        [HttpPost("slots/bulk-create")]
        [Authorize(Roles = "ParkingManager")]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> BulkCreateSlots([FromBody] BulkCreateSlotsRequest request)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage);
                return BadRequest(new { success = false, message = string.Join("; ", errors) });
            }

            var data = await _slotManagementService.BulkCreateSlotsAsync(request);
            return StatusCode(201, new { success = true, data });
        }

        /// <summary>
        /// Edit slot: is_handicap, is_electric_charging, clear session
        /// </summary>
        [HttpPut("slots/{slotId}/edit")]
        [Authorize(Roles = "ParkingManager")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> EditSlot(string slotId, [FromBody] EditSlotRequest request)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage);
                return BadRequest(new { success = false, message = string.Join("; ", errors) });
            }

            var data = await _slotManagementService.EditSlotAsync(slotId, request);
            return Ok(new { success = true, message = "Slot updated successfully.", data });
        }

        /// <summary>
        /// Delete slot — cannot delete if status != AVAILABLE
        /// </summary>
        [HttpDelete("slots/{slotId}")]
        [Authorize(Roles = "ParkingManager")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
        public async Task<IActionResult> DeleteSlot(string slotId)
        {
            await _slotManagementService.DeleteSlotAsync(slotId);
            return NoContent();
        }

        /// <summary>
        /// Lấy danh sách lịch sử đỗ xe (Các phiên đã kết thúc/đã check-out)
        /// </summary>
        [HttpGet("history")]
        [Authorize(Roles = "ParkingStaff,ParkingManager")]
        [ProducesResponseType(typeof(PagedHistoryResponseDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetParkingHistory(
            [FromQuery] ParkingHistoryFilterDto filter,
            [FromQuery(Name = "page")] int? queryPage,
            [FromQuery(Name = "pageSize")] int? queryPageSize)
        {
            if (queryPage.HasValue && queryPage.Value > 0)
            {
                filter.Page = queryPage.Value;
            }
            
            if (queryPageSize.HasValue && queryPageSize.Value > 0)
            {
                filter.PageSize = queryPageSize.Value;
            }
        
            var result = await _parkingService.GetParkingHistoryAsync(filter);
            
            return Ok(result);
        }
    }
}
