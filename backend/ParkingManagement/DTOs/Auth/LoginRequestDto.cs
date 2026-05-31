namespace ParkingManagement.DTOs.Auth
{
    public class LoginRequestDto
    {
        public string EmailOrPhone { get; set; } = null!;
        public string Password { get; set; } = null!;
    }
}
