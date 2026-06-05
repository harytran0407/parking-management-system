using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace ParkingManagement.DTOs.Auth
{
    public class UpdateProfileRequestDto //Dùng để nhận dữ liệu từ Front-end gửi về
    {
        // [Required(ErrorMessage = "Username is required.")]
        // public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "Full name is required.")]
        public string FullName { get; set; } = string.Empty;

        // [Required(ErrorMessage = "Email is required.")]

        // [EmailAddress(ErrorMessage = "Invalid email format.")]
        // public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Phone number is required.")]
        public string Phone { get; set; } = string.Empty;

        public IFormFile? Avatar { get; set; } // Cho phép người dùng cập nhật ảnh đại diện (avatar)
    }
}