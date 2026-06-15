namespace ParkingManagement.DTOs
{
    public class ActiveSessionResponseDto
    {
        public bool Success { get; set; }
        public ActiveSessionDataDto Data { get; set; } = null!;
    }

    public class ActiveSessionDataDto
    {
        public string SessionId { get; set; } = null!;
        public string LicensePlateIn { get; set; } = null!;
        public DateTime CheckInTime { get; set; }
        public int DurationMinutes { get; set; }
        public string SlotId { get; set; } = null!;
        public string SlotName { get; set; } = null!;
        public int Floor { get; set; }
        public decimal CurrentFee { get; set; }
        public string Status { get; set; } = null!;
        public string PaymentStatus { get; set; } = null!;
        public string? BookingId { get; set; }
    }
}