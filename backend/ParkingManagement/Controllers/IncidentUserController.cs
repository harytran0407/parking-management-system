using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ParkingManagement.Data;
using ParkingManagement.DTOs.Building;
using ParkingManagement.DTOs.Incident;
using ParkingManagement.Models;
using System;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace ParkingManagement.Controllers
{
    [ApiController]
    [Route("api/v1/user/incidents")]
    [Authorize]
    public class IncidentUserController : ControllerBase
    {
        private readonly AppDbContext _context;

        public IncidentUserController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/v1/user/incidents
        [HttpGet]
        public async Task<IActionResult> GetMyIncidents()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(ApiResponse<object>.Fail("Invalid token"));
            }

            var logs = await _context.IncidentLogs
                .Where(i => i.ReportedBy == userId)
                .OrderByDescending(i => i.ReportTime)
                .Select(i => new IncidentResponse
                {
                    LogId = i.LogId,
                    IssueType = i.IssueType,
                    Description = i.Description,
                    ReportTime = i.ReportTime,
                    Status = i.Status,
                    CustomerPhone = i.CustomerPhone,
                    CustomerEmail = i.CustomerEmail,
                    ResolvedBy = i.ResolvedBy,
                    ResolvedAt = i.ResolvedAt
                })
                .ToListAsync();

            return Ok(ApiResponse<List<IncidentResponse>>.Ok(logs));
        }

        // POST: api/v1/user/incidents
        [HttpPost]
        public async Task<IActionResult> ReportIncident([FromBody] CreateIncidentRequest request)
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

            var log = new IncidentLog
            {
                ReportedBy = userId,
                IssueType = request.IssueType,
                Description = request.Description,
                ReportTime = DateTime.UtcNow,
                Status = "OPEN",
                CustomerPhone = request.CustomerPhone,
                CustomerEmail = request.CustomerEmail
            };

            _context.IncidentLogs.Add(log);
            await _context.SaveChangesAsync();

            var response = new IncidentResponse
            {
                LogId = log.LogId,
                IssueType = log.IssueType,
                Description = log.Description,
                ReportTime = log.ReportTime,
                Status = log.Status,
                CustomerPhone = log.CustomerPhone,
                CustomerEmail = log.CustomerEmail
            };

            return StatusCode(201, ApiResponse<IncidentResponse>.Ok(response, "Incident ticket reported successfully."));
        }

        // POST: api/v1/user/incidents/upload
        [HttpPost("upload")]
        public async Task<IActionResult> UploadAttachment(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(ApiResponse<object>.Fail("No file uploaded"));
            }

            var extension = Path.GetExtension(file.FileName).ToLower();
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".pdf", ".txt", ".doc", ".docx" };
            if (!allowedExtensions.Contains(extension))
            {
                return BadRequest(ApiResponse<object>.Fail("Invalid file type. Allowed: JPG, JPEG, PNG, PDF, TXT, DOC, DOCX"));
            }

            // Max size 5MB
            if (file.Length > 5 * 1024 * 1024)
            {
                return BadRequest(ApiResponse<object>.Fail("File size exceeds 5MB limit"));
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
            return Ok(ApiResponse<object>.Ok(new { url = fileUrl }, "File uploaded successfully"));
        }
    }
}
