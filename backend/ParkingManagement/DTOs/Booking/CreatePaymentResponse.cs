namespace ParkingManagement.Dtos
{
    public class CreatePaymentResponse
    {
        public string PaymentId { get; set; } = string.Empty;
        public string PaymentUrl { get; set; } = string.Empty;
        public string? QrCode { get; set; } = null;
        public int ExpiresInSeconds { get; set; } = 0;
        public string Status { get; set; } = string.Empty;
    }
}