using Microsoft.AspNetCore.Mvc;
using ParkingManagement.DTOs;
using ParkingManagement.Services;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using System;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace ParkingManagement.Controllers
{
    /// <summary>
    /// Controller chịu trách nhiệm tiếp nhận và điều hướng các HTTP Request liên quan đến nghiệp vụ bãi xe.
    /// Thiết kế tuân thủ nghiêm ngặt bảng danh mục Business Error của hệ thống.
    /// </summary>
    [ApiController]
    [Route("api/v1/parking")]
    public class ParkingController : ControllerBase
    {
        private readonly IParkingService _parkingService;

        public ParkingController(IParkingService parkingService)
        {
            _parkingService = parkingService;
        }

        /// <summary>
        /// Endpoint xử lý tính năng Check-in đưa phương tiện vào bãi xe.
        /// </summary>
        [HttpPost("check-in")]
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
                // Giả lập Staff ID từ JWT Token (Module Auth phát triển sau)
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
                // Trả về 422 Unprocessable Entity theo bảng Business Error định nghĩa
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
                // Lỗi hệ thống Server/DB Transaction ứng với mã lỗi 500 quy định
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
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> UpdateSlotStatus(string slot_id, [FromBody] UpdateSlotStatusDto dto)
        {
            // Trích xuất Staff ID từ Claim
            string? staffId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;

#if DEBUG
            if (string.IsNullOrEmpty(staffId))
            {
                staffId = "usr_001"; // Fallback phục vụ môi trường DEV
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
    }
}