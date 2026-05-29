using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ParkingManagement.DTOs.Building;

// ─── GET response ─────────────────────────────────────────────────────────────

public class FloorZoneResponse
{
    [JsonPropertyName("zone_id")]
    public int ZoneId { get; set; }

    [JsonPropertyName("zone_name")]
    public string ZoneName { get; set; } = null!;

    [JsonPropertyName("floor_number")]
    public int FloorNumber { get; set; }

    [JsonPropertyName("capacity")]
    public int Capacity { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("vehicle_type_id")]
    public int VehicleTypeId { get; set; }

    [JsonPropertyName("vehicle_type_name")]
    public string VehicleTypeName { get; set; } = null!;

    [JsonPropertyName("active_vehicles_count")]
    public int ActiveVehiclesCount { get; set; }
}

// ─── PUT request — assign vehicle type to floor ───────────────────────────────

public class UpdateFloorAllocationRequest
{
    [Required(ErrorMessage = "vehicle_type_id is required")]
    [JsonPropertyName("vehicle_type_id")]
    public int VehicleTypeId { get; set; }

    [JsonPropertyName("capacity")]
    public int? Capacity { get; set; }

    [JsonPropertyName("status")]
    [RegularExpression("^(ACTIVE|MAINTENANCE)$",
        ErrorMessage = "status must be ACTIVE or MAINTENANCE")]
    public string? Status { get; set; }
}

// ─── PUT response ─────────────────────────────────────────────────────────────

public class UpdateFloorAllocationResponse
{
    [JsonPropertyName("zone_id")]
    public int ZoneId { get; set; }

    [JsonPropertyName("zone_name")]
    public string ZoneName { get; set; } = null!;

    [JsonPropertyName("floor_number")]
    public int FloorNumber { get; set; }

    [JsonPropertyName("vehicle_type_id")]
    public int VehicleTypeId { get; set; }

    [JsonPropertyName("vehicle_type_name")]
    public string VehicleTypeName { get; set; } = null!;

    [JsonPropertyName("updated_at")]
    public DateTime UpdatedAt { get; set; }

    // AC2: warning nếu có xe đang đỗ khi đổi config
    [JsonPropertyName("warning")]
    public string? Warning { get; set; }
}
public class CreateFloorZoneRequest
{
    [Required(ErrorMessage = "zone_name is required")]
    [MaxLength(50)]
    [JsonPropertyName("zone_name")]
    public string ZoneName { get; set; } = null!;

    [Required]
    [JsonPropertyName("floor_number")]
    public int FloorNumber { get; set; }

    [Required]
    [JsonPropertyName("capacity")]
    public int Capacity { get; set; }

    [Required]
    [JsonPropertyName("vehicle_type_id")]
    public int VehicleTypeId { get; set; }
}
