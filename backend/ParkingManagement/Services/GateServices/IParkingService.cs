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
        /// Chức năng 5.1: Xử lý nghiệp vụ Check-in cho xe vào bãi (Áp dụng cho cả vãng lai và đặt chỗ trước)
        /// </summary>
        /// <param name="dto">Đối tượng VehicleCheckInDto chứa dữ liệu đầu vào từ Client</param>
        /// <param name="staffId">Mã định danh của nhân viên trực cổng thực hiện quét thẻ</param>
        /// <returns>Đối tượng CheckInResponseDto chứa kết quả phản hồi chuẩn cấu trúc JSON</returns>
        Task<CheckInResponseDto> ProcessWalkInCheckInAsync(VehicleCheckInDto dto, string staffId);

        /// <summary>
        /// Chức năng 5.2: Xử lý nghiệp vụ Check-out cho xe rời bãi, tính toán chi phí cuối cùng và giải phóng vị trí đỗ.
        /// </summary>
        /// <param name="checkOutDto">Đối tượng VehicleCheckOutDto chứa thông tin xe ra, camera và nhân viên trực cổng</param>
        /// <returns>Đối tượng CheckOutResponseDto chứa hóa đơn thanh toán và trạng thái hoàn thành phiên gửi</returns>
        Task<CheckOutResponseDto> ProcessCheckOutAsync(VehicleCheckOutDto checkOutDto);

        /// <summary>
        /// Chức năng 5.3: Tìm kiếm và lấy thông tin chi tiết của một phiên gửi xe đang hoạt động (ACTIVE) bằng biển số xe.
        /// </summary>
        /// <param name="licensePlate">Biển số xe cần kiểm tra trạng thái trong bãi</param>
        /// <returns>Đối tượng ActiveSessionResponseDto chứa thông tin vị trí đỗ, thời gian vào và số tiền tạm tính hiện tại</returns>
        Task<ActiveSessionResponseDto> GetActiveSessionByLicensePlateAsync(string licensePlate);

        /// <summary>
        /// Chức năng 5.4: Tính toán chi tiết chi phí gửi xe tạm tính (Pre-check-out) dựa trên mã phiên gửi xe hiện hành.
        /// </summary>
        /// <param name="sessionId">Mã định danh duy nhất của phiên gửi xe đang hoạt động cần tính tiền</param>
        /// <returns>Đối tượng PreCheckOutResponseDto chứa chi tiết breakdown giá (giá gốc, block giờ) và thời gian gia hạn rời bãi</returns>
        Task<PreCheckOutResponseDto> CalculatePreCheckOutFeeAsync(string sessionId);

        /// <summary>
        /// Asynchronously updates the status of a slot based on the provided update information.
        /// </summary>
        /// <param name="dto">An object containing the details required to update the slot status. Cannot be null.</param>
        /// <param name="staffId">The unique identifier of the staff member performing the update. Cannot be null or empty.</param>
        /// <returns>A task that represents the asynchronous operation. The task result contains a SlotStatusResponseDto with the
        /// updated slot status information.</returns>
        Task<SlotStatusResponseDto> UpdateSlotStatusAsync(UpdateSlotStatusDto dto, string staffId);
    }
}