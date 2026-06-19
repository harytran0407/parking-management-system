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
        /// Xử lý nghiệp vụ Check-in cho xe vãng lai (Walk-in) và cấp phát vị trí đỗ.
        /// </summary>
        Task<CheckInResponseDto> ProcessWalkInCheckInAsync(VehicleCheckInDto dto, string staffId);

        /// <summary>
        /// Xử lý nghiệp vụ Check-in cho xe đã đặt chỗ trước (Booking) dựa trên biển số.
        /// </summary>
        Task<CheckInResponseDto> ProcessBookingCheckInAsync(VehicleCheckInDto dto, string staffId);

        /// <summary>
        /// Xử lý nghiệp vụ Check-out, tính hóa đơn và giải phóng ô đỗ cho xe vãng lai.
        /// </summary>
        Task<CheckOutResponseDto> ProcessWalkInCheckOutAsync(ParkingSession session, VehicleCheckOutDto checkOutDto, string staffId);

        /// <summary>
        /// Xử lý nghiệp vụ Check-out, kết thúc đơn đặt chỗ và giải phóng ô đỗ cho xe Booking.
        /// </summary>
        Task<CheckOutResponseDto> ProcessBookingCheckOutAsync(VehicleCheckOutDto checkOutDto, string staffId);

        /// <summary>
        /// Kiểm tra xem có đơn đặt chỗ (Booking) nào đang hoạt động cho biển số này hay không.
        /// </summary>
        Task<bool> IsBookingActiveAsync(string licensePlate);

        /// <summary>
        /// Kiểm tra xem phiên gửi xe hiện tại của biển số này có phải là xe đặt chỗ trước (Booking) hay không.
        /// </summary>
        Task<bool> IsActiveSessionABookingAsync(string licensePlate);

        /// <summary>
        /// Tìm kiếm thông tin phiên gửi xe đang hoạt động (ACTIVE) bằng biển số xe.
        /// </summary>
<<<<<<< HEAD
        Task<ActiveSessionResponseDto> GetActiveSessionByLicensePlateAsync(string licensePlate, string? ticketSuffix = null);
=======
        Task<ActiveSessionResponseDto> GetActiveSessionByLicensePlateAsync(string licensePlate);
>>>>>>> origin/main

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
<<<<<<< HEAD

        /// <summary>
        /// Xử lý thanh toán QuickPay cho phiên đỗ xe đang hoạt động.
        /// </summary>
        Task<bool> ProcessQuickPayPaymentAsync(string sessionId, string paymentMethod, string? userId);
=======
>>>>>>> origin/main
    }
}