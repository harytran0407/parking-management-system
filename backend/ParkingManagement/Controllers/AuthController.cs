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

            if (string.IsNullOrEmpty(request.FullName))
            {
                return BadRequest("Họ tên không được để trống!");
            }

            if (!ValidationUtils.IsValidEmail(request.Email))
            {
                return BadRequest("Email không hợp lệ!");           
            }

            if (!ValidationUtils.IsValidPhoneNumber(request.PhoneNumber))
            {
                return BadRequest("Số điện thoại không hợp lệ!");   
            }

            if (!ValidationUtils.IsValidPassword(request.Password))
            {
                return BadRequest("Mật khẩu quá yếu!");        
            }

            if (request.ConfirmPassword != request.Password)
            {
                return BadRequest("Mật khẩu xác nhận không khớp!");
            }

            //-- Kiểm tra tính trùng lặp dưới Database --//

            bool isExist = _context.Users.Any(u => u.Email == request.Email || u.Phone == request.PhoneNumber);

            if (isExist)
            {
                return Conflict("Email hoặc số điện thoại đã tồn tại!");   
            }

            //-- Tạo mới người dùng và lưu vào Database --//
            var newUser = new User
            {
                UserId = "USR" + DateTime.Now.ToString("yyMMddHHmmss"),             // Sinh ID người dùng theo thời gian thực (VD: USR-260520103000)
                FullName = request.FullName,
                Email = request.Email,
                Phone = request.PhoneNumber,
                Password = request.Password,
                Username = "user_" + Guid.NewGuid().ToString("N").Substring(0, 8),  // Tạo username tạm thời (VD: user_a1b2c3d4)
                RoleId = 4,
                Status = "ACTIVE",
                CreatedAt = DateTime.Now,
            };
            _context.Users.Add(newUser);
            _context.SaveChanges(); 

            return Ok(new
            {
                message = "Đăng ký thành công!",
                userId = newUser.UserId,
                requireUsernameUpdate = true
            });
        }

        [HttpPost("update-username")]
        public IActionResult UpdateUsername(UpdateUserNameDto request)
        {
            if(!ValidationUtils.IsValidUsername(request.NewUsername))
            {
                return BadRequest("Tên người dùng không hợp lệ!");        
            }

            var userExist = _context.Users.FirstOrDefault(u => u.UserId == request.UserId);
            if(userExist == null)
            {
                return NotFound("Không tìm thấy tài khoản để cập nhật");
            }

            bool isUsernameExist = _context.Users.Any(u => u.Username == request.NewUsername);

            if(isUsernameExist)
            {
                return Conflict("Tên người dùng đã tồn tại. Vui lòng chọn tên khác!");
            }

            userExist.Username = request.NewUsername;
            _context.SaveChanges();

            return Ok(new
            {
                message = "Cập nhật tên người dùng thành công!"
            });
        }
    }
}
