using Microsoft.AspNetCore.Mvc;
using ParkingManagement.Data;
using ParkingManagement.DTOs;
using ParkingManagement.Models;
using ParkingManagement.Utils;

namespace ParkingManagement.Controllers.AuthController
{

    [Route("api/v1/auth")]

    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuthController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("register")]
        public IActionResult Register(RegisterRequestDto request)
        {
            //-- Các hàm kiểm tra tính hợp lệ của họ tên, email, số điện thoại và mật khẩu --//

            if (string.IsNullOrWhiteSpace(request.FullName) || !ValidationUtils.IsValidEmail(request.Email) ||
                    !ValidationUtils.IsValidPhoneNumber(request.PhoneNumber) || !ValidationUtils.IsValidPassword(request.Password))
            {
                return UnprocessableEntity(new
                {
                    success = false,
                    error_code = "VALIDATION_ERROR",
                    message = "Invalid input data"
                });
            }

            if (request.Password != request.ConfirmPassword)
            {
                return UnprocessableEntity(new
                {
                    success = false,
                    error_code = "PASSWORD_MISMATCH",
                    message = "Password and confirm password do not match"
                });
            }

            //-- Kiểm tra tính trùng lặp dưới Database --//

            if (_context.Users.Any(u => u.Email == request.Email))
            {
                return Conflict(new
                {
                    success = false,
                    error_code = "EMAIL_ALREADY_EXISTS",
                    message = "Email is already registered"
                });
            }

            if (_context.Users.Any(u => u.Phone == request.PhoneNumber))
            {
                return Conflict(new
                {
                    success = false,
                    error_code = "PHONE_ALREADY_EXISTS",
                    message = "Phone number is already registered"
                });
            }

            //-- Tạo mới người dùng và lưu vào Database --//
            var newUser = new User
            {
                UserId = "usr_" + DateTime.Now.ToString("yyMMddHHmmss"),
                FullName = request.FullName,
                Email = request.Email,
                Phone = request.PhoneNumber,
                Password = request.Password,
                Username = "user_" + Guid.NewGuid().ToString("N").Substring(0, 8),
                RoleId = 4,
                Status = "ACTIVE",
                CreatedAt = DateTime.Now
            };
            _context.Users.Add(newUser);
            _context.SaveChanges();

            var responseData = new
            {
                success = true,
                message = "Registration successful",
                data = new
                {
                    user_id = newUser.UserId,
                    full_name = newUser.FullName,
                    email = newUser.Email,
                    phone_number = newUser.Phone,
                    role = "ParkingUser",
                    created_at = newUser.CreatedAt.Value.ToString("yyyy-MM-ddTHH:mm:ssZ")
                }
            };

            return StatusCode(201, responseData);
        }

        [HttpPost("update-username")]
        public IActionResult UpdateUsername(UpdateUserNameDto request)
        {
            // Kiểm trả Format
            if (!ValidationUtils.IsValidUsername(request.NewUsername))
            {
                return UnprocessableEntity(new
                {
                    success = false,
                    error_code = "VALIDATION_ERROR",
                    message = "Invalid username format"
                });
            }

            // Tìm User tồn tại
            var userExist = _context.Users.FirstOrDefault(u => u.UserId == request.UserId);
            if (userExist == null)
            {
                return NotFound(new
                {
                    success = false,
                    error_code = "USER_NOT_FOUND",
                    message = "Account not found"
                });
            }

            bool isUsernameExist = _context.Users.Any(u =>
        u.Username == request.NewUsername && u.UserId != request.UserId);

            // Check trùng lặp (bỏ qua username chính mình)
            if (isUsernameExist)
            {
                return Conflict(new
                {
                    success = false,
                    error_code = "USERNAME_ALREADY_EXISTS",
                    message = "Username is already taken. Please choose another one."
                });
            }

            // Cập nhật username và lưu vào Database
            userExist.Username = request.NewUsername;
            _context.SaveChanges();

            return Ok(new
            {
                success = true,
                message = "Username updated successfully",
                data = new
                {
                    user_id = userExist.UserId,
                    username = userExist.Username
                }
            });
        }
    }
}
