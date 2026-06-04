using System;

namespace ParkingManagement.DTOs
{
    public class LostTicketResponseDto
    {
        public bool Success { get; set; }
        public LostTicketDataDto Data { get; set; } = null!;
    }

    public class LostTicketDataDto
    {
        public int IncidentLogId { get; set; }
        public string SessionId { get; set; } = null!;
        public DateTime? CheckInTime { get; set; }  // BỔ SUNG
        public DateTime CheckOutTime { get; set; }   // BỔ SUNG
        public decimal CalculatedFee { get; set; }
        public FeeBreakdownLostTicket Breakdown { get; set; } = null!;
        public bool PaymentRequired { get; set; }
    }

    public class FeeBreakdownLostTicket
    {
        public decimal ActualParkingFee { get; set; } // SỬA: Đổi từ MaxDailyRate thành Phí đỗ thực tế
        public decimal HandlingFee { get; set; }
    }
}