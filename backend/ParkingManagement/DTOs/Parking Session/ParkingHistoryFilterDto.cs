namespace ParkingManagement.DTOs
{
    public class ParkingHistoryFilterDto
    {
        public string? LicensePlate { get; set; } 
        public DateTime? FromDate { get; set; } 
        public DateTime? ToDate { get; set; }     
        public string? VehicleType { get; set; }  
        public string? Status { get; set; }       
        public int Page { get; set; } = 1;        
        public int PageSize { get; set; } = 20;   
    }
}