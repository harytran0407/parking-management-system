namespace ParkingManagement.DTOs
{
    public class MismatchCorrectionResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = null!;
        public MismatchCorrectionDataDto Data { get; set; } = null!;
    }

    public class MismatchCorrectionDataDto
    {
        public int IncidentLogId { get; set; }
        public string SessionId { get; set; } = null!;
        public string Status { get; set; } = null!; // "RESOLVED"
    }
}