using System.Text.RegularExpressions;

namespace ParkingManagement.Utils
{
    public static class ValidationUtils
    {
        public static bool IsValidEmail(string email)
        {
            if (string.IsNullOrEmpty(email)) return false;
            string emailPattern = @"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$";
            return Regex.IsMatch(email, emailPattern);
        }

        public static bool IsValidPhoneNumber(string phoneNumber)
        {
            if (string.IsNullOrEmpty(phoneNumber)) return false;
            string phonePattern = @"^(0[3|5|7|8|9])+([0-9]{8})$";               // Điện thoại có 10 chữ số và dùng cho Việt Nam
            return Regex.IsMatch(phoneNumber, phonePattern);
        }

        public static bool IsValidPassword(string password)
        {
            if (string.IsNullOrEmpty(password)) return false;
            string passwordPattern = @"^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$"; //Cho phép chứa các ký tự đặc biệt như @, $, !, %, *, ?, & giống hệt React
            return Regex.IsMatch(password, passwordPattern);
        }

        public static bool IsValidUsername(string username)
        {
            if (string.IsNullOrEmpty(username)) return false;
            string usernamePattern = @"^[a-zA-Z0-9._-]{4,20}$";                 // Username tối thiểu 3 ký tự, chỉ chứa chữ cái, số, dấu chấm, gạch dưới hoặc gạch ngang
            return Regex.IsMatch(username, usernamePattern);
        }
    }
}

