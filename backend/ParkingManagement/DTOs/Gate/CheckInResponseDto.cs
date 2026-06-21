using System;
using System.Text.Json.Serialization;

namespace ParkingManagement.DTOs
{
    public class CheckInResponseDto
    {
        [JsonPropertyName("success")]
        public bool Success { get; set; }

        [JsonPropertyName("data")]
        public CheckInResultDataDto Data { get; set; } = null!;
    }

    public class CheckInResultDataDto
    {
        [JsonPropertyName("ticket_code")]
        public string? TicketCode { get; set; }

        [JsonPropertyName("session_id")]
        public string SessionId { get; set; } = null!;

        [JsonPropertyName("license_plate_in")]
        public string LicensePlateIn { get; set; } = null!;

        [JsonPropertyName("zone_id")]
        public int ZoneId { get; set; }

        [JsonPropertyName("zone_name")]
        public string ZoneName { get; set; } = null!;

        [JsonPropertyName("floor")]
        public int Floor { get; set; }

        [JsonPropertyName("available_capacity")]
        public int AvailableCapacity { get; set; }

        [JsonPropertyName("check_in_time")]
        public DateTime CheckInTime { get; set; }

        [JsonPropertyName("status")]
        public string Status { get; set; } = null!;

        [JsonPropertyName("payment_status")]
        public string PaymentStatus { get; set; } = null!;

        [JsonPropertyName("booking_id")]
        public string? BookingId { get; set; }
    }
}