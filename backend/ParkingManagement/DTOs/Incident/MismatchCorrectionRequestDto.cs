using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ParkingManagement.DTOs
{
    public class MismatchCorrectionRequestDto
    {
        [JsonPropertyName("slot_name")]
        public string? SlotName { get; set; }

        [Required(ErrorMessage = "ORIGINAL_PLATE_REQUIRED")]
        [JsonPropertyName("original_license_plate")]
        public string OriginalLicensePlate { get; set; } = string.Empty;

        [Required(ErrorMessage = "CORRECTED_PLATE_REQUIRED")]
        [JsonPropertyName("corrected_license_plate")]
        public string CorrectedLicensePlate { get; set; } = string.Empty;

        [Required(ErrorMessage = "REASON_REQUIRED")]
        [JsonPropertyName("reason")]
        public string Reason { get; set; } = string.Empty;
    }
}