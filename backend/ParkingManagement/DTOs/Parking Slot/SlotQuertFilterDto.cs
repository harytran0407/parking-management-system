namespace ParkingManagement.DTOs
{
    public class SlotQueryFilterDto
    {
        public int? Floor { get; set; }
        public string? Zone { get; set; }
        public int? VehicleTypeId { get; set; }
        public string? Status { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }
}