namespace ParkingManagement.DTOs
{
    public class SlotDisputeResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = null!;
        public SlotDisputeDataDto Data { get; set; } = null!;
    }

    public class SlotDisputeDataDto
    {
        public string ConflictedSlotName { get; set; } = null!; // Tên slot bị chiếm (Ví dụ: "A-102")
        public string ReallocatedSlotName { get; set; } = null!; // Tên slot mới cấp cho khách Booking
        public string MovedBookingId { get; set; } = null!; // Mã đặt chỗ được di dời an toàn
    }
}