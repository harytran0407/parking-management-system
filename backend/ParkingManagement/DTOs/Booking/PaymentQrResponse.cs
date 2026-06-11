namespace ParkingManagement.Dtos
{
    public class PaymentQrResponse
    {
        public string PaymentId { get; set; } = string.Empty;
        public decimal AmountDue { get; set; } = decimal.Zero;
        public string QrCodeUrl { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }
}