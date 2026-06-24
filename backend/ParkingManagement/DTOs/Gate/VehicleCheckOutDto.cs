using System.ComponentModel.DataAnnotations;

namespace ParkingManagement.DTOs
{
    public class VehicleCheckOutDto
    {
        public string? TicketCode { get; set; }

        public string? BookingId { get; set; }

        [Required(ErrorMessage = "LICENSE_PLATE_OUT_REQUIRED")]
        public string LicensePlateOut { get; set; } = null!;

        [Required(ErrorMessage = "CAMERA_OUT_REQUIRED")]
        public string CameraOut { get; set; } = null!;

        [Required(ErrorMessage = "GATE_OUT_REQUIRED")]
        public string GateOut { get; set; } = null!;

        public string? ImageUrlOut { get; set; }
    }
}