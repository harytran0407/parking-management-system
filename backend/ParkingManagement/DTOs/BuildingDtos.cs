using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ParkingManagement.DTOs;

// ─── GET /api/v1/parking/buildings/info ──────────────────────────────────────

public class BuildingInfoResponse
{
    [JsonPropertyName("building_id")]
    public string BuildingId { get; set; } = null!;

    [JsonPropertyName("building_name")]
    public string BuildingName { get; set; } = null!;

    [JsonPropertyName("address")]
    public string? Address { get; set; }

    [JsonPropertyName("total_floors")]
    public int TotalFloors { get; set; }

    [JsonPropertyName("total_slots")]
    public int TotalSlots { get; set; }

    [JsonPropertyName("operation_hours")]
    public OperationHoursDto OperationHours { get; set; } = null!;

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("current_occupancy")]
    public OccupancyDto CurrentOccupancy { get; set; } = null!;
}

public class OperationHoursDto
{
    [JsonPropertyName("weekday_hours")]
    public string? WeekdayHours { get; set; }

    [JsonPropertyName("weekend_hours")]
    public string? WeekendHours { get; set; }

    [JsonPropertyName("is_24_7")]
    public bool Is247 { get; set; }
}

public class OccupancyDto
{
    [JsonPropertyName("total_occupied")]
    public int TotalOccupied { get; set; }

    [JsonPropertyName("total_available")]
    public int TotalAvailable { get; set; }

    [JsonPropertyName("occupancy_rate")]
    public double OccupancyRate { get; set; }
}

// ─── PUT /api/v1/parking/buildings/info ──────────────────────────────────────

public class UpdateBuildingRequest
{
    [Required(ErrorMessage = "building_name is required")]
    [MaxLength(200, ErrorMessage = "building_name must be at most 200 characters")]
    [JsonPropertyName("building_name")]
    public string BuildingName { get; set; } = null!;

    [Required(ErrorMessage = "address is required")]
    [MaxLength(500, ErrorMessage = "address must be at most 500 characters")]
    [JsonPropertyName("address")]
    public string Address { get; set; } = null!;

    [JsonPropertyName("weekday_hours")]
    [RegularExpression(@"^\d{2}:\d{2}\s*-\s*\d{2}:\d{2}$",
        ErrorMessage = "weekday_hours must be in format HH:MM - HH:MM")]
    public string? WeekdayHours { get; set; }

    [JsonPropertyName("weekend_hours")]
    [RegularExpression(@"^\d{2}:\d{2}\s*-\s*\d{2}:\d{2}$",
        ErrorMessage = "weekend_hours must be in format HH:MM - HH:MM")]
    public string? WeekendHours { get; set; }

    [JsonPropertyName("is_24_7")]
    public bool Is247 { get; set; } = false;
}

public class UpdateBuildingResponse
{
    [JsonPropertyName("building_id")]
    public string BuildingId { get; set; } = null!;

    [JsonPropertyName("building_name")]
    public string BuildingName { get; set; } = null!;

    [JsonPropertyName("address")]
    public string? Address { get; set; }

    [JsonPropertyName("weekday_hours")]
    public string? WeekdayHours { get; set; }

    [JsonPropertyName("weekend_hours")]
    public string? WeekendHours { get; set; }

    [JsonPropertyName("is_24_7")]
    public bool Is247 { get; set; }

    [JsonPropertyName("updated_at")]
    public DateTime UpdatedAt { get; set; }
}

// ─── Standard wrapper ─────────────────────────────────────────────────────────

public class ApiResponse<T>
{
    [JsonPropertyName("success")]
    public bool Success { get; set; }

    [JsonPropertyName("message")]
    public string? Message { get; set; }

    [JsonPropertyName("data")]
    public T? Data { get; set; }

    public static ApiResponse<T> Ok(T data, string? message = null) =>
        new() { Success = true, Data = data, Message = message };

    public static ApiResponse<T> Fail(string message) =>
        new() { Success = false, Message = message };
}
