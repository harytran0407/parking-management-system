using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ParkingManagement.DTOs.Building;
using ParkingManagement.DTOs.Feedback;
using ParkingManagement.Models;
using ParkingManagement.Services.FeedbackServices;
using System.Security.Claims;

namespace ParkingManagement.Controllers
{
    [Route("api/v1/feedbacks")]
    [ApiController]
    public class FeedbackController : ControllerBase
    {
        private readonly IFeedbackSerivce _feedbackService;

        public FeedbackController(IFeedbackSerivce feedbackService)
        {
            _feedbackService = feedbackService;
        }

        // ==========================================
        // 1. CREATE: GỬI PHẢN HỒI (SUBMIT FEEDBACK)
        // ==========================================
        [HttpPost]
        [AllowAnonymous]
        public async Task<IActionResult> SubmitFeedback([FromBody] SubmitFeedbackRequestDto request)
        {
            // Lấy ID của người đang dùng phần mềm
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isSuccess = await _feedbackService.SubmitFeedbackAsync(userId, request);
            if (!isSuccess)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "A system error occured while saving the feedbacks"
                });
            }
            return StatusCode(201, new
            {
                success = true,
                message = "Your feedbacks has been successfully submitted, the manager will process it as soon as possible."
            });
        }

        // ==========================================
        // 2. VIEW: LẤY DANH SÁCH FEEDBACK (DÀNH CHO MANAGER)
        // ==========================================

        [HttpGet]
        [Authorize(Roles = "ParkingManager,SystemAdmin,ParkingStaff")]
        public async Task<IActionResult> GetAllFeedbacks(
            [FromQuery] string? status,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            bool isManager = User.IsInRole("ParkingManager");
            if (isManager && !string.IsNullOrEmpty(status) && status.ToUpper() == "OPEN")
            {
                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        items = new List<object>(),
                        pagination = new { page, page_size = pageSize, total_items = 0, total_pages = 0 }
                    }
                });
            }

            var (items, totalItems, totalPages) = await _feedbackService.GetAllFeedbacksAsync(status, isManager, page, pageSize);
            return Ok(new
            {
                success = true,
                data = new
                {
                    items,
                    pagination = new
                    {
                        page,
                        page_size = pageSize,
                        total_items = totalItems,
                        total_pages = totalPages
                    }
                }
            });
        }

        // ==========================================
        // 3. PROCESS: XỬ LÝ FEEDBACK (DÀNH CHO MANAGER)
        // ==========================================
        [HttpPut("{id}/process")]
        [Authorize(Roles = "ParkingManager,SystemAdmin,ParkingStaff")]
        public async Task<IActionResult> ProcessFeedback(
            [FromRoute] int id,
            [FromBody] ProcessFeedbackRequestDto request)
        {
            var managerId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (managerId == null) return Unauthorized();
            var isSuccess = await _feedbackService.ProcessFeedbackAsync(id, managerId, request);
            if (!isSuccess)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Can't find this feedback in the system"
                });
            }

            return Ok(new
            {
                success = true,
                message = "The feedback has been successfully processed."
            });
        }

        // ==========================================
        // 4. LẤY LỊCH SỬ PHẢN HỒI CỦA USER (MY FEEDBACKS)
        // ==========================================
        [HttpGet("MyFeedback")]
        [Authorize]
        public async Task<IActionResult> GetMyFeedbacks()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userId == null)
            {
                return Unauthorized(new
                {
                    success = false,
                    message = "Please log in to view your feedback history."
                });
            }

            var oldFeedbacks = await _feedbackService.GetMyFeedbacksAsync(userId);

            return Ok(new
            {
                success = true,
                data = oldFeedbacks
            });
        }

        // ==========================================
        // 5. UPLOAD FILE ĐÍNH KÈM PHẢN HỒI
        // ==========================================
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

            var uploadFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "feedbacks");
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

            var fileUrl = $"/uploads/feedbacks/{fileName}";
            return Ok(ApiResponse<object>.Ok(new { url = fileUrl }, "File uploaded successfully"));
        }

    }
}
