namespace ParkingManagement.DTOs
{
    public class UserProfileResponseDto
    {
        public string Id { get; set; } = string.Empty; 
        public string Username { get; set; } = string.Empty;
        public string FullName{ get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string AvatarUrl { get; set; } = string.Empty;
    }
}
