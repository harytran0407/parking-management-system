using System.ComponentModel.DataAnnotations;

namespace ParkingManagement.DTOs.Auth
{
    public class ResetPasswordRequestDto
    {
        [Required(ErrorMessage = "Email or Phone number cannot be empty.")]
        public string EmailOrPhone { get; set; } = string.Empty;

        [Required(ErrorMessage = "OTP cannot be empty.")]
        public string Otp { get; set; } = string.Empty;

        [Required(ErrorMessage = "New password cannot be empty.")]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters long.")]
        public string NewPassword { get; set; } = string.Empty;
    }
}
