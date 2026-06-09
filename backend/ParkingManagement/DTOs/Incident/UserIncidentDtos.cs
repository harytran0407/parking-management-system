using System;
using System.ComponentModel.DataAnnotations;

namespace ParkingManagement.DTOs.Incident
{
    public class CreateIncidentRequest
    {
        [Required]
        [RegularExpression("^(LOST_TICKET|WRONG_SLOT|SYSTEM_ERROR|OTHER)$", ErrorMessage = "IssueType must be one of: LOST_TICKET, WRONG_SLOT, SYSTEM_ERROR, OTHER")]
        public string IssueType { get; set; } = null!;

        [Required]
        [MaxLength(500)]
        public string Description { get; set; } = null!;

        [Required(ErrorMessage = "Customer phone number is required.")]
        [MaxLength(15)]
        public string CustomerPhone { get; set; } = null!;

        [Required(ErrorMessage = "Customer email address is required.")]
        [MaxLength(100)]
        [EmailAddress(ErrorMessage = "Invalid email address format.")]
        public string CustomerEmail { get; set; } = null!;
    }

    public class IncidentResponse
    {
        public int LogId { get; set; }
        public string IssueType { get; set; } = null!;
        public string? Description { get; set; }
        public DateTime? ReportTime { get; set; }
        public string? Status { get; set; }
        public string? CustomerPhone { get; set; }
        public string? CustomerEmail { get; set; }
        public string? ResolvedBy { get; set; }
        public DateTime? ResolvedAt { get; set; }
    }
}
