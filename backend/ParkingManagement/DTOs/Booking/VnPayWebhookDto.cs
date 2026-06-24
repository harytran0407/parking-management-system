namespace ParkingManagement.Dtos
{
    public class VnPayWebhookDto
    {
        public string vnp_Amount { get; set; } = null!;
        public string vnp_ResponseCode { get; set; } = null!;
        public string vnp_TxnRef { get; set; } = null!;
        public string vnp_SecureHash { get; set; } = null!;
    }
}