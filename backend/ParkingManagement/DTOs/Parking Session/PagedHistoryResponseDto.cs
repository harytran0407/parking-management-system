using System.Collections.Generic;

namespace ParkingManagement.DTOs
{
    public class PagedHistoryResponseDto
    {
        public bool Success { get; set; } = true;
        public List<ParkingHistoryItemDto> Data { get; set; } = new();
        public int TotalRecords { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
    }
}