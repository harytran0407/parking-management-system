using Microsoft.EntityFrameworkCore;
using ParkingManagement.Data;
using ParkingManagement.DTOs.Feedback;
using ParkingManagement.Models;

namespace ParkingManagement.Services.FeedbackServices
{
    public class FeedbackService : IFeedbackSerivce
    {
        private readonly AppDbContext _context;

        public FeedbackService(AppDbContext context)
        {
            _context = context;
        }
        public async Task<bool> SubmitFeedbackAsync(string? userId, SubmitFeedbackRequestDto request)
        {
            try
            {
                var feedback = new Feedback
                {
                    UserId = userId,
                    FullName = request.FullName,
                    IdCardNumber = request.IdCardNumber,
                    Title = request.Title,
                    Content = request.Content,
                    Status = "OPEN",
                    CreatedAt = DateTime.UtcNow,
                    StarRating = request.StarRating
                };
                _context.Feedbacks.Add(feedback);
                await _context.SaveChangesAsync();
                return true;
            } catch
            {
                return false;
            }
        }

        public async Task<(List<FeedbackDto> Items, int TotalItems, int TotalPages)> GetAllFeedbacksAsync(string? status, int page, int pageSize)
        {
            var query = _context.Feedbacks.AsQueryable();

            // Lọc theo trạng thái nếu Manager yêu cầu (VD: Chỉ xem các đơn OPEN)
            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(f => f.Status.ToUpper() == status.ToUpper());
            }

            var totalItems = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

            var feedbacks = await query
                .OrderByDescending(f => f.CreatedAt)    // Sort theo thời gian tạo mới nhất
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(f => new FeedbackDto
                {
                    FeedbackId = f.FeedbackId,
                    UserId = f.UserId,
                    FullName = f.FullName,
                    IdCardNumber = f.IdCardNumber,
                    Title = f.Title,
                    Content = f.Content,
                    Status = f.Status,
                    CreatedAt = f.CreatedAt,
                    ResolvedAt = f.ResolvedAt,
                    ResolvedBy = f.ResolvedBy,
                    ResponseNote = f.ResponseNote
                })
                .ToListAsync();
            return (feedbacks, totalItems, totalPages);
        }

        public async Task<bool> ProcessFeedbackAsync(int feedbackId, string managerId, ProcessFeedbackRequestDto request)
        {
            var feedback = await _context.Feedbacks.FindAsync(feedbackId);
            if (feedback == null) return false;
            feedback.Status = request.Status.Replace(" ", "_").ToUpper(); // Allow input like "IN_PROGRESS", "in_progress", "In Progress"
            // Update trạng thái và ghi chú
            if (!string.IsNullOrWhiteSpace(request.ResponseNote))
            {
                feedback.ResponseNote = request.ResponseNote;
            }

            feedback.ResolvedBy = managerId;

            if (feedback.Status == "RESOLVED" || feedback.Status == "CLOSED")
            {
                feedback.ResolvedAt = DateTime.UtcNow;
            }
            else
            {
                feedback.ResolvedAt = null; // Trường hợp status đang là "IN_PROGRESS"
            }

            await _context.SaveChangesAsync();
            return true;
        }
    }
}
