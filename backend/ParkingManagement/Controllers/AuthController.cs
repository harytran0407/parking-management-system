using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.IdentityModel.Tokens;
using ParkingManagement.Data;
using ParkingManagement.DTOs;
using ParkingManagement.DTOs.Auth;
using ParkingManagement.Models;
using ParkingManagement.Utils;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace ParkingManagement.Controllers.AuthController
{

    [Route("api/v1/auth")]

    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;

        private readonly IConfiguration _configuration;

        private readonly IMemoryCache _cache;

        public AuthController(AppDbContext context, IConfiguration configuration, IMemoryCache cache)
        {
            _context = context;
            _configuration = configuration;
            _cache = cache;
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
            string hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.Password);
            var newUser = new User
            {
                UserId = "usr_" + DateTime.Now.ToString("yyMMddHHmmssfff"),
                FullName = request.FullName,
                Email = request.Email,
                Phone = request.PhoneNumber,
                Password = hashedPassword,
                Username = "user_" + Guid.NewGuid().ToString("N").Substring(0, 8),
                RoleId = 4,
                Status = "ACTIVE",
                CreatedAt = DateTime.UtcNow
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

        [HttpPut("update-username")]
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

        [HttpPost("login")]
        public IActionResult Login([FromBody]LoginRequestDto request)
        {
            // Kiểm tra số lần thử trong cache
            string cacheKey = $"LoginAttempts_{request.EmailOrPhone}";
            int attempts = 0;

            if (_cache.TryGetValue(cacheKey, out attempts) && attempts >= 5)
            {
                return StatusCode(429, new
                {
                    success = false,
                    error_code = "TOO_MANY_ATTEMPTS",
                    message = "Too many login attempts. Please try again later"
                });
            }

                // Tìm Tài Khoản theo Email hoặc Số Điện Thoại
                var userInDb = _context.Users.FirstOrDefault(u => u.Email == request.EmailOrPhone || u.Phone == request.EmailOrPhone);

            // Kiểm tra tồn tại và xác thực mật khẩu
            if (userInDb == null || !BCrypt.Net.BCrypt.Verify(request.Password, userInDb.Password))
            {
                attempts++;
                //Lưu số lần thử vào cache với thời gian hết hạn 1 phút
                var cacheOptions = new MemoryCacheEntryOptions().SetAbsoluteExpiration(TimeSpan.FromMinutes(1));
                _cache.Set(cacheKey, attempts, cacheOptions);

                return Unauthorized(new
                {
                    success = false,
                    error_code = "INVALID_CREDENTIALS",
                    message = "Invalid email or password"
                });
            }
            // Kiểm tra trạng thái tài khoản
            if (userInDb.Status == "BANNED")
            {
                return Unauthorized(new
                {
                    success = false,
                    error_code = "ACCOUNT_LOCKED",
                    message = "Account has been locked due to multiple failed login attempts"
                });
            }

            if (userInDb.Status == "INACTIVE")
            {
                return StatusCode(403, new
                {
                    success = false,
                    error_code = "ACCOUNT_DENIED",
                    message = "Account inactive or not verified"
                });

            }

            // Lấy Role từ Database
            var roleName = _context.Roles
                .Where(r => r.RoleId == userInDb.RoleId)
                .Select(r => r.RoleName)
                .FirstOrDefault() ?? "ParkingUser";

            // Xóa số lần thử trong cache sau khi đăng nhập thành công
            _cache.Remove(cacheKey);

            // Cập nhật LastLogin
            userInDb.LastLogin = DateTime.UtcNow;
            _context.SaveChanges();

            // Tạo JWT Token
            var jwtSettings = _configuration.GetSection("Jwt");
            var key = Encoding.UTF8.GetBytes(jwtSettings["Key"] ?? "ParkingManagement_Super_Secret_Key_2026");

            var claims = new List<Claim>
    {
        new Claim(JwtRegisteredClaimNames.Sub, userInDb.UserId),
        new Claim(ClaimTypes.Email, userInDb.Email ?? ""),
        new Claim(ClaimTypes.Role, roleName),
        new Claim("session_id", Guid.NewGuid().ToString().Substring(0, 6))
    };

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddSeconds(3600),
                Issuer = jwtSettings["Issuer"],
                Audience = jwtSettings["Audience"],
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);
            var jwtToken = tokenHandler.WriteToken(token);

            return Ok(new
            {
                success = true,
                message = "Login successful",
                data = new
                {
                    token = jwtToken,
                    expires_in = 3600,
                    token_type = "Bearer",
                    user = new
                    { 
                        user_id = userInDb.UserId,
                        full_name = userInDb.FullName,
                        email = userInDb.Email,
                        role = roleName
                    }
                }
            });

        }
    }
}