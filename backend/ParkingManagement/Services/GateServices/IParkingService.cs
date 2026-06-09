using System.Threading.Tasks;
using ParkingManagement.DTOs;

namespace ParkingManagement.Services
{
    /// <summary>
    /// Dịch vụ xử lý các nghiệp vụ vận hành bãi xe (Vào cổng, ra cổng, tra cứu phiên và quản lý ô đỗ).
    /// </summary>
    public interface IParkingService
    {
        /// <summary>
        /// Xử lý nghiệp vụ cho xe vào bãi và cấp phát vị trí đỗ (Check-in).
        /// </summary>
        Task<CheckInResponseDto> ProcessWalkInCheckInAsync(VehicleCheckInDto dto, string staffId);

        /// <summary>
        /// Xử lý nghiệp vụ cho xe rời bãi, tính hóa đơn và giải phóng ô đỗ (Check-out).
        /// </summary>
        Task<CheckOutResponseDto> ProcessCheckOutAsync(VehicleCheckOutDto checkOutDto, string staffId);

        /// <summary>
        /// Tìm kiếm thông tin phiên gửi xe đang hoạt động (ACTIVE) bằng biển số xe.
        /// </summary>
        Task<ActiveSessionResponseDto> GetActiveSessionByLicensePlateAsync(string licensePlate);

        Task<ActiveSessionResponseDto> GetActiveSessionBySlotNameAsync(string slotName);

        /// <summary>
        /// Tính toán chi tiết chi phí gửi xe tạm tính tại thời điểm hiện tại (Pre-check-out).
        /// </summary>
        Task<PreCheckOutResponseDto> CalculatePreCheckOutFeeAsync(string sessionId);

        /// <summary>
        /// Cập nhật trạng thái ô đỗ và tự động ghi nhận nhật ký hệ thống (Log).
        /// </summary>
        Task<SlotStatusResponseDto> UpdateSlotStatusAsync(UpdateSlotStatusDto dto, string staffId);

        /// <summary>
        /// Truy vấn danh sách các ô đỗ xe theo bộ lọc phân trang và thống kê số lượng thời gian thực.
        /// </summary>
        Task<ParkingSlotsResponseDto> GetRealtimeSlotsAsync(SlotQueryFilterDto filter);

        /// <summary>
        /// Lấy danh sách lịch sử những xe đã và đang gửi tại bãi theo bộ lọc phân trang
        /// </summary>
        /// <param name="filter"></param>
        /// <returns></returns>
        Task<PagedHistoryResponseDto> GetParkingHistoryAsync(ParkingHistoryFilterDto filter);
    }
}