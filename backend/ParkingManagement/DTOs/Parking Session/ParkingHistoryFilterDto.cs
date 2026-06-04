namespace ParkingManagement.DTOs
{
    public class ParkingHistoryFilterDto
    {
        public string? LicensePlate { get; set; } // Lọc theo biển số xe
        public DateTime? FromDate { get; set; }   // Từ ngày
        public DateTime? ToDate { get; set; }     // Đến ngày
        public string? VehicleType { get; set; }  // Loại xe (Car, Motorbike...)
        public int Page { get; set; } = 1;        // Trang hiện tại
        public int PageSize { get; set; } = 20;   // Số lượng bản ghi / trang
    }
}