using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ParkingManagement.DTOs.Building;

// ─── GET response ─────────────────────────────────────────────────────────────

public class PricingPolicyResponse
{
    [JsonPropertyName("policy_id")]
    public int PolicyId { get; set; }

    [JsonPropertyName("vehicle_type_id")]
    public int VehicleTypeId { get; set; }

    [JsonPropertyName("vehicle_type_name")]
    public string VehicleTypeName { get; set; } = null!;

    [JsonPropertyName("base_price")]
    public decimal BasePrice { get; set; }

    [JsonPropertyName("hourly_rate")]
    public decimal HourlyRate { get; set; }

    [JsonPropertyName("overnight_fee")]
    public decimal OvernightFee { get; set; }

    [JsonPropertyName("effective_date")]
    public string EffectiveDate { get; set; } = null!;
}

// ─── POST ─────────────────────────────────────────────────────────────────────

public class CreatePricingPolicyRequest
{
    [Required]
    [JsonPropertyName("vehicle_type_id")]
    public int VehicleTypeId { get; set; }

    [Required]
    [Range(0, double.MaxValue, ErrorMessage = "base_price must be >= 0")]
    [JsonPropertyName("base_price")]
    public decimal BasePrice { get; set; }

    [Required]
    [Range(0, double.MaxValue, ErrorMessage = "hourly_rate must be >= 0")]
    [JsonPropertyName("hourly_rate")]
    public decimal HourlyRate { get; set; }

    [Required]
    [Range(0, double.MaxValue, ErrorMessage = "overnight_fee must be >= 0")]
    [JsonPropertyName("overnight_fee")]
    public decimal OvernightFee { get; set; }

    [Required(ErrorMessage = "effective_date is required (YYYY-MM-DD)")]
    [JsonPropertyName("effective_date")]
    public string EffectiveDate { get; set; } = null!;
}

// ─── PUT ─────────────────────────────────────────────────────────────────────

public class UpdatePricingPolicyRequest
{
    [Range(0, double.MaxValue)]
    [JsonPropertyName("base_price")]
    public decimal? BasePrice { get; set; }

    [Range(0, double.MaxValue)]
    [JsonPropertyName("hourly_rate")]
    public decimal? HourlyRate { get; set; }

    [Range(0, double.MaxValue)]
    [JsonPropertyName("overnight_fee")]
    public decimal? OvernightFee { get; set; }

    [JsonPropertyName("effective_date")]
    public string? EffectiveDate { get; set; }
}
