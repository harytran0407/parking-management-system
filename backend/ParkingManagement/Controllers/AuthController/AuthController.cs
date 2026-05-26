using Microsoft.AspNetCore.Mvc;
using ParkingManagement.Data;
using ParkingManagement.DTOs.Auth;
using ParkingManagement.Models;
using ParkingManagement.Utils;

namespace ParkingManagement.Controllers.AuthController
{
    [ApiController]                                                 
    [Route("api/[controller]")]                                     
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
            //-- Các hàm kiểm tra tính hợp lệ của email, số điện thoại và mật khẩu --//

            if (!ValidationUtils.IsValidEmail(request._email))
            {
                return BadRequest("Email không hợp lệ!");           
            }

            if (!ValidationUtils.IsValidPhoneNumber(request._phoneNumber))
            {
                return BadRequest("Số điện thoại không hợp lệ!");   
            }

            if (!ValidationUtils.IsValidPassword(request._password))
            {
                return BadRequest("Mật khẩu không hợp lệ!");        
            }

            //-- Kiểm tra tính trùng lặp dưới Database --//

            bool isExist = _context.Users.Any(u => u.Email == request._email || u.Phone == request._phoneNumber);

            if (isExist)
            {
                return Conflict("Email hoặc số điện thoại đã tồn tại!");   
            }

            //-- Tạo mới người dùng và lưu vào Database --//
            var newUser = new User
            {
                UserId = "USR" + DateTime.Now.ToString("yyMMddHHmmss"),             // Sinh ID người dùng theo thời gian thực (VD: USR-260520103000)
                Email = request._email,
                Phone = request._phoneNumber,
                Password = request._password,
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
            if(!ValidationUtils.IsValidUsername(request._newUsername))
            {
                return BadRequest("Tên người dùng không hợp lệ!");        
            }

            var userExist = _context.Users.FirstOrDefault(u => u.UserId == request._userId);
            if(userExist == null)
            {
                return NotFound("Không tìm thấy tài khoản để cập nhật");
            }

            bool isUsernameExist = _context.Users.Any(u => u.Username == request._newUsername);

            if(isUsernameExist)
            {
                return Conflict("Tên người dùng đã tồn tại. Vui lòng chọn tên khác!");
            }

            userExist.Username = request._newUsername;
            userExist.FullName = request._fullName;
            _context.SaveChanges();

            return Ok(new
            {
                message = "Cập nhật tên người dùng thành công!"
            });
        }
    }
}
