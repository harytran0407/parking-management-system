using System.ComponentModel.DataAnnotations;

namespace ParkingManagement.DTOs.Auth
{
    public class ForgotPasswordRequestDto
    {
        [Required(ErrorMessage = "Email and Phone number cannot be empty.")]
        public string EmailOrPhone { get; set; } = string.Empty;
    }
}
