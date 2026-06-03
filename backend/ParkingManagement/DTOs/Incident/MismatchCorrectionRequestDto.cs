using System.ComponentModel.DataAnnotations;

namespace ParkingManagement.DTOs
{
	public class MismatchCorrectionRequestDto
	{
		[Required(ErrorMessage = "SESSION_ID_REQUIRED")]
		public string SessionId { get; set; } = null!;

		[Required(ErrorMessage = "ISSUE_TYPE_REQUIRED")]
		public string IssueType { get; set; } = "WRONG_SLOT";

		[Required(ErrorMessage = "CORRECTED_PLATE_REQUIRED")]
		public string CorrectedLicensePlate { get; set; } = null!;

		[Required(ErrorMessage = "ORIGINAL_PLATE_REQUIRED")]
		public string OriginalLicensePlate { get; set; } = null!;

		public string? Reason { get; set; }
	}
}