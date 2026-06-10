using System.ComponentModel.DataAnnotations;

namespace ParkingManagement.Dtos
{
	public class CreatePaymentRequest
	{
		[Required]
		public string BookingId { get; set; } = null!;

		[Required]
		public string PaymentMethod { get; set; } = null!;

		[Required]
		public string ReturnUrl { get; set; } =	null!;

		[Required]
		public string CancelUrl { get; set; } = string.Empty;
	}
}