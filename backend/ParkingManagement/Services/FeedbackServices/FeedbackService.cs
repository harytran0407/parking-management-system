using Microsoft.EntityFrameworkCore;
using Org.BouncyCastle.Asn1.Ocsp;
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
                    Title = request.Title,
                    Content = request.Content,
                    Status = "OPEN",
                    CreatedAt = DateTime.UtcNow,
                    StarRating = request.StarRating,
                    CustomerPhone = request.CustomerPhone,
                    CustomerEmail = request.CustomerEmail,
                    AttachmentUrl = request.AttachmentUrl
                };
                _context.Feedbacks.Add(feedback);
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine("\n🚨 ======= [SubmitFeedbackAsync Exception] =======");
                Console.WriteLine(ex.ToString());
                Console.WriteLine("============================================\n");
                throw;
            }
        }

        public async Task<(List<FeedbackDto> Items, int TotalItems, int TotalPages)> GetAllFeedbacksAsync(string? status, bool isManager, int page, int pageSize)
        {
            var query = _context.Feedbacks.AsQueryable();

            // Bộ lọc (Filter): Áp dụng cho tất cả các role
            if (!string.IsNullOrWhiteSpace(status))
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
                    Title = f.Title,
                    Content = f.Content,
                    Status = f.Status,
                    CreatedAt = f.CreatedAt,
                    ResolvedAt = f.ResolvedAt,
                    ResolvedBy = f.ResolvedBy,
                    ResolvedByName = string.IsNullOrEmpty(f.ResolvedBy) ? null
                        : _context.Users.Where(u => u.UserId == f.ResolvedBy)
                            .Select(u => (u.FullName != null && u.FullName != "")
                                ? u.FullName
                                : (u.Email != null && u.Email.Contains("@")
                                    ? u.Email.Substring(0, u.Email.IndexOf("@"))
                                    : u.Email))
                            .FirstOrDefault(),
                    ResponseNote = f.ResponseNote,
                    CustomerPhone = f.CustomerPhone,
                    CustomerEmail = f.CustomerEmail,
                    AttachmentUrl = f.AttachmentUrl
                })
                .ToListAsync();
            return (feedbacks, totalItems, totalPages);
        }

        public async Task<bool> ProcessFeedbackAsync(int feedbackId, string managerId, ProcessFeedbackRequestDto request)
        {
            var feedback = await _context.Feedbacks.FindAsync(feedbackId);
            if (feedback == null) return false;
            feedback.Status = request.Status.ToUpper(); // Allow input like "open, ClOsEd"
            // Update trạng thái và ghi chú
            if (!string.IsNullOrWhiteSpace(request.ResponseNote))
            {
                feedback.ResponseNote = request.ResponseNote;
            }

            feedback.ResolvedBy = managerId;

            if (feedback.Status == "RESOLVED")
            {
                feedback.ResolvedAt = DateTime.UtcNow;
            }
            else
            {
                feedback.ResolvedAt = null; 
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<FeedbackDto>> GetMyFeedbacksAsync(string userId)
        {
            var oldFeedbacks = await _context.Feedbacks
                .Where(f => f.UserId == userId)
                .OrderByDescending(f => f.CreatedAt)
                .Select(f => new FeedbackDto
                {
                    FeedbackId = f.FeedbackId,
                    UserId = f.UserId,
                    FullName = f.FullName,
                    Title = f.Title,
                    Content = f.Content,
                    Status = f.Status,
                    CreatedAt = f.CreatedAt,
                    ResolvedAt = f.ResolvedAt,
                    ResolvedBy = f.ResolvedBy,
                    ResolvedByName = string.IsNullOrEmpty(f.ResolvedBy) ? null
                        : _context.Users.Where(u => u.UserId == f.ResolvedBy)
                            .Select(u => (u.FullName != null && u.FullName != "")
                                ? u.FullName
                                : (u.Email != null && u.Email.Contains("@")
                                    ? u.Email.Substring(0, u.Email.IndexOf("@"))
                                    : u.Email))
                            .FirstOrDefault(),
                    ResponseNote = f.ResponseNote,
                    CustomerEmail = f.CustomerEmail,
                    CustomerPhone = f.CustomerPhone,
                    AttachmentUrl = f.AttachmentUrl
                }).ToListAsync();
            return oldFeedbacks;
        }
    }
}
