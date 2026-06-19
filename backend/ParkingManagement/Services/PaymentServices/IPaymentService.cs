using System.Threading.Tasks;
using ParkingManagement.Dtos;

namespace ParkingManagement.Services
{
    public interface IPaymentService
    {
        /// <summary>
        /// Tạo yêu cầu thanh toán cho lượt đặt chỗ.
        /// Kiểm tra tính hợp lệ của Booking, khởi tạo bản ghi hóa đơn tạm thời dưới Database và sinh đường dẫn (URL) sang cổng VNPay để người dùng quét mã QR.
        /// </summary>
        Task<object> CreateReservationPaymentAsync(CreatePaymentRequest request, string userId);

        /// <summary>
        /// Tiếp nhận và xử lý tín hiệu phản hồi tự động (IPN/Webhook) từ cổng thanh toán VNPay khi khách hàng chuyển tiền xong.
        /// </summary>
        Task<bool> ProcessVnPayWebhookAsync(VnPayWebhookDto webhookData);

        /// <summary>
        /// Xác nhận thanh toán giả lập (Mock Payment) cho đặt chỗ.
        /// </summary>
        Task<bool> ConfirmMockPaymentAsync(string bookingId, string paymentMethod, string userId);
    }
}