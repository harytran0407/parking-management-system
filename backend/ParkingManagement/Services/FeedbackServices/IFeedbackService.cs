using ParkingManagement.DTOs.Feedback;

namespace ParkingManagement.Services.FeedbackServices
{
    public interface IFeedbackSerivce
    {
        Task<bool> SubmitFeedbackAsync(string? userId, SubmitFeedbackRequestDto request);
        Task<(List<FeedbackDto> Items, int TotalItems, int TotalPages)> GetAllFeedbacksAsync(string? status, int page, int pageSize);
        Task<bool> ProcessFeedbackAsync(int feedbackId, string managerId, ProcessFeedbackRequestDto request);
    }
}
