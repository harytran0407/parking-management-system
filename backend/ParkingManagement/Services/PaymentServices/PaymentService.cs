using System;
using System.Threading.Tasks;
using ParkingManagement.Dtos;
using ParkingManagement.Models;
using ParkingManagement.Repositories;

namespace ParkingManagement.Services
{
    public class PaymentService : IPaymentService
    {
        private readonly IPaymentRepository _paymentRepository;

        public PaymentService(IPaymentRepository paymentRepository)
        {
            _paymentRepository = paymentRepository;
        }

        public async Task<object> CreateReservationPaymentAsync(CreatePaymentRequest request, string userId)
        {
            var booking = await _paymentRepository.GetBookingByIdAsync(request.BookingId);
            if (booking == null) throw new Exception("Không tìm thấy thông tin đặt chỗ.");

            decimal realAmount = 50000; // Tạm thời hardcode

            string paymentId = "pay_" + Guid.NewGuid().ToString().Substring(0, 8);

            var payment = new Payment
            {
                PaymentId = paymentId,
                PaymentType = "BOOKING",
                BookingId = request.BookingId,
                AmountDue = realAmount,   
                AmountPaid = 0,
                ChangeDue = 0,
                PaymentMethod = request.PaymentMethod,
                Status = null,            
                UserId = userId,
                PaymentTime = null
            };

            await _paymentRepository.CreatePaymentAsync(payment);

            
            long vnpAmount = (long)(realAmount * 100);
            string paymentUrl = $"https://payment.vnpay.vn/v2/vpcpay.html?vnp_TxnRef={paymentId}&vnp_Amount={vnpAmount}";

            return new
            {
                success = true,
                data = new
                {
                    payment_id = paymentId,
                    payment_url = paymentUrl,
                    qr_code = "data:image/png;base64,...",
                    expires_in_seconds = 900,
                    status = "PENDING"
                }
            };
        }

        public async Task<bool> ProcessVnPayWebhookAsync(VnPayWebhookDto webhookData)
        {
            if (webhookData.vnp_ResponseCode == "00")
            {
                decimal amountPaid = decimal.Parse(webhookData.vnp_Amount) / 100;
                await _paymentRepository.UpdateBookingAndPaymentSuccessAsync(
                    webhookData.vnp_TxnRef,
                    "txn_" + Guid.NewGuid().ToString().Substring(0, 6).ToUpper(),
                    amountPaid
                );
                return true;
            }
            return false;
        }
    }
}
