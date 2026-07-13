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

    [JsonPropertyName("base_hours")]
    public int BaseHours { get; set; }

    [JsonPropertyName("subsequent_rate")]
    public decimal SubsequentRate { get; set; }

    [JsonPropertyName("subsequent_hours")]
    public int SubsequentHours { get; set; }

    [JsonPropertyName("daily_max_price")]
    public decimal DailyMaxPrice { get; set; }

    [JsonPropertyName("effective_date")]
    public string EffectiveDate { get; set; } = null!;
    [JsonPropertyName("handling_fee")]
    public decimal HandlingFee { get; set; }
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
    [Range(1, int.MaxValue, ErrorMessage = "base_hours must be >= 1")]
    [JsonPropertyName("base_hours")]
    public int BaseHours { get; set; }

    [Required]
    [Range(0, double.MaxValue, ErrorMessage = "subsequent_rate must be >= 0")]
    [JsonPropertyName("subsequent_rate")]
    public decimal SubsequentRate { get; set; }

    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "subsequent_hours must be >= 1")]
    [JsonPropertyName("subsequent_hours")]
    public int SubsequentHours { get; set; }

    [Required]
    [Range(0, double.MaxValue, ErrorMessage = "daily_max_price must be >= 0")]
    [JsonPropertyName("daily_max_price")]
    public decimal DailyMaxPrice { get; set; }

    [Required(ErrorMessage = "effective_date is required (YYYY-MM-DD)")]
    [JsonPropertyName("effective_date")]
    public string EffectiveDate { get; set; } = null!;
    [Required]
    [Range(0, double.MaxValue)]
    [JsonPropertyName("handling_fee")]
    public decimal HandlingFee { get; set; }
}

// ─── PUT ─────────────────────────────────────────────────────────────────────

public class UpdatePricingPolicyRequest
{
    [Range(0, double.MaxValue)]
    [JsonPropertyName("base_price")]
    public decimal? BasePrice { get; set; }

    [Range(1, int.MaxValue)]
    [JsonPropertyName("base_hours")]
    public int? BaseHours { get; set; }

    [Range(0, double.MaxValue)]
    [JsonPropertyName("subsequent_rate")]
    public decimal? SubsequentRate { get; set; }

    [Range(1, int.MaxValue)]
    [JsonPropertyName("subsequent_hours")]
    public int? SubsequentHours { get; set; }

    [Range(0, double.MaxValue)]
    [JsonPropertyName("daily_max_price")]
    public decimal? DailyMaxPrice { get; set; }

    [JsonPropertyName("effective_date")]
    public string? EffectiveDate { get; set; }
    [Range(0, double.MaxValue)]
    [JsonPropertyName("handling_fee")]
    public decimal? HandlingFee { get; set; }
}
