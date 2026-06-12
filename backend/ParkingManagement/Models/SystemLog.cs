using System;

namespace ParkingManagement.Models
{
    public class SystemLog
    {
        public int LogId { get; set; }
        public string LogLevel { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string? Source { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}