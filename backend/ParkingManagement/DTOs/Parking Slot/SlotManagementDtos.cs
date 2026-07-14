using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ParkingManagement.DTOs;
// ─── POST: Bulk create slots for a zone ──────────────────────────────────────

public class BulkCreateSlotsRequest
{
    [Required(ErrorMessage = "zone_id is required")]
    [JsonPropertyName("zone_id")]
    public int ZoneId { get; set; }

    [Required]
    [Range(1, 100, ErrorMessage = "count must be between 1 and 100")]
    [JsonPropertyName("count")]
    public int Count { get; set; }
}

public class BulkCreateSlotsResponse
{
    [JsonPropertyName("zone_id")]
    public int ZoneId { get; set; }

    [JsonPropertyName("zone_name")]
    public string ZoneName { get; set; } = null!;

    [JsonPropertyName("floor_number")]
    public int FloorNumber { get; set; }

    [JsonPropertyName("vehicle_type_name")]
    public string VehicleTypeName { get; set; } = null!;

    [JsonPropertyName("slots_created")]
    public int SlotsCreated { get; set; }

    [JsonPropertyName("slots")]
    public List<SlotCreatedItem> Slots { get; set; } = new();
}

public class SlotCreatedItem
{
    [JsonPropertyName("slot_id")]
    public string SlotId { get; set; } = null!;

    [JsonPropertyName("slot_name")]
    public string SlotName { get; set; } = null!;
}

// ─── PUT: Edit slot ───────────────────────────────────────────────────────────

public class EditSlotRequest
{
    [JsonPropertyName("is_handicap")]
    public bool? IsHandicap { get; set; }

    [JsonPropertyName("is_electric_charging")]
    public bool? IsElectricCharging { get; set; }

    // Nếu truyền vào null = xóa session hiện tại, reset slot về trạng thái trước OCCUPIED
    [JsonPropertyName("current_session_id")]
    public string? CurrentSessionId { get; set; }

    [JsonPropertyName("clear_session")]
    public bool ClearSession { get; set; } = false;
}

public class EditSlotResponse
{
    [JsonPropertyName("slot_id")]
    public string SlotId { get; set; } = null!;

    [JsonPropertyName("slot_name")]
    public string SlotName { get; set; } = null!;

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("is_handicap")]
    public bool? IsHandicap { get; set; }

    [JsonPropertyName("is_electric_charging")]
    public bool? IsElectricCharging { get; set; }

    [JsonPropertyName("current_session_id")]
    public string? CurrentSessionId { get; set; }

    [JsonPropertyName("last_updated")]
    public DateTime? LastUpdated { get; set; }

    [JsonPropertyName("session_cleared")]
    public bool SessionCleared { get; set; }
}

// ─── DELETE: Bulk delete slots ──────────────────────────────────────────────────
public class BulkDeleteSlotsRequest
{
    [Required(ErrorMessage = "slot_ids is required")]
    [JsonPropertyName("slot_ids")]
    public List<string> SlotIds { get; set; } = new();
}
