using System.ComponentModel.DataAnnotations;

namespace ParkingManagement.DTOs.Feedback
{
    public class SubmitFeedbackRequestDto
    {
        [Required(ErrorMessage = "Please enter your fullname")]
        [StringLength(100, ErrorMessage = "Fullname must not exceed 100 characters")]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Please enter your Identity Card")]
        [StringLength(20)]
        public string IdCardNumber { get; set; } = string.Empty;

        [Required(ErrorMessage = "Please enter the title to response")]
        [StringLength(100)]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Please enter the description")]
        public string Content { get; set; } = string.Empty; 
    }

    public class FeedbackDto
    {
        public int FeedbackId { get; set; }
        public string? UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string IdCardNumber { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? ResolvedAt { get; set; }
        public string? ResolvedBy { get; set; }
        public string? ResponseNote { get; set; }
    }

    public class ProcessFeedbackRequestDto
    {
        [Required(ErrorMessage = "Please provide processing status")]
        [RegularExpression(@"(?i)^(OPEN|IN_PROGRESS|IN PROGRESS|RESOLVED|CLOSED)$", ErrorMessage = "Invalid Status")]
        public string Status { get; set; } = string.Empty;

        public string? ResponseNote { get; set; }
    }
}
