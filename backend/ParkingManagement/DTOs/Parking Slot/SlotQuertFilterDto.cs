using Microsoft.AspNetCore.Mvc;

namespace ParkingManagement.DTOs
{
    public class SlotQueryFilterDto
    {
        [FromQuery(Name = "floor")]
        public int? Floor { get; set; }

        [FromQuery(Name = "zone")]
        public string? Zone { get; set; }

        [FromQuery(Name = "vehicle_type_id")] 
        public int? VehicleTypeId { get; set; }

        [FromQuery(Name = "status")]
        public string? Status { get; set; }

        [FromQuery(Name = "page")]
        public int Page { get; set; } = 1;

        [FromQuery(Name = "page_size")]
        public int PageSize { get; set; } = 20;
    }
}