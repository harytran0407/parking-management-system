using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
        [Authorize(Roles = "ParkingManager,SystemAdmin")]
        public async Task<IActionResult> GetAllFeedbacks(
            [FromQuery] string? status,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var (items, totalItems, totalPages) = await _feedbackService.GetAllFeedbacksAsync(status, page, pageSize);
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
        [Authorize(Roles = "ParkingManager,SystemAdmin")]
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
    }
}
