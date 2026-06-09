using Microsoft.AspNetCore.Mvc;
using ParkingManagement.DTOs;
using ParkingManagement.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

namespace ParkingManagement.Controllers
{
    /// <summary>
    /// Controller tiếp nhận và xử lý các sự cố, ngoại lệ thực tế phát sinh trong bãi xe từ phía nhân viên (Staff)
    /// </summary>
    [ApiController]
    [Route("api/v1/staff")] 
    [Authorize(Roles = "ParkingStaff")] // Chỉ nhân viên bãi xe mới được thực hiện các thao tác xử lý sự cố này
    public class IncidentController : ControllerBase
    {
        private readonly IIncidentService _incidentService;

        public IncidentController(IIncidentService incidentService)
        {
            _incidentService = incidentService ?? throw new ArgumentNullException(nameof(incidentService));
        }

        /// <summary>
        /// Helper lấy StaffId bảo mật từ JWT Token (Claims) của người dùng đang đăng nhập
        /// </summary>
        private string? GetCurrentStaffId()
        {
            return User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                   ?? User.FindFirst("sub")?.Value;
        }

        /// <summary>
        /// Helper trả về phản hồi chuẩn khi Token hết hạn hoặc không hợp lệ
        /// </summary>
        private IActionResult UnauthorizedResponse()
        {
            return StatusCode(StatusCodes.Status401Unauthorized, new
            {
                success = false,
                error_code = "UNAUTHORIZED_ACCESS",
                message = "Phiên làm việc đã hết hạn hoặc không hợp lệ, vui lòng đăng nhập lại."
            });
        }

        // XỬ LÝ MẤT THẺ XE
        [HttpPost("lost-ticket")]
        public async Task<IActionResult> HandleLostTicket([FromBody] LostTicketRequestDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, error_code = "INVALID_INPUT", message = "Dữ liệu đầu vào không hợp lệ." });
            }

            string? staffId = GetCurrentStaffId();
            if (string.IsNullOrEmpty(staffId)) return UnauthorizedResponse();

            try
            {
                var response = await _incidentService.HandleLostTicketAsync(dto, staffId);
                return Ok(response);
            }
            catch (KeyNotFoundException ex) when (ex.Message == "ACTIVE_SESSION_NOT_FOUND")
            {
                return NotFound(new
                {
                    success = false,
                    error_code = "ACTIVE_SESSION_NOT_FOUND",
                    message = $"Không tìm thấy phiên đỗ xe nào đang hoạt động cho biển số [{dto.LicensePlate}] trong bãi."
                });
            }
            catch (InvalidOperationException ex) when (ex.Message == "PRICING_POLICY_NOT_CONFIGURED")
            {
                return StatusCode(StatusCodes.Status422UnprocessableEntity, new
                {
                    success = false,
                    error_code = "PRICING_POLICY_NOT_CONFIGURED",
                    message = "Hệ thống chưa cấu hình bảng giá/phí phạt mất thẻ cho loại phương tiện này."
                });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { success = false, error_code = "SERVER_ERROR", message = ex.Message });
            }
        }

        // SỬA SAI LỆCH THÔNG TIN XE / KHỚP LỆCH OCR
        [HttpPost("correct-mismatch")]
        public async Task<IActionResult> CorrectMismatch([FromBody] MismatchCorrectionRequestDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, error_code = "INVALID_INPUT", message = "Dữ liệu đầu vào không hợp lệ." });
            }

            string? staffId = GetCurrentStaffId();
            if (string.IsNullOrEmpty(staffId)) return UnauthorizedResponse();

            try
            {
                var response = await _incidentService.CorrectMismatchAsync(dto, staffId);
                return Ok(response);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { success = false, error_code = "NOT_FOUND", message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, error_code = "BAD_REQUEST", message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { success = false, error_code = "SERVER_ERROR", message = ex.Message });
            }
        }        
    }
}