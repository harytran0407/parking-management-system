using System;
using System.Text.Json.Serialization;

namespace ParkingManagement.DTOs
{
    // Lớp bọc ngoài cùng của Response
    public class CheckInResponseDto
    {
        [JsonPropertyName("success")]
        public bool Success { get; set; }

        [JsonPropertyName("data")]
        public CheckInResultDataDto Data { get; set; } = null!;
    }

    // Lớp chứa dữ liệu chi tiết bên trong thuộc tính "data"
    public class CheckInResultDataDto
    {
        [JsonPropertyName("ticket_code")]
        public string? TicketCode { get; set; }

        [JsonPropertyName("session_id")]
        public string SessionId { get; set; } = null!;

        [JsonPropertyName("license_plate_in")]
        public string LicensePlateIn { get; set; } = null!;

        [JsonPropertyName("slot_id")]
        public string SlotId { get; set; } = null!;

        [JsonPropertyName("slot_name")]
        public string SlotName { get; set; } = null!;

        [JsonPropertyName("floor")]
        public int Floor { get; set; }

        [JsonPropertyName("zone")]
        public string Zone { get; set; } = null!;

        [JsonPropertyName("check_in_time")]
        public DateTime CheckInTime { get; set; }

        [JsonPropertyName("status")]
        public string Status { get; set; } = null!;

        [JsonPropertyName("payment_status")]
        public string PaymentStatus { get; set; } = null!;
    }
}