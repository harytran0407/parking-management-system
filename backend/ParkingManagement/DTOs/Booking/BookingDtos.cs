using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ParkingManagement.DTOs.Booking;

// ─── POST: Create booking ─────────────────────────────────────────────────────

public class CreateBookingRequest
{
    [Required]
    [JsonPropertyName("slot_id")]
    public string SlotId { get; set; } = null!;

    [Required]
    [JsonPropertyName("vehicle_id")]
    public int VehicleId { get; set; }

    [Required(ErrorMessage = "expected_arrival is required")]
    [JsonPropertyName("expected_arrival")]
    public DateTime ExpectedArrival { get; set; }

    [JsonPropertyName("notes")]
    public string? Notes { get; set; }
}

// ─── GET: Price estimate ──────────────────────────────────────────────────────

public class BookingPriceRequest
{
    [Required]
    [JsonPropertyName("slot_id")]
    public string SlotId { get; set; } = null!;

    [Required]
    [JsonPropertyName("expected_arrival")]
    public DateTime ExpectedArrival { get; set; }
}

public class BookingPriceResponse
{
    [JsonPropertyName("slot_id")]
    public string SlotId { get; set; } = null!;

    [JsonPropertyName("slot_name")]
    public string SlotName { get; set; } = null!;

    [JsonPropertyName("vehicle_type_name")]
    public string VehicleTypeName { get; set; } = null!;

    [JsonPropertyName("expected_arrival")]
    public DateTime ExpectedArrival { get; set; }

    [JsonPropertyName("base_price")]
    public decimal BasePrice { get; set; }

    [JsonPropertyName("hourly_rate")]
    public decimal HourlyRate { get; set; }

    [JsonPropertyName("estimated_fee")]
    public decimal EstimatedFee { get; set; }

    [JsonPropertyName("fee_note")]
    public string FeeNote { get; set; } = null!;
}

// ─── Booking response ─────────────────────────────────────────────────────────

public class BookingResponse
{
    [JsonPropertyName("booking_id")]
    public string BookingId { get; set; } = null!;

    [JsonPropertyName("slot_id")]
    public string? SlotId { get; set; }

    [JsonPropertyName("slot_name")]
    public string? SlotName { get; set; }

    [JsonPropertyName("floor_number")]
    public int? FloorNumber { get; set; }

    [JsonPropertyName("zone_name")]
    public string? ZoneName { get; set; }

    [JsonPropertyName("vehicle_id")]
    public int? VehicleId { get; set; }

    [JsonPropertyName("expected_arrival")]
    public DateTime ExpectedArrival { get; set; }

    [JsonPropertyName("expired_at")]
    public DateTime? ExpiredAt { get; set; }

    [JsonPropertyName("booking_time")]
    public DateTime? BookingTime { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("notes")]
    public string? Notes { get; set; }

    [JsonPropertyName("estimated_fee")]
    public decimal EstimatedFee { get; set; }
}
