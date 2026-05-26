using Microsoft.AspNetCore.Mvc;
using ParkingManagement.DTOs;
using ParkingManagement.Services;
using Microsoft.AspNetCore.Authorization;

namespace ParkingManagement.Controllers
{
    /// <summary>
    /// Controller chịu trách nhiệm tiếp nhận và điều hướng các HTTP Request liên quan đến nghiệp vụ bãi xe.
    /// Kế thừa từ ControllerBase (chuẩn API của ASP.NET Core, không chứa View giao diện).
    /// </summary>
    [ApiController] // Thuộc tính chỉ định lớp này là một API Controller, tự động kích hoạt tính năng kiểm tra dữ liệu [FromBody], [FromQuery]...
    [Route("api/v1/parking")] // Định tuyến đường dẫn API chung cho Controller này (http://localhost:5077/api/v1/parking)
    public class ParkingController : ControllerBase
    {
        // Khai báo thực thể tầng Service để gọi xử lý nghiệp vụ, sử dụng readonly để đảm bảo tính bất biến sau khi khởi tạo
        private readonly IParkingService _parkingService;

        /// <summary>
        /// Khi có request gọi tới Controller, ASP.NET Core sẽ tự động tiêm đối tượng có kiểu IParkingService vào đây.
        /// </summary>
        public ParkingController(IParkingService parkingService)
        {
            _parkingService = parkingService;
        }

        /// <summary>
        /// Endpoint xử lý tính năng Check-in đưa phương tiện vào bãi xe.
        /// </summary>
        /// <param name="dto">Dữ liệu đầu vào của phương tiện gửi từ Client qua Body của HTTP Request (định dạng JSON)</param>
        /// <returns>HTTP Status Code kèm theo chuỗi JSON chứa thông tin kết quả Check-in</returns>
        [HttpPost("check-in")] // Định nghĩa phương thức HTTP POST với đường dẫn mở rộng: /api/v1/parking/check-in
        [ProducesResponseType(typeof(CheckInResponseDto), StatusCodes.Status200OK)] // Định nghĩa cho Swagger biết API này sẽ trả về dữ liệu kiểu CheckInResponseDto kèm mã Code 200 OK
        public async Task<IActionResult> CheckIn([FromBody] VehicleCheckInDto dto)
        {
            // =========================================================================
            // 1. KIỂM TRA TÍNH HỢP LỆ CỦA DỮ LIỆU ĐẦU VÀO (DATA VALIDATION)
            // =========================================================================
            // ModelState kiểm tra các ràng buộc (Validation Attributes như [Required], [StringLength]...) định nghĩa trong VehicleCheckInDto.
            if (!ModelState.IsValid)
            {
                // Nếu dữ liệu vi phạm ràng buộc (ví dụ: thiếu biển số xe), lập tức trả về lỗi 400 Bad Request kèm chi tiết lỗi dữ liệu
                return BadRequest(ModelState);
            }

            // =========================================================================
            // 2. THỰC THI NGHIỆP VỤ VÀ BẮT NGOẠI LỆ (BUSINESS EXECUTION & ERROR HANDLING)
            // =========================================================================
            try
            {
                // Sau khi làm module Auth, giá trị này sẽ được rút ra trực tiếp từ JWT Token của nhân viên đang đăng nhập.
                string staffId = "usr_001";

                // Gọi hàm ProcessWalkInCheckInAsync từ tầng Service để xử lý nghiệp vụ Check-in một cách bất đồng bộ (await).
                // Biến 'response' sẽ nhận về đối tượng bọc ngoài có cấu trúc lồng nhau dạng { success: true, data: { ... } }.
                var response = await _parkingService.ProcessWalkInCheckInAsync(dto, staffId);

                // Trả về mã trạng thái HTTP 200 OK kèm theo cục dữ liệu response chuẩn định dạng JSON
                return Ok(response);
            }
            // Bắt nhóm ngoại lệ liên quan đến Logic nghiệp vụ được chủ động quăng ra từ tầng Service (Ví dụ: "ACTIVE_SESSION_EXISTS", "NO_AVAILABLE_SLOT")
            catch (InvalidOperationException ex)
            {
                // Trả về mã lỗi HTTP 400 Bad Request kèm cấu trúc JSON chứa thông điệp lỗi nghiệp vụ rõ ràng để Frontend xử lý hiển thị cảnh báo
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                // Kiểm tra lỗi gốc bên trong (InnerException) nếu có để lấy thông tin chi tiết, nếu không thì lấy thông báo lỗi lớp ngoài
                var innerMessage = ex.InnerException != null ? ex.InnerException.Message : ex.Message;

                // Trả về mã lỗi HTTP 500 Internal Server Error (Lỗi hệ thống phía Server) kèm theo chuỗi thông điệp "INTERNAL_SERVER_ERROR"
                return StatusCode(500, new { success = false, message = "INTERNAL_SERVER_ERROR", error = innerMessage });
            }
        }

        /// <summary>
        /// Endpoint xử lý tính năng Check-out cho phương tiện rời bãi xe.
        /// </summary>
        [HttpPost("check-out")]
        //[Authorize(Roles = "ParkingStaff,CameraService")] // Phân quyền bắt buộc theo tài liệu
        public async Task<IActionResult> CheckOut([FromBody] VehicleCheckOutDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Dữ liệu đầu vào không hợp lệ" });
            }

            try
            {
                // Gọi dịch vụ xử lý check-out và hứng kết quả vào biến 'result'
                var response = await _parkingService.ProcessCheckOutAsync(dto);


                return Ok(response);
            }
            catch (Exception ex)
            {

                var innerMessage = ex.InnerException != null ? ex.InnerException.Message : ex.Message;

                return StatusCode(500, new { success = false, message = "INTERNAL_SERVER_ERROR", error = innerMessage });
            }
        }
    }
}