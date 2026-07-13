namespace ParkingManagement.DTOs
{
    public class QuickPayRequestDto
    {
        public string PaymentMethod { get; set; } = "MOCK";
        public string? ReturnUrl { get; set; }
        public string? CancelUrl { get; set; }
    }
}
