using System;

namespace ParkingManagement.DTOs
{
    public class CheckOutResponseDto
    {
        public string SessionId { get; set; } = null!;
        public string LicensePlateIn { get; set; } = null!;
        public DateTime CheckInTime { get; set; }
        public DateTime CheckOutTime { get; set; }
        public int DurationMinutes { get; set; }
        public string Status { get; set; } = null!;
        public decimal TotalFee { get; set; }
        public string PaymentStatus { get; set; } = null!;
    }
}