namespace ParkingManagement.DTOs.Admin
{
    public class UpdateUserRequestDto
    {
        public string FullName { get; set; } = null!;
        public string Phone { get; set; } = null!;
        public string Status { get; set; } = null!;
        public string Role { get; set; } = null!;
    }
}
