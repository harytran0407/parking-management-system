using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ParkingManagement.DTOs.Auth
{
    public class UpdatePasswordRequestDto
    {
        [Required(ErrorMessage = "Vui lòng nhập mật khẩu cũ.")]
        [JsonPropertyName("old_password")]
        public string OldPassword { get; set; } = string.Empty;

        [Required(ErrorMessage = "Vui lòng nhập mật khẩu mới.")]
        [MinLength(6, ErrorMessage = "Mật khẩu mới phải có ít nhất 6 ký tự.")]
        [JsonPropertyName("new_password")]
        public string NewPassword { get; set; } = string.Empty;

        [Required(ErrorMessage = "Vui lòng xác nhận mật khẩu mới.")]
        [Compare("NewPassword", ErrorMessage = "Mật khẩu xác nhận không khớp.")]
        [JsonPropertyName("confirm_new_password")]
        public string ConfirmNewPassword { get; set; } = string.Empty;
    }
}
