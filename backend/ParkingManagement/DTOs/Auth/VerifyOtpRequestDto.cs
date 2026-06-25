namespace ParkingManagement.DTOs.Auth
{
    public class VerifyOtpRequestDto
    {
        public string Email { get; set; } = string.Empty;
        public string OtpCode { get; set; } = string.Empty;
    }
}
