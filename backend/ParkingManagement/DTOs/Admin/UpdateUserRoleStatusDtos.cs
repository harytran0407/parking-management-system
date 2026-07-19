namespace ParkingManagement.DTOs.Admin
{
    public class UpdateUserRoleDto
    {
        public int RoleId { get; set; }
    }

    public class UpdateUserStatusDto
    {
        public string Status { get; set; } = null!;
        public string? Reason { get; set; }
    }
}
