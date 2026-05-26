namespace ParkingManagement.DTOs.Auth
{
    public class RegisterRequestDto
    {
        public string _email { get; set; } = null!;
        public string _phoneNumber { get; set; } = null!;
        public string _password { get; set; } = null!;
    }

    public class UpdateUserNameDto
    {
        public string _userId { get; set; } = null!;
        public string _newUsername { get; set; } = null!;
        public string _fullName { get; set; } = null!;
    }
}
