using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ParkingManagement.Data;
using ParkingManagement.DTOs.Admin;
using ParkingManagement.Models;
using System.Security.Claims;
namespace ParkingManagement.Controllers
{
    [Route("api/v1/admin")]
    [ApiController]
    [Authorize(Roles = "SystemAdmin")]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminController(AppDbContext context)
        {
            _context = context;
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
        [HttpPut("users")]
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
    }
}
