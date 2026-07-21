// File: ParkingManagement/DTOs/UpdateSlotStatusDto.cs
namespace ParkingManagement.DTOs
{
    public class UpdateSlotStatusDto
    {
        // Nhận từ Route parameter: /api/v1/parking/slots/{slot_id}/status
        public string SlotId { get; set; } = string.Empty;

        // Nhận từ Request Body
        public string Status { get; set; } = string.Empty; // AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE
        public string Reason { get; set; } = string.Empty;
        public int EstimatedDurationMinutes { get; set; }
    }

    public class SlotStatusResponseData
    {
        public string SlotId { get; set; } = string.Empty;
        public string SlotName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime LastUpdated { get; set; }
    }

    public class SlotStatusResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public SlotStatusResponseData Data { get; set; } = new();
    }

    public class BulkUpdateSlotStatusDto
    {
        public System.Collections.Generic.List<string> SlotIds { get; set; } = new();
        public string Status { get; set; } = string.Empty; // AVAILABLE, MAINTENANCE
        public string Reason { get; set; } = string.Empty;
        public int EstimatedDurationMinutes { get; set; }
    }

    public class BulkUpdateSlotStatusResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public System.Collections.Generic.List<string> UpdatedSlotIds { get; set; } = new();
    }

    public class ZoneRealtimeStatsDto
    {
        public int ZoneId { get; set; }
        public string ZoneName { get; set; } = string.Empty;
        public int FloorNumber { get; set; }
        public int Capacity { get; set; }
        public int AvailableCapacity { get; set; }
        public int BookedCount { get; set; }      // Số booking đang active (CONFIRMED)
        public int OccupiedCount { get; set; }    // Số xe đang thực sự đỗ trong zone (ACTIVE sessions)
        public int MaintenanceCount { get; set; } // Số slot đang bảo trì trong zone
        public string VehicleTypeName { get; set; } = string.Empty;
        public string Status { get; set; } = "ACTIVE"; // Trạng thái của Zone (ACTIVE / MAINTENANCE)
    }
}