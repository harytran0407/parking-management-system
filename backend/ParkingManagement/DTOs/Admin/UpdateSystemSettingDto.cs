namespace ParkingManagement.DTOs.Admin
{
    public class UpdateSystemSettingDto
    {
        public string SettingValue { get; set; } = null!;
        public string? Description { get; set; }
    }
}
