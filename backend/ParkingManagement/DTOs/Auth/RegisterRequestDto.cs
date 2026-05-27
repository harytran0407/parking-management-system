namespace ParkingManagement.DTOs
{
    public class RegisterRequestDto
    {
        public string FullName { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string PhoneNumber { get; set; } = null!;
        public string Password { get; set; } = null!;
        public string ConfirmPassword { get; set; } = null!;
    }

    public class UpdateUserNameDto
    {
        public string UserId { get; set; } = null!;
        public string NewUsername { get; set; } = null!;
    }
}
