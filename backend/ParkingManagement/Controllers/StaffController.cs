using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ParkingManagement.Data;
using ParkingManagement.DTOs;
using ParkingManagement.Models;
using ParkingManagement.Utils;
using ParkingManagement.Services.EmailServices;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace ParkingManagement.Controllers
{
    [ApiController]
    [Route("api/v1/manager/staff")]
    [Authorize(Roles = "ParkingManager,SystemAdmin")]
    public class StaffController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IEmailService _emailService;

        public StaffController(AppDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        // GET: api/v1/manager/staff
        [HttpGet]
        public async Task<IActionResult> GetStaff([FromQuery] string? search, [FromQuery] string? status)
        {
            // Find role ID for ParkingStaff dynamically
            var staffRole = await _context.Roles.FirstOrDefaultAsync(r => r.RoleName == "ParkingStaff");
            if (staffRole == null)
            {
                return NotFound(new { success = false, message = "ParkingStaff role not found in the database." });
            }

            var query = _context.Users
                .Where(u => u.RoleId == staffRole.RoleId);

            if (!string.IsNullOrWhiteSpace(search))
            {
                string lowerSearch = search.ToLower();
                query = query.Where(u => u.Username.ToLower().Contains(lowerSearch) ||
                                         (u.FullName != null && u.FullName.ToLower().Contains(lowerSearch)) ||
                                         (u.Email != null && u.Email.ToLower().Contains(lowerSearch)) ||
                                         (u.Phone != null && u.Phone.ToLower().Contains(lowerSearch)));
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(u => u.Status == status);
            }

            var staffList = await query
                .OrderByDescending(u => u.CreatedAt)
                .Select(u => new
                {
                    user_id = u.UserId,
                    username = u.Username,
                    full_name = u.FullName,
                    email = u.Email,
                    phone = u.Phone,
                    status = u.Status,
                    avatar_url = u.AvatarUrl,
                    last_login = u.LastLogin,
                    created_at = u.CreatedAt
                })
                .ToListAsync();

            return Ok(new
            {
                success = true,
                data = staffList
            });
        }

        // POST: api/v1/manager/staff
        [HttpPost]
        public async Task<IActionResult> CreateStaff([FromBody] CreateStaffDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Username) ||
                string.IsNullOrWhiteSpace(request.FullName) ||
                string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.PhoneNumber) ||
                string.IsNullOrWhiteSpace(request.Password))
            {
                return UnprocessableEntity(new
                {
                    success = false,
                    error_code = "VALIDATION_ERROR",
                    message = "All fields are required"
                });
            }

            if (!ValidationUtils.IsValidUsername(request.Username))
            {
                return UnprocessableEntity(new
                {
                    success = false,
                    error_code = "INVALID_USERNAME",
                    message = "Username must be 4-20 characters and contain only letters, numbers, dots, hyphens, or underscores"
                });
            }

            if (!ValidationUtils.IsValidEmail(request.Email))
            {
                return UnprocessableEntity(new
                {
                    success = false,
                    error_code = "INVALID_EMAIL",
                    message = "Invalid email format"
                });
            }

            if (!ValidationUtils.IsValidPhoneNumber(request.PhoneNumber))
            {
                return UnprocessableEntity(new
                {
                    success = false,
                    error_code = "INVALID_PHONE",
                    message = "Invalid phone number (must start with 0 and contain 10 digits)"
                });
            }

            if (!ValidationUtils.IsValidPassword(request.Password))
            {
                return UnprocessableEntity(new
                {
                    success = false,
                    error_code = "WEAK_PASSWORD",
                    message = "Password must be at least 8 characters long, containing letters, numbers, and at least one special character"
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

            if (await _context.Users.AnyAsync(u => u.Username == request.Username))
            {
                return Conflict(new
                {
                    success = false,
                    error_code = "USERNAME_ALREADY_EXISTS",
                    message = "Username is already taken"
                });
            }

            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                return Conflict(new
                {
                    success = false,
                    error_code = "EMAIL_ALREADY_EXISTS",
                    message = "Email is already registered"
                });
            }

            if (await _context.Users.AnyAsync(u => u.Phone == request.PhoneNumber))
            {
                return Conflict(new
                {
                    success = false,
                    error_code = "PHONE_ALREADY_EXISTS",
                    message = "Phone number is already registered"
                });
            }

            var staffRole = await _context.Roles.FirstOrDefaultAsync(r => r.RoleName == "ParkingStaff");
            if (staffRole == null)
            {
                return StatusCode(500, new { success = false, message = "ParkingStaff role not found in the database." });
            }

            string hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.Password);
            var newStaff = new User
            {
                UserId = Guid.NewGuid().ToString(),
                FullName = request.FullName,
                Email = request.Email,
                Phone = request.PhoneNumber,
                Password = hashedPassword,
                Username = request.Username,
                RoleId = staffRole.RoleId,
                Status = "ACTIVE",
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(newStaff);
            await _context.SaveChangesAsync();

            // Đọc ngôn ngữ hiện tại từ Header Accept-Language (mặc định là tiếng Việt nếu không chỉ định)
            string acceptLanguage = Request.Headers["Accept-Language"].ToString().ToLower();
            bool isEnglish = acceptLanguage.Contains("en");

            // Cấu hình Subject và Body động theo ngôn ngữ
            string emailSubject = isEnglish 
                ? "eParking - Your New Staff Account Credentials" 
                : "eParking - Thông tin đăng nhập tài khoản nhân viên";

            string emailBody = isEnglish 
                ? $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;'>
                    <h2 style='color: #1e3a8a; text-align: center;'>Welcome to eParking!</h2>
                    <p>Hello <strong>{newStaff.FullName}</strong>,</p>
                    <p>Your parking staff account has been successfully created by the Manager. Below are your login credentials:</p>
                    <div style='background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;'>
                        <p style='margin: 5px 0;'><strong>Username:</strong> <code style='font-size: 15px; color: #b45309; font-weight: bold;'>{newStaff.Username}</code></p>
                        <p style='margin: 5px 0;'><strong>Login Email:</strong> <code style='font-size: 15px; color: #b45309; font-weight: bold;'>{newStaff.Email}</code></p>
                        <p style='margin: 5px 0;'><strong>Password:</strong> <code style='font-size: 15px; color: #b45309; font-weight: bold;'>{request.Password}</code></p>
                    </div>
                    <p style='color: #ef4444; font-weight: bold;'>Security Notice:</p>
                    <ul style='color: #4b5563; padding-left: 20px;'>
                        <li>Please change your password upon your first login to secure your account.</li>
                        <li>Do not share these credentials with anyone.</li>
                    </ul>
                    <hr style='border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;' />
                    <p style='text-align: center; color: #9ca3af; font-size: 12px;'>This is an automated email from the eParking system. Please do not reply to this email.</p>
                </div>"
                : $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;'>
                    <h2 style='color: #1e3a8a; text-align: center;'>Chào mừng đến với hệ thống eParking!</h2>
                    <p>Xin chào <strong>{newStaff.FullName}</strong>,</p>
                    <p>Tài khoản nhân viên bãi xe của bạn đã được tạo thành công bởi Quản lý. Dưới đây là thông tin đăng nhập của bạn:</p>
                    <div style='background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;'>
                        <p style='margin: 5px 0;'><strong>Tên đăng nhập (Username):</strong> <code style='font-size: 15px; color: #b45309; font-weight: bold;'>{newStaff.Username}</code></p>
                        <p style='margin: 5px 0;'><strong>Email đăng nhập:</strong> <code style='font-size: 15px; color: #b45309; font-weight: bold;'>{newStaff.Email}</code></p>
                        <p style='margin: 5px 0;'><strong>Mật khẩu đăng nhập:</strong> <code style='font-size: 15px; color: #b45309; font-weight: bold;'>{request.Password}</code></p>
                    </div>
                    <p style='color: #ef4444; font-weight: bold;'>Lưu ý bảo mật:</p>
                    <ul style='color: #4b5563; padding-left: 20px;'>
                        <li>Vui lòng đổi mật khẩu sau khi đăng nhập lần đầu tiên để bảo vệ tài khoản.</li>
                        <li>Không chia sẻ thông tin đăng nhập này với bất kỳ ai.</li>
                    </ul>
                    <hr style='border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;' />
                    <p style='text-align: center; color: #9ca3af; font-size: 12px;'>Đây là email tự động từ hệ thống eParking. Vui lòng không trả lời email này.</p>
                </div>";

            // Gửi email bất đồng bộ (fire-and-forget) để không làm chậm API phản hồi cho Manager
            _ = _emailService.SendEmailAsync(newStaff.Email, emailSubject, emailBody);

            return StatusCode(201, new
            {
                success = true,
                message = "Staff member created successfully",
                data = new
                {
                    user_id = newStaff.UserId,
                    username = newStaff.Username,
                    full_name = newStaff.FullName,
                    email = newStaff.Email,
                    phone = newStaff.Phone,
                    status = newStaff.Status,
                    created_at = newStaff.CreatedAt
                }
            });
        }

        // PUT: api/v1/manager/staff/{userId}
        [HttpPut("{userId}")]
        public async Task<IActionResult> UpdateStaff(string userId, [FromBody] UpdateStaffDto request)
        {
            var staff = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);
            if (staff == null)
            {
                return NotFound(new { success = false, message = "Staff member not found" });
            }

            var staffRole = await _context.Roles.FirstOrDefaultAsync(r => r.RoleName == "ParkingStaff");
            if (staffRole == null || staff.RoleId != staffRole.RoleId)
            {
                return BadRequest(new { success = false, message = "User is not a staff member" });
            }

            if (string.IsNullOrWhiteSpace(request.FullName) ||
                string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.Phone))
            {
                return UnprocessableEntity(new
                {
                    success = false,
                    error_code = "VALIDATION_ERROR",
                    message = "All fields are required"
                });
            }

            if (!ValidationUtils.IsValidEmail(request.Email))
            {
                return UnprocessableEntity(new
                {
                    success = false,
                    error_code = "INVALID_EMAIL",
                    message = "Invalid email format"
                });
            }

            if (!ValidationUtils.IsValidPhoneNumber(request.Phone))
            {
                return UnprocessableEntity(new
                {
                    success = false,
                    error_code = "INVALID_PHONE",
                    message = "Invalid phone number (must start with 0 and contain 10 digits)"
                });
            }

            if (await _context.Users.AnyAsync(u => u.Email == request.Email && u.UserId != userId))
            {
                return Conflict(new
                {
                    success = false,
                    error_code = "EMAIL_ALREADY_EXISTS",
                    message = "Email is already taken by another account"
                });
            }

            if (await _context.Users.AnyAsync(u => u.Phone == request.Phone && u.UserId != userId))
            {
                return Conflict(new
                {
                    success = false,
                    error_code = "PHONE_ALREADY_EXISTS",
                    message = "Phone number is already taken by another account"
                });
            }

            staff.FullName = request.FullName;
            staff.Email = request.Email;
            staff.Phone = request.Phone;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Staff profile updated successfully",
                data = new
                {
                    user_id = staff.UserId,
                    username = staff.Username,
                    full_name = staff.FullName,
                    email = staff.Email,
                    phone = staff.Phone,
                    status = staff.Status
                }
            });
        }

        // PUT: api/v1/manager/staff/{userId}/status
        [HttpPut("{userId}/status")]
        public async Task<IActionResult> UpdateStaffStatus(string userId, [FromBody] UpdateStaffStatusDto request)
        {
            var staff = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);
            if (staff == null)
            {
                return NotFound(new { success = false, message = "Staff member not found" });
            }

            var staffRole = await _context.Roles.FirstOrDefaultAsync(r => r.RoleName == "ParkingStaff");
            if (staffRole == null || staff.RoleId != staffRole.RoleId)
            {
                return BadRequest(new { success = false, message = "User is not a staff member" });
            }

            var validStatuses = new[] { "ACTIVE", "INACTIVE", "BANNED" };
            if (!validStatuses.Contains(request.Status.ToUpper()))
            {
                return BadRequest(new { success = false, message = "Invalid status value. Must be ACTIVE, INACTIVE, or BANNED" });
            }

            staff.Status = request.Status.ToUpper();
            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = $"Staff status updated to {staff.Status} successfully",
                data = new
                {
                    user_id = staff.UserId,
                    status = staff.Status
                }
            });
        }
    }
}
