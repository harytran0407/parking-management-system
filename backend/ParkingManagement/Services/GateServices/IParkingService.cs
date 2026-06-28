using System.Threading.Tasks;
using ParkingManagement.DTOs;
using ParkingManagement.Models;

namespace ParkingManagement.Services
{
    /// <summary>
    /// Dịch vụ xử lý các nghiệp vụ vận hành bãi xe (Vào cổng, ra cổng, tra cứu phiên và quản lý ô đỗ).
    /// </summary>
    public interface IParkingService
    {
        /// <summary>
        /// Điều hướng và xử lý nghiệp vụ Check-in chung (Phân luồng tự động xe Vãng lai hoặc Đặt chỗ).
        /// </summary>
        Task<CheckInResponseDto> ProcessCheckInAsync(VehicleCheckInDto dto, string staffId);

        /// <summary>
        /// Điều hướng và xử lý nghiệp vụ Check-out chung (Phân luồng tự động xe Vãng lai hoặc Đặt chỗ).
        /// </summary>
        Task<CheckOutResponseDto> ProcessCheckOutAsync(VehicleCheckOutDto checkOutDto, string staffId);

        /// <summary>
        /// Tìm kiếm thông tin phiên gửi xe đang hoạt động (ACTIVE) bằng biển số xe.
        /// </summary>
        Task<ActiveSessionResponseDto> GetActiveSessionByLicensePlateAsync(string licensePlate, string? ticketSuffix = null, bool exactMatch = false);

        /// <summary>
        /// Tìm kiếm thông tin phiên gửi xe đang hoạt động (ACTIVE) bằng tên ô đỗ xe.
        /// </summary>
        Task<ActiveSessionResponseDto> GetActiveSessionBySlotNameAsync(string slotName);

        /// <summary>
        /// Tìm kiếm thông tin phiên gửi xe đang hoạt động (ACTIVE) bằng mã vé xe.
        /// </summary>
        Task<ActiveSessionResponseDto> GetActiveSessionByTicketCodeAsync(string ticketCode);

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
        /// Lấy danh sách lịch sử các phiên gửi xe (đã kết thúc hoặc đang hoạt động) theo bộ lọc phân trang.
        /// </summary>
        Task<PagedHistoryResponseDto> GetParkingHistoryAsync(ParkingHistoryFilterDto filter);

        /// <summary>
        /// Xử lý thanh toán QuickPay cho phiên đỗ xe đang hoạt động.
        /// </summary>
        Task<bool> ProcessQuickPayPaymentAsync(string sessionId, string paymentMethod, string? userId);

        /// <summary>
        /// Lấy thống kê số lượng xe đang giữ chỗ (Booked) và sức chứa thực tế theo thời gian thực của các Zone đang hoạt động.
        /// </summary>
        Task<System.Collections.Generic.List<ZoneRealtimeStatsDto>> GetZoneRealtimeStatsAsync();

        /// <summary>
        /// Cập nhật trạng thái hàng loạt ô đỗ xe và tự động tăng/giảm capacity của các zones tương ứng trong Transaction.
        /// </summary>
        Task<BulkUpdateSlotStatusResponseDto> BulkUpdateSlotStatusAsync(BulkUpdateSlotStatusDto dto, string staffId);
    }
}
