using System.Threading.Tasks;
using ParkingManagement.Models;

namespace ParkingManagement.Repositories
{
    /// <summary>
    /// Giao diện định nghĩa các thao tác dữ liệu với bảng đặt chỗ (Booking).
    /// </summary>
    public interface IBookingRepository
    {
        /// <summary>
        /// Lấy thông tin đặt chỗ đang hoạt động (CONFIRMED) dựa trên mã ô đỗ.
        /// </summary>
        Task<Booking?> GetActiveBookingBySlotIdAsync(string slotId);

        /// <summary>
        /// Cập nhật thông tin thực thể đặt chỗ (Booking).
        /// </summary>
        Task UpdateBookingAsync(Booking booking);
    }
}