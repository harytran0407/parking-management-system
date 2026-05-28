using Microsoft.AspNetCore.Mvc;
using ParkingManagement.DTOs;
using ParkingManagement.Services;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

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

        /// <summary>
        /// 5.3 Get Active Session by License Plate
        /// Lấy thông tin lượt đỗ đang hoạt động bằng biển số xe
        /// </summary>
        [HttpGet("sessions/active/{license_plate}")]
        // [Authorize] // Bật thuộc tính này lên nếu dự án của bạn đã cấu hình JWT Auth thành công
        [ProducesResponseType(typeof(ActiveSessionResponseDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetActiveSessionByLicensePlate([FromRoute(Name = "license_plate")] string licensePlate)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(licensePlate))
                {
                    return BadRequest(new { success = false, message = "Biển số xe không được để trống" });
                }

                var response = await _parkingService.GetActiveSessionByLicensePlateAsync(licensePlate);
                return Ok(response);
            }
            catch (InvalidOperationException ex) when (ex.Message == "ACTIVE_SESSION_NOT_FOUND")
            {
                return NotFound(new { success = false, message = "Không tìm thấy lượt gửi xe đang hoạt động cho biển số này." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "INTERNAL_SERVER_ERROR", error = ex.Message });
            }
        }

        /// <summary>
        /// 5.4 Pre-check-out — Calculate Fee
        /// Tính toán chi tiết tiền gửi xe tạm tính trước khi thực hiện check-out rời bãi
        /// </summary>
        [HttpGet("sessions/{session_id}/calculate-fee")]
        // [Authorize] // Bật thuộc tính này lên nếu dự án của bạn đã cấu hình JWT Auth thành công
        [ProducesResponseType(typeof(PreCheckOutResponseDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> CalculatePreCheckOutFee([FromRoute(Name = "session_id")] string sessionId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(sessionId))
                {
                    return BadRequest(new { success = false, message = "Session ID không được để trống" });
                }

                var response = await _parkingService.CalculatePreCheckOutFeeAsync(sessionId);
                return Ok(response);
            }
            catch (InvalidOperationException ex) when (ex.Message == "SESSION_NOT_FOUND_OR_INACTIVE" || ex.Message == "PRICING_POLICY_NOT_CONFIGURED")
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "INTERNAL_SERVER_ERROR", error = ex.Message });
            }
        }

        /// <summary>
        /// [FR-GATE-05] Cập nhật trạng thái ô đỗ
        /// </summary>
        [HttpPut("slots/{slot_id}/status")]
        public async Task<IActionResult> UpdateSlotStatus(string slot_id, [FromBody] UpdateSlotStatusDto dto)
        {
            // 1. Trích xuất Staff ID từ JWT Token 
            string? staffId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                              ?? User.FindFirst("sub")?.Value;

            // 2. Cơ chế Fallback thông minh chỉ hoạt động khi chạy môi trường Local DEBUG
#if DEBUG
            if (string.IsNullOrEmpty(staffId))
            {
                staffId = "usr_001"; // Gán tài khoản giả lập phục vụ DEV test luồng
            }
#endif

            // 3. Nếu kiểm tra môi trường chạy chính thức vẫn trống thông tin thì chặn lại quyền truy cập
            if (string.IsNullOrEmpty(staffId))
            {
                return Unauthorized(new { success = false, message = "Unauthorized staff member." });
            }

            try
            {
                dto.SlotId = slot_id;
                var response = await _parkingService.UpdateSlotStatusAsync(dto, staffId);
                return Ok(response); // Trả về 200 OK kèm dữ liệu cấu trúc chuẩn Việt Nam
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { success = false, error_code = "VALIDATION_ERROR", message = ex.Message });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { success = false, error_code = "SLOT_NOT_FOUND", message = "Slot identity not found." });
            }
            catch (Exception)
            {
                return StatusCode(500, new { success = false, error_code = "INTERNAL_ERROR", message = "An error occurred." });
            }
        }
    }
}