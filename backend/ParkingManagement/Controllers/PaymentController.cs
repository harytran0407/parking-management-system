using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ParkingManagement.Dtos;
using ParkingManagement.Services;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace ParkingManagement.Controllers
{
    //[Authorize]
    [ApiController]
    [Route("api/v1/payments")]
    public class PaymentController : ControllerBase
    {
        private readonly IPaymentService _paymentService;

        public PaymentController(IPaymentService paymentService)
        {
            _paymentService = paymentService;
        }

        // [FR-BK-04] - Khởi tạo yêu cầu thanh toán cọc và sinh link thanh toán/QR
        [HttpPost("create")]
        public async Task<IActionResult> CreateReservationPayment([FromBody] CreatePaymentRequest request)
        {
            try
            {

                string userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                             ?? User.FindFirst("sub")?.Value
                             ?? "usr_001";

                var result = await _paymentService.CreateReservationPaymentAsync(request, userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // [FR-BK-04] - Nhận kết quả tự động từ cổng thanh toán để cập nhật gạch nợ (Auto-confirm)
        [HttpPost("webhook/vnpay")]
        public async Task<IActionResult> VnPayWebhook([FromBody] VnPayWebhookDto webhookData)
        {
            var isProcessed = await _paymentService.ProcessVnPayWebhookAsync(webhookData);
            if (isProcessed)
            {
                return Ok(new { RspCode = "00", RspMessage = "Success" });
            }
            return BadRequest(new { RspCode = "99", RspMessage = "Fail" });
        }
    }
}