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
        public decimal HourlyRate { get; set; }
        public int Hours { get; set; }
        public decimal OvernightFee { get; set; }
        public decimal Total { get; set; }
    }
}