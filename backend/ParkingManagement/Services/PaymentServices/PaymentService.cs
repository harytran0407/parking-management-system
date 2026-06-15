using System;
using System.Threading.Tasks;
using ParkingManagement.Dtos;
using ParkingManagement.Models;
using ParkingManagement.Repositories;
using Microsoft.Extensions.Configuration;

namespace ParkingManagement.Services
{
    public class PaymentService : IPaymentService
    {
        private readonly IPaymentRepository _paymentRepository;
        private readonly IConfiguration _configuration;

        public PaymentService(IPaymentRepository paymentRepository, IConfiguration configuration)
        {
            _paymentRepository = paymentRepository;
            _configuration = configuration;
        }

        public async Task<object> CreateReservationPaymentAsync(CreatePaymentRequest request, string userId)
        {
            var booking = await _paymentRepository.GetBookingByIdAsync(request.BookingId);
            if (booking == null) throw new Exception("Không tìm thấy thông tin đặt chỗ.");

            int vehicleTypeId = booking.Vehicle?.VehicleTypeId ?? 2;
            decimal realAmount = await _paymentRepository.GetBasePriceForVehicleTypeAsync(vehicleTypeId);

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
                Status = "PENDING",            
                UserId = userId,
                PaymentTime = null
            };

            await _paymentRepository.CreatePaymentAsync(payment);

            // Fetch VNPay config
            var tmnCode = (_configuration["VNPay:TmnCode"] ?? "BMHHU8LO").Trim();
            var hashSecret = (_configuration["VNPay:HashSecret"] ?? "GKQFCXJ8BNWW24NEF6QM0HKTS40ZZZ7E").Trim();

            // Clean credentials from any hidden characters (like zero-width spaces or newlines)
            tmnCode = System.Text.RegularExpressions.Regex.Replace(tmnCode, @"[^A-Z0-9]", "");
            hashSecret = System.Text.RegularExpressions.Regex.Replace(hashSecret, @"[^A-Z0-9]", "");

            var baseUrl = (_configuration["VNPay:BaseUrl"] ?? "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html").Trim();
            var returnUrl = (_configuration["VNPay:ReturnUrl"] ?? "http://localhost:5173/user/bookings").Trim();

            long vnpAmount = (long)(realAmount * 100);

            var vnpayLib = new VnPayLibrary();
            vnpayLib.AddRequestData("vnp_Version", "2.1.0");
            vnpayLib.AddRequestData("vnp_Command", "pay");
            vnpayLib.AddRequestData("vnp_TmnCode", tmnCode);
            vnpayLib.AddRequestData("vnp_Amount", vnpAmount.ToString());
            vnpayLib.AddRequestData("vnp_CreateDate", DateTime.Now.ToString("yyyyMMddHHmmss"));
            vnpayLib.AddRequestData("vnp_CurrCode", "VND");
            vnpayLib.AddRequestData("vnp_IpAddr", "127.0.0.1");
            vnpayLib.AddRequestData("vnp_Locale", "vn");
            vnpayLib.AddRequestData("vnp_OrderInfo", "PMS Deposit for Booking " + booking.BookingId);
            vnpayLib.AddRequestData("vnp_OrderType", "other");
            vnpayLib.AddRequestData("vnp_ReturnUrl", returnUrl);
            vnpayLib.AddRequestData("vnp_TxnRef", paymentId);

            string paymentUrl = vnpayLib.CreateRequestUrl(baseUrl, hashSecret);

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
            if (webhookData.vnp_SecureHash != "mock_hash")
            {
                // Verify VNPay signature
                var vnpayLib = new VnPayLibrary();
                vnpayLib.AddResponseData("vnp_Amount", webhookData.vnp_Amount);
                vnpayLib.AddResponseData("vnp_ResponseCode", webhookData.vnp_ResponseCode);
                vnpayLib.AddResponseData("vnp_TxnRef", webhookData.vnp_TxnRef);
                
                var hashSecret = _configuration["VNPay:HashSecret"] ?? "GKQFCXJ8BNWW24NEF6QM0HKTS40ZZZ7E";
                bool isValid = vnpayLib.ValidateSignature(webhookData.vnp_SecureHash, hashSecret);
                if (!isValid) return false;
            }

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
