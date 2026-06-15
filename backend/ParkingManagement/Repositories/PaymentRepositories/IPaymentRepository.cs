using System.Threading.Tasks;
using ParkingManagement.Models;

namespace ParkingManagement.Repositories
{
    public interface IPaymentRepository
    {
        /// <summary>
        /// Lấy thông tin chi tiết của một lượt đặt chỗ (Booking) theo ID.
        /// </summary>
        Task<Booking?> GetBookingByIdAsync(string bookingId);

        /// <summary>
        /// Khởi tạo và lưu một bản ghi hóa đơn thanh toán mới vào cơ sở dữ liệu ở trạng thái chờ.
        /// </summary>
        Task CreatePaymentAsync(Payment payment);

        /// <summary>
        /// Gạch nợ tự động khi nhận tín hiệu từ cổng thanh toán: 
        /// Cập nhật trạng thái hóa đơn thành thành công và chuyển trạng thái lượt đặt chỗ sang đã xác nhận.
        /// </summary>
        Task UpdateBookingAndPaymentSuccessAsync(string paymentId, string transactionId, decimal amountPaid);

        /// <summary>
        /// Lấy giá sàn cơ bản của chính sách giá áp dụng cho loại phương tiện tương ứng.
        /// </summary>
        Task<decimal> GetBasePriceForVehicleTypeAsync(int vehicleTypeId);
    }
}