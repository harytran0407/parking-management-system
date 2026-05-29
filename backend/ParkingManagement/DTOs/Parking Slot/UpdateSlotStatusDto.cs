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
}