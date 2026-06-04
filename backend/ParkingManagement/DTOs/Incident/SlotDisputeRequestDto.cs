using System.ComponentModel.DataAnnotations;

namespace ParkingManagement.DTOs
{
    public class SlotDisputeRequestDto
    {
        [Required(ErrorMessage = "SESSION_ID_REQUIRED")]
        public string SessionId { get; set; } = null!; // SessionId của chiếc xe đang đỗ nhầm

        public string? Reason { get; set; }
    }
}