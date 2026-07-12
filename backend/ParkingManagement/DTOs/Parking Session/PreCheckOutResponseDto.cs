namespace ParkingManagement.DTOs
{
    public class PreCheckOutResponseDto
    {
        public bool Success { get; set; }
        public PreCheckOutDataDto Data { get; set; } = null!;
    }

    public class PreCheckOutDataDto
    {
        public string SessionId { get; set; } = null!;
        public decimal CurrentFee { get; set; }
        public FeeBreakdownDto FeeBreakdown { get; set; } = null!;
        public int GracePeriodRemainingSeconds { get; set; }
    }

    public class FeeBreakdownDto
    {
        public decimal BasePrice { get; set; }
        public decimal HourlyRate { get; set; } // Compatibility (SubsequentRate)
        public int Hours { get; set; }
        public decimal OvernightFee { get; set; } // Compatibility (DailyMaxPrice)
        public decimal Total { get; set; }

        public int BaseHours { get; set; }
        public decimal SubsequentRate { get; set; }
        public int SubsequentHours { get; set; }
        public decimal DailyMaxPrice { get; set; }
    }
}