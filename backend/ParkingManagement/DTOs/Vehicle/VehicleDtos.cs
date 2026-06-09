using System.ComponentModel.DataAnnotations;

namespace ParkingManagement.DTOs.Vehicle
{
    public class CreateVehicleRequest
    {
        [Required]
        [MaxLength(50)]
        public string VehiclePlateNumber { get; set; } = null!;

        [MaxLength(200)]
        public string? VehicleDescription { get; set; }

        [MaxLength(50)]
        public string? Brand { get; set; }

        [MaxLength(50)]
        public string? Model { get; set; }

        [MaxLength(30)]
        public string? Color { get; set; }

        [Required]
        public int VehicleTypeId { get; set; }
    }

    public class VehicleResponse
    {
        public int VehicleId { get; set; }
        public string VehiclePlateNumber { get; set; } = null!;
        public string? VehicleDescription { get; set; }
        public string? Brand { get; set; }
        public string? Model { get; set; }
        public string? Color { get; set; }
        public int VehicleTypeId { get; set; }
        public string VehicleTypeName { get; set; } = null!;
    }
}
