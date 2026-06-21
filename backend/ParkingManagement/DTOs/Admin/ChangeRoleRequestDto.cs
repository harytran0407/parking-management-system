using Microsoft.AspNetCore.Authorization;
using System.ComponentModel.DataAnnotations;

namespace ParkingManagement.DTOs.Admin
{
    public class ChangeRoleRequestDto
    {
        [Required(ErrorMessage = "Target User ID is required")]
        public string TargetUserId { get; set; }

        [Required(ErrorMessage = "New Role ID is required")]
        [Range(1, 4, ErrorMessage = "Role ID must be between 1 (SystemAdmin) and 4 (ParkingUser)")]
        public int NewRoleId { get; set; }
    }
}
