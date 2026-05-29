using System.Collections.Generic;

namespace ParkingManagement.DTOs
{
    public class ParkingSlotsResponseDto
    {
        public bool Success { get; set; } = true;
        public SlotResultData Data { get; set; } = new SlotResultData();
    }

    public class SlotResultData
    {
        public SlotSummaryDto Summary { get; set; } = new SlotSummaryDto();
        public List<SlotDetailDto> Slots { get; set; } = new List<SlotDetailDto>();
        public PaginationDto Pagination { get; set; } = new PaginationDto();
    }

    public class SlotSummaryDto
    {
        public int TotalSlots { get; set; }
        public int Available { get; set; }
        public int Occupied { get; set; }
        public int Reserved { get; set; }
        public int Maintenance { get; set; }
    }

    public class SlotDetailDto
    {
        public string SlotId { get; set; } = null!;
        public string SlotName { get; set; } = null!;
        public int Floor { get; set; }
        public string Zone { get; set; } = null!;
        public int VehicleTypeId { get; set; }
        public string Status { get; set; } = null!;
        public bool IsHandicap { get; set; }
        public bool IsElectricCharging { get; set; }
        public string? CurrentSessionId { get; set; }
        public string? OccupiedByPlate { get; set; }
        public DateTime? OccupiedSince { get; set; }
        public DateTime? LastUpdated { get; set; }
    }

    public class PaginationDto
    {
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalItems { get; set; }
        public int TotalPages { get; set; }
    }
}