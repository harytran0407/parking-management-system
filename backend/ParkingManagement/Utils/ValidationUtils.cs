using System;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ParkingManagement.Data;

namespace ParkingManagement.Utils
{
    public static class ValidationUtils
    {
        public static bool IsValidEmail(string email)
        {
            if (string.IsNullOrEmpty(email)) return false;
            string emailPattern = @"^[a-zA-Z0-9._%+-]+@(gmail\.com|hotmail\.com|outlook\.com|yahoo\.com)$";
            return Regex.IsMatch(email, emailPattern, RegexOptions.IgnoreCase); // Cho phép 4 loại mai : Gmail, Outlook, Hotmail, yahoo
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

        public static async Task ValidateVehicleTypeConsistencyAsync(AppDbContext context, string licensePlate, int vehicleTypeId)
        {
            if (string.IsNullOrEmpty(licensePlate)) return;

            var cleanPlate = licensePlate.Replace("-", "").Replace(".", "").Replace(" ", "").ToUpper();
            var existingDifferentTypeBooking = await context.Bookings
                .FirstOrDefaultAsync(b => b.LicensePlate.Replace("-", "").Replace(".", "").Replace(" ", "").ToUpper() == cleanPlate 
                                          && b.VehicleTypeId != vehicleTypeId);

            if (existingDifferentTypeBooking != null)
            {
                if (existingDifferentTypeBooking.VehicleTypeId == 1 && vehicleTypeId == 2)
                {
                    throw new InvalidOperationException("Biển số xe này đã được đăng ký cho loại phương tiện là Xe máy. Vui lòng kiểm tra lại loại xe hoặc biển số.");
                }
                else
                {
                    var existingTypeName = existingDifferentTypeBooking.VehicleTypeId == 1 ? "Xe máy" : "Xe hơi";
                    throw new InvalidOperationException($"Biển số xe này đã được đăng ký cho loại phương tiện là {existingTypeName}. Vui lòng kiểm tra lại loại xe hoặc biển số.");
                }
            }
        }
    }
}

