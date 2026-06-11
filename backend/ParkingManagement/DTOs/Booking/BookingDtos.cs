using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ParkingManagement.DTOs.Booking;

// ─── POST: Create booking ─────────────────────────────────────────────────────

public class CreateBookingRequest
{
    /* MODIFIED BY ANTIGRAVITY (MADE OPTIONAL FOR AUTO-ASSIGNMENT FLOW) */
    [JsonPropertyName("slot_id")]
    public string? SlotId { get; set; }

    [Required]
    [JsonPropertyName("vehicle_id")]
    public int VehicleId { get; set; }

    [Required(ErrorMessage = "expected_arrival is required")]
    [JsonPropertyName("expected_arrival")]
    public DateTime ExpectedArrival { get; set; }

    /* MODIFIED BY ANTIGRAVITY (MADE OPTIONAL) */
    [JsonPropertyName("expired_at")]
    public DateTime? ExpiredAt { get; set; }

    [JsonPropertyName("notes")]
    public string? Notes { get; set; }
}

// ─── GET: Price estimate ──────────────────────────────────────────────────────

public class BookingPriceRequest
{
    /* MODIFIED BY ANTIGRAVITY (MADE OPTIONAL) */
    [JsonPropertyName("slot_id")]
    public string? SlotId { get; set; }

    [Required]
    [JsonPropertyName("expected_arrival")]
    public DateTime ExpectedArrival { get; set; }

    /* MODIFIED BY ANTIGRAVITY (MADE OPTIONAL) */
    [JsonPropertyName("expired_at")]
    public DateTime? ExpiredAt { get; set; }
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

    /* ADDED BY ANTIGRAVITY (REQUIRED FOR FRONTEND CONFIRMATION) */
    [JsonPropertyName("expired_at")]
    public DateTime ExpiredAt { get; set; }

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

    /* ADDED BY ANTIGRAVITY (REQUIRED BY FRONTEND & CONTROLLER) */
    [JsonPropertyName("vehicle_user_id")]
    public string VehicleUserId { get; set; } = null!;

    [JsonPropertyName("vehicle_id")]
    public int? VehicleId { get; set; }

    /* ADDED BY ANTIGRAVITY (REQUIRED BY FRONTEND & CONTROLLER) */
    [JsonPropertyName("vehicle_plate_number")]
    public string VehiclePlateNumber { get; set; } = string.Empty;

    /* ADDED BY ANTIGRAVITY (REQUIRED BY FRONTEND & CONTROLLER) */
    [JsonPropertyName("vehicle_type")]
    public string VehicleType { get; set; } = string.Empty;

    [JsonPropertyName("slot_id")]
    public string? SlotId { get; set; }

    [JsonPropertyName("slot_name")]
    public string? SlotName { get; set; }

    [JsonPropertyName("floor_number")]
    public int? FloorNumber { get; set; }

    /* ADDED BY ANTIGRAVITY (REQUIRED BY FRONTEND & CONTROLLER) */
    [JsonPropertyName("floor_name")]
    public string FloorName { get; set; } = string.Empty;

    [JsonPropertyName("zone_name")]
    public string? ZoneName { get; set; }

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

    /* ADDED BY ANTIGRAVITY (REQUIRED BY FRONTEND & CONTROLLER) */
    [JsonPropertyName("deposit_paid")]
    public decimal DepositPaid { get; set; }

    /* ADDED BY ANTIGRAVITY (REQUIRED BY FRONTEND & CONTROLLER) */
    [JsonPropertyName("qr_code_data")]
    public string QrCodeData { get; set; } = string.Empty;
}

/* ADDED BY ANTIGRAVITY (REQUIRED FOR ADJUST BOOKING ENDPOINT) */
public class AdjustBookingRequest
{
    [Required]
    [JsonPropertyName("expected_arrival")]
    public DateTime ExpectedArrival { get; set; }

    [JsonPropertyName("expired_at")]
    public DateTime? ExpiredAt { get; set; }
}

/* ADDED BY ANTIGRAVITY (REQUIRED FOR GET STATS ENDPOINT) */
public class BookingDashboardStatsResponse
{
    [JsonPropertyName("total_bookings")]
    public int TotalBookings { get; set; }

    [JsonPropertyName("this_month_new")]
    public int ThisMonthNew { get; set; }

    [JsonPropertyName("active_sessions")]
    public int ActiveSessions { get; set; }

    [JsonPropertyName("total_cost")]
    public decimal TotalCost { get; set; }
}
