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
        public int ZoneId { get; set; }
        public string ZoneName { get; set; } = null!;
        public int Floor { get; set; }
        public decimal CurrentFee { get; set; }
        public string Status { get; set; } = null!;
        public string PaymentStatus { get; set; } = null!;
        public string? BookingId { get; set; }
        public int? GracePeriodRemainingSeconds { get; set; }
        public string? VehicleTypeName { get; set; }
        public DateTime? ExpectedArrival { get; set; }
        public DateTime? ExpiredAt { get; set; }
        public string? BookingStatus { get; set; }
        public bool IsOverdue { get; set; }
        public int OverdueMinutes { get; set; }
        public decimal OverdueFee { get; set; }
    }
}