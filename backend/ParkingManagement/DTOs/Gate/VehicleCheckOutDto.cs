using System.ComponentModel.DataAnnotations;

namespace ParkingManagement.DTOs
{
    public class VehicleCheckOutDto
    {
        [Required]
        public string LicensePlateOut { get; set; } = null!;

        [Required]
        public string CameraOut { get; set; } = null!;

        [Required]
        public string GateOut { get; set; } = null!;

        public string? ImageUrlOut { get; set; }
    }
}