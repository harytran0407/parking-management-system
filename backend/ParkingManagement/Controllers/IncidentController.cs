using Microsoft.AspNetCore.Mvc;
using ParkingManagement.DTOs;
using ParkingManagement.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using System;
using System.Threading.Tasks;

namespace ParkingManagement.Controllers
{
    /// <summary>
    /// Controller chịu trách nhiệm tiếp nhận và xử lý các sự cố, ngoại lệ trong bãi xe (Mất thẻ, hỏng hóc,...)
    /// </summary>
    [ApiController]
    [Route("api/v1/staff")] // Khớp với Endpoint /api/v1/staff/lost-ticket trong tài liệu thiết kế
    //[Authorize(Roles = "ParkingStaff")] // Sẽ bật khi hệ thống chạy phân quyền bằng JWT
    public class IncidentController : ControllerBase
    {
        private readonly IIncidentService _incidentService;

        public IncidentController(IIncidentService incidentService)
        {
            _incidentService = incidentService ?? throw new ArgumentNullException(nameof(incidentService));
        }

        /// <summary>
        /// [API 7.1] Xử lý nghiệp vụ mất thẻ xe cho khách hàng (Handle Lost Ticket)
        /// </summary>
        [HttpPost("lost-ticket")]
        public async Task<IActionResult> HandleLostTicket([FromBody] LostTicketRequestDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, error_code = "INVALID_INPUT", message = "Dữ liệu không hợp lệ." });
            }

            try
            {
                var response = await _incidentService.HandleLostTicketAsync(dto, dto.StaffId);
                return Ok(response);
            }
            catch (KeyNotFoundException ex) when (ex.Message == "ACTIVE_SESSION_NOT_FOUND")
            {
                return NotFound(new
                {
                    success = false,
                    error_code = "ACTIVE_SESSION_NOT_FOUND",
                    message = $"Không tìm thấy phiên đỗ xe nào đang hoạt động cho biển số {dto.LicensePlate} trong hệ thống."
                });
            }
            catch (InvalidOperationException ex) when (ex.Message == "PRICING_POLICY_NOT_CONFIGURED")
            {
                return StatusCode(StatusCodes.Status422UnprocessableEntity, new
                {
                    success = false,
                    error_code = "PRICING_POLICY_NOT_CONFIGURED",
                    message = "Hệ thống chưa cấu hình bảng giá phạt cho loại xe này."
                });
            }
            catch (Exception ex)
            {
                var innerMessage = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    success = false,
                    error_code = "DATABASE_UPDATE_FAILED",
                    message = "Lỗi hệ thống khi ghi nhận sự cố mất thẻ.",
                    details = innerMessage
                });
            }
        }

        [HttpPost("correct-mismatch")]
        public async Task<IActionResult> CorrectMismatch([FromBody] MismatchCorrectionRequestDto dto)
        {
            try
            {
                // Lấy staff_id từ Claims của Token JWT đã đăng nhập
                // Nếu chưa có JWT setup hoàn chỉnh, tạm thời lấy từ dto hoặc gán chuỗi test: "usr_001"
                string staffId = User.FindFirst("userId")?.Value ?? "usr_001";

                var response = await _incidentService.CorrectMismatchAsync(dto, staffId);
                return Ok(response);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "INTERNAL_SERVER_ERROR", detail = ex.Message });
            }
        }

        [HttpPost("resolve-slot-dispute")]
        public async Task<IActionResult> ResolveSlotDispute([FromBody] SlotDisputeRequestDto dto)
        {
            try
            {
                string staffId = User.FindFirst("userId")?.Value ?? "usr_001";

                var response = await _incidentService.ResolveSlotDisputeAsync(dto, staffId);
                return Ok(response);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "INTERNAL_SERVER_ERROR", detail = ex.Message });
            }
        }
    }
}