using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ParkingManagement.Data;
using ParkingManagement.DTOs.Admin;
using ParkingManagement.Models;
using System.Security.Claims;
using ParkingManagement.Services;
namespace ParkingManagement.Controllers
{
    [Route("api/v1/admin")]
    [ApiController]
    [Authorize(Roles = "SystemAdmin")]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ISystemConfigService _configService;

        public AdminController(AppDbContext context, ISystemConfigService configService)
        {
            _context = context;
            _configService = configService;
        }

        // ==========================================
        // 1. VIEW: LẤY DANH SÁCH TÀI KHOẢN
        // ==========================================
        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers(
            [FromQuery] int page = 1,               // Mặc định số trang hiện tại là 1
            [FromQuery] int page_size = 20,         // Hiển thị 20 người/trang
            [FromQuery] string? role = null,
            [FromQuery] string? status = null,
            [FromQuery] string? search = null)
        {
            // Khởi tạo 1 bản nháp về câu truy vấn nhưng chưa gửi xuống database liền
            var query = _context.Users.Include(u => u.Role).AsQueryable();

            // Search Filter (Nếu FE gửi về có chữ search nào không thì viết thêm vào bản nháp đang ghi dở)
            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(u => u.Email.Contains(search) ||
                u.Phone.Contains(search) ||
                u.Username.Contains(search) ||
                u.FullName.Contains(search));
            }

            // Status Filter (ACTIVE, INACTIVE, BANNED)
            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(u => u.Status == status);
            }

            // Read total to divide page
            var totalItems = await query.CountAsync(); // == SELECT COUNT(*) + điều kiện
            var totalPages = (int)Math.Ceiling(totalItems / (double)page_size); // Math.Ceiling sẽ làm tròn lên

            // Skip and take data
            var users = await query
            .Skip((page - 1) * page_size) // Bỏ qua một số lượng bản ghi nhất định ở trang đầu
            .Take(page_size)              // Sau khi đã bỏ qua, chỉ lấy đúng số lượng page_size tiếp theo mang về
            .Select(u => new
            {
                user_id = u.UserId,
                username = u.Username,
                full_name = u.FullName,
                email = u.Email,
                phone = u.Phone,
                role = u.Role != null ? u.Role.RoleName : "Unknown",
                status = u.Status,
                last_login = u.LastLogin,
                created_at = u.CreatedAt
            })
            .ToListAsync();


            return Ok(new
            {
                success = true,
                data = new
                {
                    items = users,
                    pagination = new
                    {
                        page = page,
                        page_size = page_size,
                        total_items = totalItems,
                        total_pages = totalPages
                    }
                }
            });
        }

        // ==========================================
        // 2. CREATE: TẠO USER
        // ==========================================
        [HttpPost("users")]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserRequestDto request)
        {
            var isExist = await _context.Users.AnyAsync(u =>
            u.UserId == request.UserId ||
            u.Username == request.Username ||
            u.Email == request.Email ||
            u.Phone == request.Phone);

            if (isExist)
            {
                return BadRequest(new
                {
                    success = false,
                    meesage = "UserId, Username, Email or Phone already exists."
                });
            }
            // Hashing Password
            string hasedPassword = BCrypt.Net.BCrypt.HashPassword(request.Password);

            // Join tbl Role to get Role Name
            var roleInDb = await _context.Roles.FirstOrDefaultAsync(r => r.RoleName == request.Role);
            if (roleInDb == null)
            {
                return BadRequest(new { success = false, message = "Quyền (Role) không hợp lệ." });
            }

            // Create new user
            var newUser = new User
            {
                UserId = request.UserId,
                Username = request.Username,
                FullName = request.FullName,
                Email = request.Email,
                Phone = request.Phone,
                Password = hasedPassword,
                RoleId = roleInDb.RoleId,
                Status = "ACTIVE",
                CreatedAt = DateTime.UtcNow
            };

            // Save to Database
            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            return StatusCode(201, new
            {
                success = true,
                data = new
                {
                    user_id = newUser.UserId,
                    username = newUser.Username,
                    message = "User created successfully."
                }
            });
        }

        // ==========================================
        // 3. UPDATE: CẬP NHẬT THÔNG TIN CHO USER
        // ==========================================
        [HttpPut("users/{user_id}")]
        public async Task<IActionResult> UpdateUser([FromRoute] string user_id, [FromBody] UpdateUserRequestDto request)
        {
            var userInDb = await _context.Users.FirstOrDefaultAsync(u => u.UserId == user_id);
            if (userInDb == null)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Cannot find the account."
                });
            }

            var currAdminId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userInDb.UserId == currAdminId && request.Status != "ACTIVE")
            {
                return BadRequest(new
                {
                    success = false,
                    message = "You cannot inactive your account."
                });
            }

            var roleInDb = await _context.Roles.FirstOrDefaultAsync(r => r.RoleName == request.Role);
            if (roleInDb == null)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Invalid Role."
                });
            }

            // ==========================================
            // PHÂN QUYỀN CHO ADMIN
            // ==========================================

            if (userInDb.RoleId != roleInDb.RoleId)
            {
                var auditLog = new RoleAuditLog
                {
                    AdminId = currAdminId,             // Ai là người đổi?
                    TargetUserId = userInDb.UserId,    // Đổi của ai?
                    OldRoleId = userInDb.RoleId,       // Quyền cũ
                    NewRoleId = roleInDb.RoleId,       // Quyền mới
                    ChangedAt = DateTime.UtcNow        // Thời gian đổi
                };
                _context.RoleAuditLogs.Add(auditLog);
            }
            userInDb.FullName = request.FullName;
            userInDb.Phone = request.Phone;
            userInDb.Status = request.Status;
            userInDb.RoleId = roleInDb.RoleId;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "User updated successfully."
            });
        }

        // ==========================================
        // 4. SOFT DELETE: CẬP NHẬT TRẠNG THÁI CHO USER
        // ==========================================
        [HttpDelete("user/{user_id}")]
        public async Task<IActionResult> DeleteUser([FromRoute] string user_id)
        {

            // Tìm user trong database
            var userInDb = await _context.Users.FirstOrDefaultAsync(u => u.UserId == user_id);
            if (userInDb == null)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Cannot find the account"
                });
            }

            // Chốt chặn ngăn admin tự xóa account của chính mình
            var currAdminId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userInDb.UserId == currAdminId)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "You cannot delete your account"
                });
            }

            // Soft Delete (Chuyển status từ Active => Inactive)
            userInDb.Status = "INACTIVE";
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // ==========================================
        // 5.. SEARCH: TÌM KIẾM USER THEO KEYWORD
        // ==========================================
        [HttpGet("search")]
        public async Task<IActionResult> SearchUsers(
            [FromQuery] string keyword,
            [FromQuery] int pageIndex = 1,
            [FromQuery] int pageSize = 10)
        {
            if (keyword == null || string.IsNullOrEmpty(keyword))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Keyword is required for searching."
                });
            }
            var TrimmedKeyword = keyword.Trim();
            var users = await _context.Users
                .Where(u => u.Username.Contains(TrimmedKeyword) ||
                            u.FullName.Contains(TrimmedKeyword) ||
                            u.Email.Contains(TrimmedKeyword) ||
                            u.Phone.Contains(TrimmedKeyword))
                .Select(u => new
                {
                    user_id = u.UserId,
                    username = u.Username,
                    full_name = u.FullName,
                    email = u.Email,
                    phone = u.Phone,
                    status = u.Status
                })
                .Skip((pageIndex - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(new
            {
                success = true,
                data = users
            });
        }

        // ==========================================
        // 6. SYSTEM CONFIGURATION: XEM THÔNG SỐ CỦA CẤU HÌNH
        // ==========================================
        [HttpGet("settings")]
        public async Task<IActionResult> GetSystemSettings()
        {
            var settings = await _configService.GetAllSettingsAsync();
            return Ok(new
            {
                success = true,
                data = settings
            });
        }

        // ==========================================
        // 7. SYSTEM CONFIGURATION: CẬP NHẬT THÔNG SỐ CỦA CẤU HÌNH
        // ==========================================
        [HttpPut("settings/{key}")]
        public async Task<IActionResult> UpdateSystemSetting([FromRoute] string key, [FromBody] UpdateSystemSettingDto request)
        {
            if (string.IsNullOrWhiteSpace(request.SettingValue))
            {
                return BadRequest(new { success = false, message = "Setting value cannot be empty." });
            }

            var isUpdated = await _configService.UpdateSettingAsync(key, request);
            if (!isUpdated)
            {
                return NotFound(new { success = false, message = "Setting key not found." });
            }

            return Ok(new
            {
                success = true,
                message = "System setting updated successfully."
            });
        }

        // ==========================================
        // 8. SYSTEM LOGS: XEM VÀ LỌC LỊCH SỬ HỆ THỐNG
        // ==========================================
        [HttpGet("logs")]
        public async Task<IActionResult> GetSystemLogs(
            [FromQuery] string? level = null,
            [FromQuery] int page = 1,
            [FromQuery] int page_size = 20)
        {
            var (logs, totalItems, totalPages) = await _configService.GetSystemLogsAsync(level, page, page_size);

            return Ok(new
            {
                success = true,
                data = new
                {
                    items = logs,
                    pagination = new
                    {
                        page = page,
                        page_size = page_size,
                        total_items = totalItems,
                        total_pages = totalPages
                    }
                }
            });
        }
    }
}
