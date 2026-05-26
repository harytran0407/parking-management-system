using System.Threading.Tasks;
using ParkingManagement.DTOs;

namespace ParkingManagement.Services
{
    /// <summary>
    /// Interface định nghĩa các danh mục nghiệp vụ (Hợp đồng dữ liệu) liên quan đến quản lý bãi xe.
    /// </summary>
    public interface IParkingService
    {
        /// <summary>
        /// Xử lý nghiệp vụ Check-in cho xe vào bãi (Áp dụng cho cả vãng lai và đặt chỗ trước)
        /// </summary>
        /// <param name="dto">Đối tượng VehicleCheckInDto chứa dữ liệu đầu vào từ Client</param>
        /// <param name="staffId">Mã định danh của nhân viên trực cổng thực hiện quét thẻ</param>
        /// <returns>Đối tượng CheckInResponseDto chứa kết quả phản hồi chuẩn cấu trúc JSON</returns>
        Task<CheckInResponseDto> ProcessWalkInCheckInAsync(VehicleCheckInDto dto, string staffId);
    }
}