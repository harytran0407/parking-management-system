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
        /// Kiểm tra xem một biển số xe có đang nằm trong bãi và ở trạng thái hoạt động hay không.
        /// </summary>
        Task<bool> IsVehicleActiveInParkingAsync(string licensePlate);

        /// <summary>
        /// Thuật toán tìm kiếm vị trí đỗ còn trống đầu tiên phù hợp với loại xe (Smart Allocation).
        /// </summary>
        Task<dynamic?> FindFirstAvailableSlotAsync(int vehicleTypeId);

        /// <summary>
        /// Thêm một bản ghi phiên gửi xe mới vào bộ nhớ đệm Tracking của Entity Framework.
        /// </summary>
        Task CreateSessionAsync(ParkingSession session);

        /// <summary>
        /// Tìm kiếm thông tin chi tiết của một vị trí đỗ dựa vào mã ID.
        /// </summary>
        Task<ParkingSlot?> GetSlotByIdAsync(string slotId);

        /// <summary>
        /// Quản lý việc lưu trữ dữ liệu tập trung bọc trong một Database Transaction (Đảm bảo tính toàn vẹn ACID).
        /// </summary>
        Task SaveChangesWithTransactionAsync(Func<Task> action);
    }
}