using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ParkingManagement.DTOs.Building;

// ─── GET (single & list) ─────────────────────────────────────────────────────

public class VehicleTypeResponse
{
    [JsonPropertyName("vehicle_type_id")]
    public int VehicleTypeId { get; set; }

    [JsonPropertyName("vehicle_type_name")]
    public string VehicleTypeName { get; set; } = null!;

    [JsonPropertyName("related_slots_count")]
    public int RelatedSlotsCount { get; set; }

    [JsonPropertyName("active_sessions_count")]
    public int ActiveSessionsCount { get; set; }
}

// ─── POST ────────────────────────────────────────────────────────────────────

public class CreateVehicleTypeRequest
{
    [Required(ErrorMessage = "vehicle_type_name is required")]
    [MaxLength(100, ErrorMessage = "vehicle_type_name must be at most 100 characters")]
    [JsonPropertyName("vehicle_type_name")]
    public string VehicleTypeName { get; set; } = null!;
}

// ─── PUT ─────────────────────────────────────────────────────────────────────

public class UpdateVehicleTypeRequest
{
    [Required(ErrorMessage = "vehicle_type_name is required")]
    [MaxLength(100, ErrorMessage = "vehicle_type_name must be at most 100 characters")]
    [JsonPropertyName("vehicle_type_name")]
    public string VehicleTypeName { get; set; } = null!;
}

// ─── DELETE preview ──────────────────────────────────────────────────────────

public class DeleteVehicleTypePreview
{
    [JsonPropertyName("vehicle_type_id")]
    public int VehicleTypeId { get; set; }

    [JsonPropertyName("vehicle_type_name")]
    public string VehicleTypeName { get; set; } = null!;

    [JsonPropertyName("related_slots_count")]
    public int RelatedSlotsCount { get; set; }

    [JsonPropertyName("active_sessions_count")]
    public int ActiveSessionsCount { get; set; }

    [JsonPropertyName("can_delete")]
    public bool CanDelete { get; set; }

    [JsonPropertyName("reason")]
    public string? Reason { get; set; }
}
