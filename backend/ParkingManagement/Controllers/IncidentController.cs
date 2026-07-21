using Microsoft.AspNetCore.Mvc;
using ParkingManagement.DTOs;
using ParkingManagement.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ParkingManagement.Data;
using ParkingManagement.Models;
using System.IO;

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
        private readonly AppDbContext _context;

        public IncidentController(IIncidentService incidentService, AppDbContext context)
        {
            _incidentService = incidentService ?? throw new ArgumentNullException(nameof(incidentService));
            _context = context ?? throw new ArgumentNullException(nameof(context));
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
                var errors = string.Join("; ", ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage));
                return BadRequest(new { success = false, error_code = "INVALID_INPUT", message = $"Dữ liệu đầu vào không hợp lệ: {errors}" });
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

        // GET: api/v1/staff/incidents
        [HttpGet("incidents")]
        public async Task<IActionResult> GetIncidents([FromQuery] string? status, [FromQuery] string? search)
        {
            var query = _context.IncidentLogs
                .Include(i => i.ReportedByNavigation)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(i => i.Status == status);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                string lowerSearch = search.ToLower();
                query = query.Where(i => (i.Description != null && i.Description.ToLower().Contains(lowerSearch)) ||
                                         i.IssueType.ToLower().Contains(lowerSearch) ||
                                         (i.ReportedByNavigation != null && i.ReportedByNavigation.FullName != null && i.ReportedByNavigation.FullName.ToLower().Contains(lowerSearch)));
            }

            var logs = await query
                .OrderByDescending(i => i.ReportTime)
                .Select(i => new
                {
                    log_id = i.LogId,
                    session_id = i.SessionId,
                    reported_by = i.ReportedBy,
                    reporter_name = i.ReportedByNavigation != null ? (i.ReportedByNavigation.FullName ?? i.ReportedByNavigation.Username) : i.ReportedBy,
                    reporter_avatar = i.ReportedByNavigation != null ? i.ReportedByNavigation.AvatarUrl : null,
                    issue_type = i.IssueType,
                    description = i.Description,
                    report_time = i.ReportTime,
                    status = i.Status,
                    customer_phone = i.CustomerPhone,
                    customer_email = i.CustomerEmail,
                    payment_id = i.PaymentId,
                    resolved_by = i.ResolvedBy,
                    resolved_at = i.ResolvedAt
                })
                .ToListAsync();

            return Ok(new
            {
                success = true,
                data = logs
            });
        }

        // PUT: api/v1/staff/incidents/{logId}/resolve
        [HttpPut("incidents/{logId:int}/resolve")]
        public async Task<IActionResult> ResolveIncident(int logId, [FromBody] ResolveIncidentRequest? request)
        {
            var log = await _context.IncidentLogs.FirstOrDefaultAsync(i => i.LogId == logId);
            if (log == null)
            {
                return NotFound(new { success = false, message = "Incident log not found" });
            }

            if (log.Status == "RESOLVED")
            {
                return BadRequest(new { success = false, message = "Incident log is already resolved" });
            }

            string? staffId = GetCurrentStaffId();
            if (string.IsNullOrEmpty(staffId)) return UnauthorizedResponse();

            log.Status = "RESOLVED";
            log.ResolvedBy = staffId;
            log.ResolvedAt = DateTime.UtcNow;

            if (request != null && !string.IsNullOrWhiteSpace(request.Feedback))
            {
                log.Description = (log.Description ?? "") + $"\n[Feedback: {request.Feedback.Trim()}]";
            }

            await _context.SaveChangesAsync();

            try
            {
                var systemLog = new SystemLog
                {
                    LogLevel = "INFO",
                    Message = $"Staff '{staffId}' resolved incident ticket #{log.LogId}. Feedback: {request?.Feedback?.Trim() ?? "None"}.",
                    Source = "IncidentStaff",
                    CreatedAt = DateTime.UtcNow
                };
                await _context.SystemLogs.AddAsync(systemLog);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[IncidentController Error]: Could not log incident resolution. Reason: {ex.Message}");
            }

            return Ok(new
            {
                success = true,
                message = "Incident marked as resolved successfully",
                data = new
                {
                    log_id = log.LogId,
                    status = log.Status,
                    resolved_by = log.ResolvedBy,
                    resolved_at = log.ResolvedAt
                }
            });
        }

        /// <summary>
        /// POST: api/v1/staff/upload-proof
        /// Tải lên ảnh minh chứng giải quyết mất thẻ
        /// </summary>
        [HttpPost("upload-proof")]
        public async Task<IActionResult> UploadProof(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { success = false, message = "Không nhận được file tải lên." });
            }

            var extension = Path.GetExtension(file.FileName).ToLower();
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png" };
            if (!allowedExtensions.Contains(extension))
            {
                return BadRequest(new { success = false, message = "Định dạng file không hợp lệ. Chỉ hỗ trợ JPG, JPEG, PNG." });
            }

            if (file.Length > 5 * 1024 * 1024)
            {
                return BadRequest(new { success = false, message = "Kích thước tệp vượt quá giới hạn 5MB." });
            }

            var uploadFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "incidents");
            if (!Directory.Exists(uploadFolder))
            {
                Directory.CreateDirectory(uploadFolder);
            }

            var fileName = Guid.NewGuid().ToString() + extension;
            var filePath = Path.Combine(uploadFolder, fileName);
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var fileUrl = $"/uploads/incidents/{fileName}";
            return Ok(new { success = true, data = new { url = fileUrl }, message = "Tải ảnh lên thành công." });
        }
    }

    public class ResolveIncidentRequest
    {
        public string? Feedback { get; set; }
    }
}