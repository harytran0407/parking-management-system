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
    // [Authorize] // Tạm thời tắt phân quyền toàn bộ Controller để phục vụ quá trình test
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
        // [Authorize(Roles = "ParkingStaff")] // Endpoint này thuộc nghiệp vụ của nhân viên trực cổng (Staff)
        [AllowAnonymous] // Cho phép test trực tiếp mà không cần Token
        [ProducesResponseType(typeof(CheckInResponseDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> CheckIn([FromBody] VehicleCheckInDto dto)
        {
            // Kiểm tra ràng buộc dữ liệu đầu vào (Validation chung)
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, error_code = "INVALID_VEHICLE_TYPE", message = "Loại phương tiện hoặc dữ liệu đầu vào không hợp lệ." });
            }

            try
            {
                // Giả lập Staff ID từ JWT Token (Module Auth phát triển sau sẽ bóc tách từ User.Claims)
                string staffId = "usr_001";

                var response = await _parkingService.ProcessWalkInCheckInAsync(dto, staffId);
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
        /// Endpoint xử lý tính năng Check-out cho phương tiện rời bãi xe.
        /// </summary>
        [HttpPost("check-out")]
        // [Authorize(Roles = "ParkingStaff")] // Endpoint này thuộc nghiệp vụ của nhân viên cổng ra (Staff)
        [AllowAnonymous] // Cho phép test trực tiếp mà không cần Token
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> CheckOut([FromBody] VehicleCheckOutDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, error_code = "INVALID_TICKET", message = "Thông tin dữ liệu gửi lên không hợp lệ." });
            }

            try
            {
                var response = await _parkingService.ProcessCheckOutAsync(dto);
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
            catch (InvalidOperationException ex) when (ex.Message == "PAYMENT_FAILED")
            {
                return StatusCode(StatusCodes.Status422UnprocessableEntity, new
                {
                    success = false,
                    error_code = "PAYMENT_FAILED",
                    message = "Thanh toán thất bại, vui lòng kiểm tra lại tài khoản."
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
        // [Authorize(Roles = "ParkingStaff,ParkingManager,ParkingUser")] // Thường dùng cho cả Khách xem thông tin xe và Staff tra cứu nhanh
        [AllowAnonymous] // Cho phép truy cập không cần auth để test nhanh tính năng tra cứu thông tin xe đang gửi trong bãi qua biển số
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
        /// 5.4 Pre-check-out — Calculate Fee
        /// </summary>
        [HttpGet("sessions/{session_id}/calculate-fee")]
        // [Authorize(Roles = "ParkingStaff,ParkingManager,ParkingUser")] // Phục vụ khách hàng tự check trước phí gửi xe hoặc staff tính tiền sớm
        [AllowAnonymous] // Cho phép truy cập không cần auth để test tính năng tính tiền tạm tính trước khi khách hàng ra cổng
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
        // [Authorize(Roles = "ParkingStaff,ParkingManager")] // Chỉ cho phép Nhân viên hoặc Quản lý cập nhật thủ công (bảo trì/đóng ô)
        [AllowAnonymous] // Cho phép test trực tiếp mà không cần Token để kiểm tra tính năng bảo trì ô đỗ và cập nhật trạng thái thủ công
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> UpdateSlotStatus(string slot_id, [FromBody] UpdateSlotStatusDto dto)
        {
            // Trích xuất Staff ID từ Claim
            string? staffId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;

#if DEBUG
            // Khối xử lý an toàn: Nếu chạy ở môi trường máy Local và chưa có Token, tự động cấp mã nhân viên giả lập
            if (string.IsNullOrEmpty(staffId))
            {
                staffId = "usr_001";
            }
#endif

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
        // [Authorize(Roles = "ParkingStaff,ParkingManager,ParkingUser")] // Endpoint này thường dùng cho cả Khách hàng xem tình trạng bãi xe và Staff quản lý, nhưng tạm thời để AllowAnonymous để test nhanh
        [AllowAnonymous] // Cho phép truy cập không cần auth để test tính năng hiển thị số lượng ô đỗ trống/đầy theo thời gian thực
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
        [AllowAnonymous]
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
        [AllowAnonymous]
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
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
        public async Task<IActionResult> DeleteSlot(string slotId)
        {
            await _slotManagementService.DeleteSlotAsync(slotId);
            return NoContent();
        }
    }
}