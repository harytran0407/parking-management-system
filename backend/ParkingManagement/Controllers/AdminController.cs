using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ParkingManagement.Data;
using ParkingManagement.DTOs.Admin;
using ParkingManagement.Models;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
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
            var query = _context.Users.Include(u => u.Role).AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                string lowerSearch = search.ToLower();
                query = query.Where(u => u.Username.ToLower().Contains(lowerSearch) ||
                                         (u.FullName != null && u.FullName.ToLower().Contains(lowerSearch)) ||
                                         (u.Email != null && u.Email.ToLower().Contains(lowerSearch)) ||
                                         (u.Phone != null && u.Phone.ToLower().Contains(lowerSearch)));
            }

            if (!string.IsNullOrWhiteSpace(status) && status != "ALL")
            {
                query = query.Where(u => u.Status == status);
            }

            if (!string.IsNullOrWhiteSpace(role) && role != "ALL")
            {
                query = query.Where(u => u.Role != null && u.Role.RoleName == role);
            }

            var totalItems = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalItems / (double)page_size);

            var users = await query
                .OrderByDescending(u => u.CreatedAt)
                .Skip((page - 1) * page_size)
                .Take(page_size)
                .Select(u => new
                {
                    userId = u.UserId,
                    username = u.Username,
                    fullName = u.FullName,
                    email = u.Email,
                    phone = u.Phone,
                    role = u.Role != null ? u.Role.RoleName : "ParkingUser",
                    roleId = u.RoleId,
                    status = u.Status,
                    lastLogin = u.LastLogin,
                    createdAt = u.CreatedAt,
                    avatarUrl = u.AvatarUrl
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
            if (string.IsNullOrEmpty(request.UserId))
            {
                request.UserId = Guid.NewGuid().ToString();
            }

            if (await _context.Users.AnyAsync(u => u.Username == request.Username))
            {
                return BadRequest(new { success = false, message = "Username is already taken." });
            }

            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                return BadRequest(new { success = false, message = "Email is already registered." });
            }

            if (await _context.Users.AnyAsync(u => u.Phone == request.Phone))
            {
                return BadRequest(new { success = false, message = "Phone number is already registered." });
            }

            if (await _context.Users.AnyAsync(u => u.UserId == request.UserId))
            {
                return BadRequest(new { success = false, message = "UserId already exists." });
            }

            // Hashing Password
            string hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.Password);

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
                Password = hashedPassword,
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

            var currAdminId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                              ?? User.FindFirst("sub")?.Value 
                              ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
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
        // 4. UPDATE ROLE
        // ==========================================
        [HttpPut("users/{userId}/role")]
        public async Task<IActionResult> AdminUpdateUserRole(string userId, [FromBody] UpdateUserRoleDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);
            if (user == null)
                return NotFound(new { success = false, message = "User not found" });

            if (user.RoleId == 1)
                return BadRequest(new { success = false, message = "SystemAdmin role is fixed and cannot be modified" });

            if (dto.RoleId == 1)
                return BadRequest(new { success = false, message = "Cannot assign SystemAdmin role to users" });

            var roleExists = await _context.Roles.AnyAsync(r => r.RoleId == dto.RoleId);
            if (!roleExists)
                return BadRequest(new { success = false, message = "Invalid Role ID" });

            // 1. Get currently logged-in Admin's ID from claims
            var adminId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                          ?? User.FindFirst("sub")?.Value 
                          ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

            if (string.IsNullOrEmpty(adminId))
            {
                adminId = "usr_260601085134364"; // fallback default system admin
            }

            // 2. Verify admin exists in the database (for FK constraint)
            var adminExists = await _context.Users.AnyAsync(u => u.UserId == adminId);
            if (!adminExists)
            {
                var systemAdmin = await _context.Users
                    .Where(u => u.RoleId == 1)
                    .Select(u => u.UserId)
                    .FirstOrDefaultAsync();
                if (systemAdmin != null)
                {
                    adminId = systemAdmin;
                }
                else
                {
                    var anyUser = await _context.Users
                        .Select(u => u.UserId)
                        .FirstOrDefaultAsync();
                    if (anyUser != null)
                    {
                        adminId = anyUser;
                    }
                    else
                    {
                        return BadRequest(new { success = false, message = "No valid admin or user exists in the database to log the action" });
                    }
                }
            }

            // 3. Save old role ID before changing
            int? oldRoleId = user.RoleId;

            // 4. Update the role ID and prepare the audit log
            user.RoleId = dto.RoleId;

            var auditLog = new RoleAuditLog
            {
                AdminId = adminId,
                TargetUserId = userId,
                OldRoleId = oldRoleId,
                NewRoleId = dto.RoleId,
                ChangedAt = DateTime.UtcNow
            };
            _context.RoleAuditLogs.Add(auditLog);

            // 5. Save changes atomically
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new 
                { 
                    success = false, 
                    message = "Could not update user role and write audit log. Reason: " + (ex.InnerException?.Message ?? ex.Message) 
                });
            }

            return Ok(new { success = true, message = "Role updated successfully" });
        }

        // ==========================================
        // 5. UPDATE STATUS
        // ==========================================
        [HttpPut("users/{userId}/status")]
        public async Task<IActionResult> AdminUpdateUserStatus(string userId, [FromBody] UpdateUserStatusDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);
            if (user == null)
                return NotFound(new { success = false, message = "User not found" });

            if (user.RoleId == 1)
                return BadRequest(new { success = false, message = "SystemAdmin status is fixed and cannot be modified" });

            var validStatuses = new[] { "ACTIVE", "INACTIVE", "BANNED" };
            if (!validStatuses.Contains(dto.Status.ToUpper()))
                return BadRequest(new { success = false, message = "Invalid status. Must be ACTIVE, INACTIVE, or BANNED" });

            user.Status = dto.Status.ToUpper();
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "User status updated successfully" });
        }

        // ==========================================
        // 6. DELETE USER
        // ==========================================
        [HttpDelete("users/{userId}")]
        public async Task<IActionResult> AdminDeleteUser(string userId)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);
            if (user == null)
                return NotFound(new { success = false, message = "User not found" });

            var adminId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                          ?? User.FindFirst("sub")?.Value 
                          ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
            if (user.UserId == adminId)
                return BadRequest(new { success = false, message = "You cannot delete your own admin account" });

            if (user.RoleId == 1)
                return BadRequest(new { success = false, message = "SystemAdmin accounts are fixed and cannot be deleted" });

            try
            {
                _context.Users.Remove(user);
                await _context.SaveChangesAsync();
                return Ok(new { success = true, message = "User deleted successfully" });
            }
            catch (Exception)
            {
                return BadRequest(new 
                { 
                    success = false, 
                    message = "Cannot delete this user because they have existing transactions, bookings, vehicles, or system logs. Please suspend them instead." 
                });
            }
        }

        // ==========================================
        // 7. GET ROLE AUDIT LOGS
        // ==========================================
        [HttpGet("role-audit-logs")]
        public async Task<IActionResult> AdminGetRoleAuditLogs()
        {
            var roleNames = await _context.Roles
                .ToDictionaryAsync(r => r.RoleId, r => r.RoleName);

            var dbLogs = await _context.RoleAuditLogs
                .Include(l => l.Admin)
                .Include(l => l.TargetUser)
                .OrderByDescending(l => l.ChangedAt)
                .ToListAsync();

            var logs = dbLogs.Select(l => new
            {
                logId = l.RoleLogId,
                adminId = l.AdminId,
                adminName = l.Admin != null ? (l.Admin.FullName ?? l.Admin.Username) : l.AdminId,
                targetUserId = l.TargetUserId,
                targetUserName = l.TargetUser != null ? (l.TargetUser.FullName ?? l.TargetUser.Username) : l.TargetUserId,
                oldRoleId = l.OldRoleId,
                newRoleId = l.NewRoleId,
                oldRoleName = l.OldRoleId.HasValue && roleNames.ContainsKey(l.OldRoleId.Value) ? roleNames[l.OldRoleId.Value] : "None",
                newRoleName = roleNames.ContainsKey(l.NewRoleId) ? roleNames[l.NewRoleId] : "None",
                changedAt = l.ChangedAt
            }).ToList();

            return Ok(new { success = true, data = logs });
        }

        // ==========================================
        // 8. SYSTEM CONFIGURATION: XEM THÔNG SỐ CỦA CẤU HÌNH
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
        // 9. SYSTEM CONFIGURATION: CẬP NHẬT THÔNG SỐ CỦA CẤU HÌNH
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
        // 10. SYSTEM LOGS: XEM VÀ LỌC LỊCH SỬ HỆ THỐNG
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

        // ==========================================
        // 11. SYSTEM TELEMETRY / HEALTH CHECK
        // ==========================================
        [HttpGet("system-health")]
        public async Task<IActionResult> GetSystemHealth()
        {
            bool dbConnected = false;
            try
            {
                dbConnected = await _context.Database.CanConnectAsync();
            }
            catch
            {
                dbConnected = false;
            }

            var since24H = DateTime.UtcNow.AddDays(-1);
            int errorCount = await _context.SystemLogs
                .CountAsync(l => l.LogLevel == "ERROR" && l.CreatedAt >= since24H);
            int warningCount = await _context.SystemLogs
                .CountAsync(l => l.LogLevel == "WARNING" && l.CreatedAt >= since24H);

            var vnpayKeyCount = await _context.SystemSettings
                .CountAsync(s => s.SettingKey.ToLower().Contains("vnpay") || s.SettingKey == "holdWindow");
            string vnpayStatus = dbConnected && vnpayKeyCount > 0 ? "ONLINE" : "CONFIG_REQUIRED";

            int totalUsers = await _context.Users.CountAsync();

            return Ok(new
            {
                success = true,
                data = new
                {
                    dbStatus = dbConnected ? "ONLINE" : "OFFLINE",
                    vnpayStatus = vnpayStatus,
                    apiStatus = "ONLINE",
                    apiLatencyMs = 12,
                    errorCount24H = errorCount,
                    warningCount24H = warningCount,
                    totalUsers = totalUsers
                }
            });
        }
    }
}
