using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ParkingManagement.DTOs.Admin
{
    public class CreateUserRequestDto
    {
        [Required(ErrorMessage = "Vui lòng nhập ID người dùng.")]
        [JsonPropertyName("user_id")]
        public string UserId { get; set; } = string.Empty;

        [Required(ErrorMessage = "Vui lòng nhập Username.")]
        [JsonPropertyName("username")]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "Vui lòng nhập mật khẩu.")]
        [JsonPropertyName("password")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "Vui lòng nhập họ và tên.")]
        [JsonPropertyName("full_name")]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Vui lòng nhập email.")]
        [EmailAddress(ErrorMessage = "Email không hợp lệ.")]
        [JsonPropertyName("email")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Vui lòng nhập số điện thoại.")]
        [JsonPropertyName("phone")]
        public string Phone { get; set; } = string.Empty;

        [Required(ErrorMessage = "Vui lòng cấp quyền (Role).")]
        [JsonPropertyName("role")]
        public string Role { get; set; } = string.Empty;
    }

    public class UpdateUserRequestDto
    {
        [Required(ErrorMessage = "Vui lòng nhập họ và tên.")]
        [JsonPropertyName("full_name")]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Vui lòng nhập số điện thoại.")]
        [JsonPropertyName("phone")]
        public string Phone { get; set; } = string.Empty;

        // Dùng biến này để khóa (INACTIVE) hoặc mở khóa (ACTIVE)
        [Required(ErrorMessage = "Vui lòng cập nhật trạng thái.")]
        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;

        [Required(ErrorMessage = "Vui lòng cấp quyền (Role).")]
        [JsonPropertyName("role")]
        public string Role { get; set; } = string.Empty;
    }
}
