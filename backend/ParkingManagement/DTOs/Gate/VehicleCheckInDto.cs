using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ParkingManagement.DTOs
{
    public class VehicleCheckInDto
    {
        [Required]
        [JsonPropertyName("license_plate_in")]
        public string LicensePlateIn { get; set; } = null!;

        [Required]
        [JsonPropertyName("vehicle_type_id")]
        public int VehicleTypeId { get; set; }

        [JsonPropertyName("camera_in")]
        public string? CameraIn { get; set; }

        [JsonPropertyName("gate_in")]
        public string? GateIn { get; set; }

        [JsonPropertyName("image_url_in")]
        public string? ImageUrlIn { get; set; }

        [JsonPropertyName("staff_in_id")]
        public string? StaffInId { get; set; }

        [JsonPropertyName("booking_id")]
        public string? BookingId { get; set; }

        [JsonPropertyName("confirm_early_in")]
        public bool ConfirmEarlyIn { get; set; }
    }
}
