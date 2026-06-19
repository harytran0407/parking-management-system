using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ParkingManagement.Dtos
{
    public class ConfirmMockPaymentRequest
    {
        [Required(ErrorMessage = "booking_id is required")]
        [JsonPropertyName("booking_id")]
        public string BookingId { get; set; } = null!;

        [Required(ErrorMessage = "payment_method is required")]
        [JsonPropertyName("payment_method")]
        public string PaymentMethod { get; set; } = null!;
    }
}
