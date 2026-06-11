using System.ComponentModel.DataAnnotations;

namespace ParkingManagement.DTOs
{
    public class MismatchCorrectionRequestDto
    {
        [Required(ErrorMessage = "SLOT_NAME_REQUIRED")]
        public string SlotName { get; set; } = string.Empty;

        [Required(ErrorMessage = "ORIGINAL_PLATE_REQUIRED")]
        public string OriginalLicensePlate { get; set; } = string.Empty;

        [Required(ErrorMessage = "CORRECTED_PLATE_REQUIRED")]
        public string CorrectedLicensePlate { get; set; } = string.Empty;

        [Required(ErrorMessage = "REASON_REQUIRED")]
        public string Reason { get; set; } = string.Empty;
    }
}