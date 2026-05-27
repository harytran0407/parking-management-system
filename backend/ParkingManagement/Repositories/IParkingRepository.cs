using System;
using System.Threading.Tasks;
using ParkingManagement.Models;

namespace ParkingManagement.Repositories
{
    /// <summary>
    /// Interface định nghĩa các phương thức giao tiếp dữ liệu thô với Database liên quan đến bãi xe.
    /// </summary>
    public interface IParkingRepository
    {
        /// <summary>
        /// Kiểm tra xem một biển số xe có phiên gửi xe nào đang ở trạng thái hoạt động (ACTIVE) trong bãi hay không.
        /// </summary>
        /// <param name="licensePlate">Biển số xe cần kiểm tra</param>
        /// <returns>True nếu xe đang ở trong bãi, ngược lại trả về False</returns>
        Task<bool> IsVehicleActiveInParkingAsync(string licensePlate);

        /// <summary>
        /// Tìm kiếm vị trí đỗ xe (Slot) còn trống đầu tiên phù hợp với loại phương tiện truyền vào.
        /// </summary>
        /// <param name="vehicleTypeId">Mã định danh loại xe (Xe máy, Ô tô...)</param>
        /// <returns>Đối tượng slot đỗ xe tìm thấy hoặc null nếu hệ thống đã hết chỗ</returns>
        Task<dynamic?> FindFirstAvailableSlotAsync(int vehicleTypeId);

        /// <summary>
        /// Thêm mới một bản ghi phiên gửi xe (ParkingSession) vào cơ sở dữ liệu.
        /// </summary>
        /// <param name="session">Thực thể ParkingSession chứa thông tin check-in</param>
        Task CreateSessionAsync(ParkingSession session);

        /// <summary>
        /// Thực thi một chuỗi các hành động chỉnh sửa dữ liệu đồng thời trong một Database Transaction để đảm bảo tính toàn vẹn (ACID).
        /// </summary>
        /// <param name="action">Hàm đại diện cho tập hợp các lệnh cần chạy chung một transaction</param>
        Task SaveChangesWithTransactionAsync(Func<Task> action);

        /// <summary>
        /// Truy vấn thông tin chi tiết của một vị trí đỗ (ParkingSlot) kèm theo dữ liệu liên kết Khu vực (Zone).
        /// </summary>
        /// <param name="slotId">Mã định danh duy nhất của ô đỗ xe</param>
        /// <returns>Thực thể ParkingSlot hoặc null nếu không tồn tại mã này</returns>
        Task<ParkingSlot?> GetSlotByIdAsync(string slotId);

        /// <summary>
        /// Tìm kiếm phiên gửi xe đang hoạt động (ACTIVE) trong bãi thông qua biển số xe lúc vào bãi.
        /// </summary>
        /// <param name="licensePlate">Biển số xe cần tìm kiếm</param>
        /// <returns>Thực thể ParkingSession đang hoạt động kèm thông tin Slot/Zone liên kết, hoặc null nếu không tìm thấy</returns>
        Task<ParkingSession?> GetActiveSessionByPlateAsync(string licensePlate);

        /// <summary>
        /// Lấy chính sách áp giá (PricingPolicy) đang có hiệu lực gần nhất với thời điểm hiện tại.
        /// </summary>
        /// <returns>Thực thể PricingPolicy hiện hành chứa thông tin giá gốc và giá theo block giờ</returns>
        Task<PricingPolicy?> GetActivePricingPolicyAsync();

        /// <summary>
        /// Cập nhật thông tin Check-out của phiên gửi xe đồng thời giải phóng trạng thái ô đỗ về 'Available'.
        /// </summary>
        /// <param name="session">Thực thể ParkingSession cần cập nhật thông tin ra bãi</param>
        /// <param name="slotId">Mã ô đỗ xe cần giải phóng trạng thái trống</param>
        /// <returns>True nếu cập nhật thành công và commit transaction an toàn, ngược lại trả về False</returns>
        Task<bool> UpdateSessionAndSlotAsync(ParkingSession session, string slotId);

        /// <summary>
        /// Tìm kiếm phiên gửi xe đang hoạt động (ACTIVE) trong bãi dựa trên mã định danh duy nhất của phiên gửi (SessionId).
        /// </summary>
        /// <param name="sessionId">Mã định danh duy nhất của phiên gửi xe cần truy vấn</param>
        /// <returns>Thực thể ParkingSession tìm thấy kèm thông tin Slot/Zone liên kết, hoặc null nếu phiên không tồn tại/đã kết thúc</returns>
        Task<ParkingSession?> GetActiveSessionByIdAsync(string sessionId);
    }
}