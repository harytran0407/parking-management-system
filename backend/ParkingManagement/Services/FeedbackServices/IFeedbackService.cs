using ParkingManagement.DTOs.Feedback;

namespace ParkingManagement.Services.FeedbackServices
{
    public interface IFeedbackSerivce
    {
        Task<bool> SubmitFeedbackAsync(string? userId, SubmitFeedbackRequestDto request);
        Task<(List<FeedbackDto> Items, int TotalItems, int TotalPages)> GetAllFeedbacksAsync(string? status, bool isManager, int page, int pageSize);
        Task<bool> ProcessFeedbackAsync(int feedbackId, string managerId, ProcessFeedbackRequestDto request);
        Task<List<FeedbackDto>> GetMyFeedbacksAsync(string userId);
    }
}
