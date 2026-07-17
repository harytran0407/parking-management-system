namespace ParkingManagement.DTOs
{
    public class ParkingHistoryItemDto
    {
        public string SessionId { get; set; } = null!;
        public string LicensePlate { get; set; } = null!;
        public string VehicleType { get; set; } = null!;
        public string SlotNumber { get; set; } = null!;
        public string ZoneName { get; set; } = null!;
        public DateTime CheckInTime { get; set; }
        public DateTime? CheckOutTime { get; set; }
        public decimal TotalFee { get; set; }
        public string PaymentStatus { get; set; } = null!; // PAID, FAILED...
        public string StaffCheckIn { get; set; } = null!;
        public string? StaffCheckOut { get; set; }
        public string Status { get; set; } = null!;
        public string? ImageUrlIn { get; set; }
        public string? ImageUrlOut { get; set; }
        public string? TicketCode { get; set; }
    }
}