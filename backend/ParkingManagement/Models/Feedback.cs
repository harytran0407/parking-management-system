using System;

namespace ParkingManagement.Models
{
    public class Feedback
    {
        public int FeedbackId { get; set; }
        public string? UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string IdCardNumber { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string Status { get; set; } = "OPEN"; 
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ResolvedAt { get; set; }
        public string? ResolvedBy { get; set; }
        public string? ResponseNote { get; set; }
        public int? StarRating { get; set; }
        public string? CustomerPhone { get; set; }
        public string? CustomerEmail { get; set; }
    }
}