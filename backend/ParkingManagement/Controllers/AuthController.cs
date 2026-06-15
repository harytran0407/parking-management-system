using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.IdentityModel.Tokens;
using ParkingManagement.Data;
using ParkingManagement.DTOs;
using ParkingManagement.DTOs.Auth;
using ParkingManagement.Models;
using ParkingManagement.Services.EmailServices;
using ParkingManagement.Utils;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Google.Apis.Auth;
using Microsoft.EntityFrameworkCore;

namespace ParkingManagement.Controllers.AuthController
{

    [Route("api/v1/auth")]

    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;

        private readonly IConfiguration _configuration;

        private readonly IMemoryCache _cache;

        private readonly IEmailService _emailService;

        public AuthController(AppDbContext context, IConfiguration configuration, IMemoryCache cache, IEmailService emailService)
        {
            _context = context;
            _configuration = configuration;
            _cache = cache;
            _emailService = emailService;
        }

        [HttpPost("register")]
        public IActionResult Register([FromBody] RegisterRequestDto request)
        {
            //-- Các hàm kiểm tra tính hợp lệ của họ tên, email, số điện thoại và mật khẩu --//
            Console.WriteLine("======= KIỂM TRA TRẠNG THÁI VALIDATION =======");
            Console.WriteLine($"1. Tên có trống không?: {string.IsNullOrWhiteSpace(request.FullName)}");
            Console.WriteLine($"2. Email hợp lệ không?: {ValidationUtils.IsValidEmail(request.Email)}");
            Console.WriteLine($"3. SĐT hợp lệ không?: {ValidationUtils.IsValidPhoneNumber(request.PhoneNumber)}");
            Console.WriteLine($"4. Mật khẩu hợp lệ không?: {ValidationUtils.IsValidPassword(request.Password)}");
            Console.WriteLine("==============================================");

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
                UserId = Guid.NewGuid().ToString(),
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
        public IActionResult Login([FromBody] LoginRequestDto request)
        {
            Console.WriteLine("\n======= KIỂM TRA TRẠNG THÁI VALIDATION LOGIN =======");
            // 1. Kiểm tra xem các trường dữ liệu có bị để trống/null từ client không
            Console.WriteLine($"1. Tài khoản (Email/SĐT) có trống không?: {string.IsNullOrWhiteSpace(request.EmailOrPhone)}");
            Console.WriteLine($"2. Mật khẩu có bị trống không?          : {string.IsNullOrWhiteSpace(request.Password)}");

            // 2. Định dạng kiểm tra (Sử dụng lại class ValidationUtils của bạn)
            Console.WriteLine($"3. Nhận diện dạng định dạng Email hợp lệ?: {ValidationUtils.IsValidEmail(request.EmailOrPhone)}");
            Console.WriteLine($"4. Nhận diện dạng định dạng SĐT hợp lệ?  : {ValidationUtils.IsValidPhoneNumber(request.EmailOrPhone)}");
            Console.WriteLine($"5. Độ phức tạp mật khẩu hợp lệ không?   : {ValidationUtils.IsValidPassword(request.Password)}");
            Console.WriteLine("====================================================\n");
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
            var secretKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY");

            if (string.IsNullOrEmpty(secretKey))
            {
                throw new InvalidOperationException("JWT_SECRET_KEY is missing in the .env file");
            }
            var issuer = jwtSettings["Issuer"];
            var audience = jwtSettings["Audience"];
            var key = Encoding.UTF8.GetBytes(secretKey);

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
                Expires = DateTime.UtcNow.AddMinutes(60),
                Issuer = issuer,
                Audience = audience,
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
                        phone = userInDb.Phone,
                        role = roleName,
                        avatar_url = userInDb.AvatarUrl ?? ""
                    }
                }
            });

        }

        [HttpPost("logout")]
        [Authorize]
        public IActionResult Logout()
        {
            // Lấy token từ header Authorization mà Frontend gửi lên
            var authorizationHeader = Request.Headers["Authorization"].FirstOrDefault();

            if (string.IsNullOrEmpty(authorizationHeader) || !authorizationHeader.StartsWith("Bearer "))
            {
                return BadRequest(new
                {
                    success = false,
                    error_code = "INVALID_TOKEN",
                    message = "Invalid token format"
                });
            }

            var token = authorizationHeader.Substring("Bearer ".Length).Trim(); //Cắt bỏ "Bearer " để lấy token thuần túy

            // Đưa token vào Blacklist trong cache với thời gian hết hạn 1 giờ. Sau 1h, Token sẽ tự hết hạn, Cache sẽ tự động xóa cho nhẹ bộ nhớ
            var cacheOptions = new MemoryCacheEntryOptions().SetAbsoluteExpiration(TimeSpan.FromHours(1));
            _cache.Set($"Blacklist_{token}", true, cacheOptions);

            return Ok(new
            {
                success = true,
                message = "Logged out successfully"
            });
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDto request)
        {
            var userInDb = _context.Users.FirstOrDefault(u => u.Email == request.EmailOrPhone || u.Phone == request.EmailOrPhone);

            if (userInDb == null)
            {
                return BadRequest(new { success = false, message = "Email or phone number not found" });
            }

            string otp = new Random().Next(100000, 999999).ToString();

            var cacheOptions = new MemoryCacheEntryOptions().SetAbsoluteExpiration(TimeSpan.FromMinutes(5));
            _cache.Set($"OTP_{request.EmailOrPhone}", otp, cacheOptions);

            // Gửi OTP qua email thực tế nếu tài khoản có email hợp lệ
            if (!string.IsNullOrEmpty(userInDb.Email) && ValidationUtils.IsValidEmail(userInDb.Email))
            {
                try
                {
                    string subject = "Smartpark - Reset Password OTP Verification";
                    string body = $@"
                        <div style='font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px; max-width: 600px;'>
                            <h2 style='color: #2563eb; text-align: center;'>Smartpark Verification Code</h2>
                            <p>Hello,</p>
                            <p>We received a request to reset your password. Please use the verification code below to proceed:</p>
                            <div style='text-align: center; margin: 30px 0;'>
                                <span style='font-size: 28px; font-weight: bold; letter-spacing: 4px; background-color: #f3f4f6; padding: 10px 24px; border-radius: 6px; border: 1px solid #e5e7eb;'>{otp}</span>
                            </div>
                            <p>This code is only valid for <strong>5 minutes</strong>. If you did not request this, please ignore this email.</p>
                            <hr style='border: none; border-top: 1px solid #eee; margin: 20px 0;' />
                            <p style='font-size: 12px; color: #666; text-align: center;'>This is an automated message, please do not reply directly to this email.</p>
                        </div>";
                    await _emailService.SendEmailAsync(userInDb.Email, subject, body);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[EMAIL_ERROR] Failed to send email to {userInDb.Email}: {ex.Message}");
                }
            }

            return Ok(new
            {
                success = true,
                message = "OTP has been sent to your Email or phone number"
            });
        }


        [HttpPost("reset-password")]
        public IActionResult ResetPassword([FromBody] ResetPasswordRequestDto request)
        {
            //Hệ thống sẽ truy soát _cache để tìm xem có phiếu yêu cầu cấp lại mật khẩu nào có đứng tên Email/SĐT
            if (!_cache.TryGetValue($"OTP_{request.EmailOrPhone}", out string? savedOtp))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "OTP has expired (over 5 minutes) or has not been requested."
                });
            }

            //Nếu hệ thống tìm thấy phiếu yêu cầu cấp lại mật khẩu, hệ thống sẽ so sánh mã OTP trên phiếu yêu cầu rồi so sánh với OTP người dùng nhập vào
            if (savedOtp != request.Otp)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Invalid OTP"
                });
            }

            //Hệ thống sẽ truy soát Database để tìm xem có tài khoản nào đứng tên Email/SĐT hay không
            var userInDb = _context.Users.FirstOrDefault(u => u.Email == request.EmailOrPhone || u.Phone == request.EmailOrPhone);
            if (userInDb == null)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Account does not exist."
                });
            }

            //Nếu hệ thống tìm thấy tài khoản đứng tên Email/SĐT, hệ thống sẽ cập nhật mật khẩu mới cho tài khoản đó rồi lưu vào Database
            userInDb.Password = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            _context.SaveChanges();
            _cache.Remove($"OTP_{request.EmailOrPhone}"); //Dù mã có hạn trong vòng 5 phút nhưng nếu user đã cập nhật mật khẩu thành công thì sẽ hủy mã OTP đó

            return Ok(new
            {
                success = true,
                message = "Password updated succesfully. Please log in again."
            });
        }

        [Authorize]
        [HttpGet("profile")]
        public IActionResult GetProfile()
        {
            // Lấy userId từ JWT Token đang gửi kèm
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new
                {
                    success = false,
                    message = "Invalid token"
                });
            }

            // Truy soát Database để lấy thông tin tài khoản
            var userInDb = _context.Users.FirstOrDefault(u => u.UserId == userId);
            if (userInDb == null)
            {
                return NotFound(new
                {
                    success = false,
                    message = "User not found."
                });
            }

            var profile = new UserProfileResponseDto
            {
                Id = userInDb.UserId,
                Username = userInDb.Username,
                FullName = userInDb.FullName ?? string.Empty,
                Email = userInDb.Email ?? string.Empty,
                Phone = userInDb.Phone ?? string.Empty,
                AvatarUrl = userInDb.AvatarUrl ?? string.Empty
            };

            return Ok(new
            {
                success = true,
                data = profile
            });
        }

        [Authorize]
        [HttpPut("profile")]
        public IActionResult UpdateProfile([FromForm] UpdateProfileRequestDto request)
        {
            // Lấy userId từ JWT Token đang gửi kèm
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new
                {
                    success = false,
                    message = "Invalid token"
                });
            }
            var userInDb = _context.Users.FirstOrDefault(u => u.UserId == userId);
            if (userInDb == null)
            {
                return NotFound(new
                {
                    success = false,
                    message = "User not found."
                });
            }

            /* -- Validation -- */

            // Dò tìm xem có tài khoản nào khác đã sử dụng Email mà người dùng đang muốn cập nhật
            // bool isEmailTaken = _context.Users.Any(u => u.Email == request.Email && u.UserId != userId);
            // if (isEmailTaken)
            // {
            //     return BadRequest(new
            //     {
            //         success = false,
            //         message = "This Email is already taken by another account"
            //     });
            // }

            // Dò tìm xem có tài khoản nào khác đã sử dụng SĐT mà người dùng đang muốn cập nhật
            bool isPhoneTaken = _context.Users.Any(u => u.Phone == request.Phone && u.UserId != userId);
            if (isPhoneTaken)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "This phone number is already taken by another account"
                });
            }

            if (request.Avatar != null && request.Avatar.Length > 0)
            {
                // BÓC TÁCH ĐUÔI FILE: Lấy phần mở rộng gốc của ảnh (Ví dụ: .png, .jpg)
                var extension = Path.GetExtension(request.Avatar.FileName);
                // BIỆN PHÁP AN TOÀN: Nếu file gốc bị truncated mất đuôi, tự động ép về đuôi .jpg chuẩn
                if (string.IsNullOrEmpty(extension))
                {
                    extension = ".jpg";
                }
                var fileName = $"{Guid.NewGuid()}_{extension}";

                var uploadFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "avatars");
                if (!Directory.Exists(uploadFolder))
                {
                    Directory.CreateDirectory(uploadFolder);
                }
                // Sử dụng luồng FileStream đồng bộ 
                var filePath = Path.Combine(uploadFolder, fileName);
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    request.Avatar.CopyTo(stream);
                }
                userInDb.AvatarUrl = $"/uploads/avatars/{fileName}";
            }

            // userInDb.Username = request.Username;
            userInDb.FullName = request.FullName;
            // userInDb.Email = request.Email;
            userInDb.Phone = request.Phone;
            _context.SaveChanges();

            return Ok(new
            {
                success = true,
                message = "Profile updated successfully",
                data = new
                {
                    avatar_url = userInDb.AvatarUrl
                }

            });
        }

        [Authorize]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequestDto request)
        {
            // 1. Lấy userId từ JWT Token
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new
                {
                    success = false,
                    error_code = "UNAUTHORIZED",
                    message = "Invalid token or session expired."
                });
            }

            // 2. Tìm tài khoản trong database
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);
            if (user == null)
            {
                return NotFound(new
                {
                    success = false,
                    error_code = "USER_NOT_FOUND",
                    message = "User not found."
                });
            }

            // 3. Kiểm tra trạng thái tài khoản
            if (user.Status == "BANNED")
            {
                return Unauthorized(new
                {
                    success = false,
                    error_code = "ACCOUNT_LOCKED",
                    message = "Account has been suspended or banned."
                });
            }
            if (user.Status == "INACTIVE")
            {
                return StatusCode(403, new
                {
                    success = false,
                    error_code = "ACCOUNT_DENIED",
                    message = "Account is inactive."
                });
            }

            // 4. Kiểm tra dữ liệu đầu vào trống
            if (string.IsNullOrWhiteSpace(request.CurrentPassword) || 
                string.IsNullOrWhiteSpace(request.NewPassword) || 
                string.IsNullOrWhiteSpace(request.ConfirmPassword))
            {
                return UnprocessableEntity(new
                {
                    success = false,
                    error_code = "VALIDATION_ERROR",
                    message = "Please fill in all required fields."
                });
            }

            // 5. Xác thực mật khẩu hiện tại
            if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.Password))
            {
                return BadRequest(new
                {
                    success = false,
                    error_code = "INVALID_CURRENT_PASSWORD",
                    message = "Incorrect current password."
                });
            }

            // 6. Kiểm tra mật khẩu mới trùng mật khẩu cũ (OWASP)
            if (request.NewPassword == request.CurrentPassword)
            {
                return BadRequest(new
                {
                    success = false,
                    error_code = "PASSWORD_REUSED",
                    message = "New password cannot be the same as your current password."
                });
            }

            // 7. Khớp mật khẩu mới và xác nhận mật khẩu
            if (request.NewPassword != request.ConfirmPassword)
            {
                return UnprocessableEntity(new
                {
                    success = false,
                    error_code = "PASSWORD_MISMATCH",
                    message = "Confirm password does not match the new password."
                });
            }

            // 8. Kiểm tra độ phức tạp của mật khẩu mới (OWASP & Regex giống Register)
            if (!ValidationUtils.IsValidPassword(request.NewPassword))
            {
                return UnprocessableEntity(new
                {
                    success = false,
                    error_code = "WEAK_PASSWORD",
                    message = "New password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters."
                });
            }

            // 9. Kiểm tra xem mật khẩu mới có chứa các thông tin nhạy cảm của người dùng hay không (OWASP)
            string newPasswordLower = request.NewPassword.ToLower();
            if (!string.IsNullOrEmpty(user.Username) && newPasswordLower.Contains(user.Username.ToLower()))
            {
                return BadRequest(new
                {
                    success = false,
                    error_code = "PASSWORD_CONTAINS_USERNAME",
                    message = "Password cannot contain your username."
                });
            }
            if (!string.IsNullOrEmpty(user.Email) && newPasswordLower.Contains(user.Email.ToLower()))
            {
                return BadRequest(new
                {
                    success = false,
                    error_code = "PASSWORD_CONTAINS_EMAIL",
                    message = "Password cannot contain your email address."
                });
            }
            if (!string.IsNullOrEmpty(user.FullName) && newPasswordLower.Contains(user.FullName.ToLower()))
            {
                return BadRequest(new
                {
                    success = false,
                    error_code = "PASSWORD_CONTAINS_NAME",
                    message = "Password cannot contain your full name."
                });
            }

            // 10. Mã hóa và lưu mật khẩu mới
            user.Password = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Password updated successfully!"
            });
        }

        [HttpPost("google-login")]
        public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequestDto request)
        {
            // 1. Rút Token ra 
            var access_Token = request.GetTokenChecked();

            // 2. Kiểm tra xem token có tồn tại hay không
            if (string.IsNullOrEmpty(access_Token))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Backend can't find the token"
                });
            }
            try
            {
                string userEmail = "";
                string userFullName = "";
                string userAvatar = "";

                // 3. PHÂN LUỒNG: Hỏi Google xem đây là ID Token hay Access Token

                // Trường hợp 1 : Nếu token bắt đầu bằng ya29 => nó là Access Token.
                if (access_Token.StartsWith("ya29"))
                {
                    var httpClient = new HttpClient();
                    var response = await httpClient.GetAsync($"https://www.googleapis.com/oauth2/v3/userinfo?access_token={access_Token}");
                    if (!response.IsSuccessStatusCode)
                    {
                        return Unauthorized(new
                        {
                            success = false,
                            message = "Invalid Google access token"
                        });
                    }
                    // Đọc kết quả google dưới dạng chuỗi thô
                    var jsonResponse = await response.Content.ReadAsStringAsync();

                    // Xử lý chuỗi JSON để lấy email, name và picture (avatar)
                    var document = System.Text.Json.JsonDocument.Parse(jsonResponse);
                    var root = document.RootElement;

                    // Lấy email, name và picture từ kết quả trả về của Google
                    userEmail = root.TryGetProperty("email", out var emailEl) ? emailEl.GetString() ?? "" : "";
                    userFullName = root.TryGetProperty("name", out var nameEl) ? nameEl.GetString() ?? "" : "";
                    userAvatar = root.TryGetProperty("picture", out var picEl) ? picEl.GetString() ?? "" : "";
                }
                else
                // Trường hợp 2: Nếu token không bắt đầu bằng ya29 => nó là ID Token (JWT Token do Google cấp)
                {
                    var clientId = _configuration["Google:ClientId"];
                    var settings = new GoogleJsonWebSignature.ValidationSettings()
                    {
                        Audience = new List<string>() { clientId ?? string.Empty }
                    };

                    var payload = await GoogleJsonWebSignature.ValidateAsync(access_Token, settings);
                    userEmail = payload.Email;
                    userFullName = payload.Name;
                    userAvatar = payload.Picture;
                }

                // 4. KIỂM TRA DATABASE VÀ LƯU NGƯỜI DÙNG
                var userInDb = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Email == userEmail);
                var roleName = "ParkingUser"; // Mặc định role khi đăng nhập bằng Google sẽ là "User".

                // Tạo một mật khẩu giả ngẫu nhiên để lưu vào Database, vì đăng nhập qua Google sẽ không có mật khẩu.
                string randomDummyPassword = Guid.NewGuid().ToString();
                string hashedDummyPassword = BCrypt.Net.BCrypt.HashPassword(randomDummyPassword);

                if (userInDb == null)
                {
                    userInDb = new User
                    {
                        UserId = Guid.NewGuid().ToString(),
                        Username = "user_" + Guid.NewGuid().ToString("N").Substring(0, 8),
                        FullName = userFullName,
                        Email = userEmail,
                        AvatarUrl = userAvatar,
                        Password = hashedDummyPassword,
                        Phone = "", // Để trống số điện thoại vì đăng nhập qua Google chưa có số điện thoại
                        RoleId = 4,
                        Status = "ACTIVE",
                        CreatedAt = DateTime.UtcNow,
                        LastLogin = DateTime.UtcNow
                        // Bỏ trống Password và Phone vì đăng nhập qua Google chưa có những cái này
                    };
                    _context.Users.Add(userInDb);
                }
                else
                {
                    // Kiểm tra trạng thái tài khoản
                    if (userInDb.Status == "BANNED")
                    {
                        return Unauthorized(new
                        {
                            success = false,
                            error_code = "ACCOUNT_LOCKED",
                            message = "Account has been suspended or banned."
                        });
                    }

                    if (userInDb.Status == "INACTIVE")
                    {
                        return StatusCode(403, new
                        {
                            success = false,
                            error_code = "ACCOUNT_DENIED",
                            message = "Account is inactive."
                        });
                    }

                    // Nếu user đã tồn tại, cập nhật LastLogin
                    userInDb.LastLogin = DateTime.UtcNow;
                    if (!string.IsNullOrEmpty(userAvatar))
                    {
                        if (string.IsNullOrEmpty(userInDb.AvatarUrl) || userInDb.AvatarUrl.StartsWith("http://") || userInDb.AvatarUrl.StartsWith("https://"))
                        {
                            userInDb.AvatarUrl = userAvatar;
                        }
                    }
                }
                await _context.SaveChangesAsync();

                if (userInDb.Role != null)
                {
                    roleName = userInDb.Role.RoleName;
                }
                else
                {
                    var dbRole = await _context.Roles.FirstOrDefaultAsync(r => r.RoleId == userInDb.RoleId);
                    if (dbRole != null)
                    {
                        roleName = dbRole.RoleName;
                    }
                }

                // 5. Tạo JWT Token cho tài khoản và trả về cho client (tương tự như trong phương thức Login)
                var jwtSettings = _configuration.GetSection("Jwt");
                var issuer = jwtSettings["Issuer"];
                var audience = jwtSettings["Audience"];
                var secretKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY");

                if (string.IsNullOrEmpty(secretKey))
                {
                    throw new InvalidOperationException("JWT_SECRET_KEY is missing in the .env file");
                }
                var key = Encoding.UTF8.GetBytes(secretKey);
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
                    Expires = DateTime.UtcNow.AddMinutes(60),
                    Issuer = issuer,
                    Audience = audience,
                    SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
                };

                var tokenHandler = new JwtSecurityTokenHandler();
                var token = tokenHandler.CreateToken(tokenDescriptor);
                var jwtToken = tokenHandler.WriteToken(token);

                // 6. Trả về JWT Token cho client cùng với thông tin tài khoản và role
                return Ok(new
                {
                    success = true,
                    message = "Google Login successful",
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
                            avatar = userInDb.AvatarUrl,
                            avatar_url = userInDb.AvatarUrl,
                            role = roleName
                        }
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi hệ thống: " + ex.Message });
            }
        }
    }
}
