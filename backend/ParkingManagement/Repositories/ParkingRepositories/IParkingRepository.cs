using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using ParkingManagement.Models;
using ParkingManagement.DTOs;

namespace ParkingManagement.Repositories
{
    /// <summary>
    /// Giao diện (Interface) định nghĩa các phương thức giao tiếp dữ liệu thô với Cơ sở dữ liệu liên quan đến nghiệp vụ bãi xe.
    /// </summary>
    public interface IParkingRepository
    {
        /// <summary>
        /// Kiểm tra xem một biển số xe có phiên gửi xe nào đang ở trạng thái hoạt động (ACTIVE) trong bãi hay không.
        /// </summary>
        Task<bool> IsVehicleActiveInParkingAsync(string licensePlate);

        /// <summary>
        /// Tìm kiếm vị trí đỗ xe (Slot) còn trống đầu tiên phù hợp với loại phương tiện truyền vào.
        /// </summary>
        Task<ParkingSlot?> FindFirstAvailableSlotAsync(int vehicleTypeId);

        /// <summary>
        /// Retrieves an active booking for a vehicle by license plate and vehicle type, or by booking ID.
        /// </summary>
        Task<Booking?> GetActiveBookingAsync(string licensePlate, int vehicleTypeId, string? bookingId = null);

        /// <summary>
        /// Retrieves a booking with its payments.
        /// </summary>
        Task<Booking?> GetBookingWithPaymentsAsync(string bookingId);

        /// <summary>
        /// Thêm mới một bản ghi phiên gửi xe (ParkingSession) vào cơ sở dữ liệu khi phương tiện vào bãi (Check-in).
        /// </summary>
        Task CreateSessionAsync(ParkingSession session);

        /// <summary>
        /// Thực thi một chuỗi các hành động chỉnh sửa dữ liệu đồng thời trong một Cơ sở dữ liệu Transaction nhằm đảm bảo tính toàn vẹn (ACID).
        /// </summary>
        Task SaveChangesWithTransactionAsync(Func<Task> action);

        /// <summary>
        /// Truy vấn thông tin chi tiết của một vị trí đỗ (ParkingSlot) kèm theo dữ liệu liên kết Khu vực (Zone).
        /// </summary>
        Task<ParkingSlot?> GetSlotByIdAsync(string slotId);

        /// <summary>
        /// Tìm kiếm vị trí đỗ xe dựa theo tên vị trí (SlotName).
        /// </summary>
        Task<ParkingSlot?> GetSlotByNameAsync(string slotName);

        /// <summary>
        /// Tìm kiếm phiên gửi xe đang hoạt động (ACTIVE) tại một vị trí ô đỗ dựa trên SlotId.
        /// </summary>
        Task<ParkingSession?> GetActiveSessionBySlotIdAsync(string slotId);

        /// <summary>
        /// Tìm kiếm phiên gửi xe đang hoạt động (ACTIVE) trong bãi thông qua biển số xe lúc vào cổng.
        /// </summary>
        Task<ParkingSession?> GetActiveSessionByPlateAsync(string licensePlate);

        /// <summary>
        /// Tìm kiếm phiên gửi xe đang hoạt động (ACTIVE) trong bãi thông qua mã vé (TicketCode).
        /// </summary>
        Task<ParkingSession?> GetActiveSessionByTicketCodeAsync(string ticketCode);

        /// <summary>
        /// Cập nhật thông tin Check-out của phiên gửi xe đồng thời giải phóng trạng thái ô đỗ về 'AVAILABLE' trong cùng một Transaction.
        /// </summary>
        Task<bool> UpdateSessionAndSlotAsync(ParkingSession session, string slotId);

        /// <summary>
        /// Tìm kiếm phiên gửi xe đang hoạt động (ACTIVE) trong bãi dựa trên mã định danh duy nhất của phiên gửi (SessionId).
        /// </summary>
        Task<ParkingSession?> GetActiveSessionByIdAsync(string sessionId);

        /// <summary>
        /// Cập nhật trạng thái ô đỗ và tự động ghi nhận lại lịch sử nhật ký (Log) thay đổi của hệ thống.
        /// </summary>
        Task<bool> UpdateSlotStatusWithLogAsync(string slotId, string status, string staffId, string reason, int estimatedDuration);

        /// <summary>
        /// Cập nhật các thông tin thay đổi của một thực thể phiên gửi xe (ParkingSession) vào Cơ sở dữ liệu.
        /// </summary>
        Task UpdateSessionAsync(ParkingSession session);

        /// <summary>
        /// Cập nhật các thông tin thay đổi của một thực thể ô đỗ xe (ParkingSlot) vào Cơ sở dữ liệu.
        /// </summary>
        Task UpdateSlotAsync(ParkingSlot slot);

        /// <summary>
        /// Truy vấn chính sách giá đang có hiệu lực (Active) áp dụng riêng cho một loại phương tiện cụ thể.
        /// </summary>
        Task<PricingPolicy?> GetActivePricingPolicyByVehicleTypeAsync(int vehicleTypeId);

        /// <summary>
        /// Truy vấn danh sách các ô đỗ xe theo cơ chế phân trang, kết hợp bộ lọc tìm kiếm nâng cao và thống kê số lượng trạng thái thực tế.
        /// </summary>
        Task<(List<ParkingSlot> Slots, int TotalCount, Dictionary<string, int> StatusCounts)> GetPagedSlotsWithStatusAsync(SlotQueryFilterDto filter);

        Task<string> GetOperatingHoursForDayAsync(DateTime referenceTime);

        /// <summary>
        /// Lấy lịch sử gửi xe của một phương tiện dựa trên biển số xe, khoảng thời gian và loại phương tiện, đồng thời hỗ trợ phân trang kết quả trả về.
        /// </summary>
        Task<(List<ParkingSession> Items, int TotalCount)> GetParkingHistoryAsync(string? licensePlate, DateTime? fromDate, DateTime? toDate, string? vehicleType, string? status, int page, int pageSize);
    }
}