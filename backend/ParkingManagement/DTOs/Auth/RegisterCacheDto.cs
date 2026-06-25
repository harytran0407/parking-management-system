namespace ParkingManagement.DTOs.Auth
{
    public class RegisterCacheDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string OtpCode { get; set; } = string.Empty;
    }
}
