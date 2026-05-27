using System;
using System.ComponentModel.DataAnnotations;

namespace ParkingManagement.Models
{
    public class SlotStatusLog
    {
        [Key] 
        public string LogId { get; set; } = string.Empty;

        public string SlotId { get; set; } = string.Empty;
        public string OldStatus { get; set; } = string.Empty;
        public string NewStatus { get; set; } = string.Empty;
        public string ChangedByStaffId { get; set; } = string.Empty;
        public DateTime ChangedAt { get; set; }
        public string Reason { get; set; } = string.Empty;
        public int? EstimatedDurationMinutes { get; set; }
    }
}