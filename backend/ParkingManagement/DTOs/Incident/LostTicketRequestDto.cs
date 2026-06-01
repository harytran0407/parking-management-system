using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ParkingManagement.DTOs
{
    public class LostTicketRequestDto
    {
        [Required]
        [JsonPropertyName("license_plate")]
        public string LicensePlate { get; set; } = null!;

        [Required]
        [JsonPropertyName("vehicle_type_id")]
        public int VehicleTypeId { get; set; }

        [JsonPropertyName("lost_reason")]
        public string? LostReason { get; set; }

        [JsonPropertyName("customer_phone")]
        public string? CustomerPhone { get; set; }

        // BỔ SUNG TRƯỜNG NÀY ĐỂ NHẬN ĐƯỢC ĐÚNG GIÁ TRỊ "usr_001" TỪ POSTMAN
        [Required]
        [JsonPropertyName("staff_id")]
        public string StaffId { get; set; } = null!;
    }
}