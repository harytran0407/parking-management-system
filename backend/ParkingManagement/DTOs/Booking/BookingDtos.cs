using System;
using System.ComponentModel.DataAnnotations;

namespace ParkingManagement.DTOs.Booking
{
    public class CreateBookingRequest
    {
        [Required]
        [MaxLength(20)]
        public string SlotId { get; set; } = null!;

        [Required]
        public int VehicleId { get; set; }

        [Required]
        public DateTime ExpectedArrival { get; set; }

        [Required]
        public DateTime ExpiredAt { get; set; }

        [MaxLength(255)]
        public string? Notes { get; set; }
    }

    public class AdjustBookingRequest
    {
        [Required]
        public DateTime ExpectedArrival { get; set; }

        [Required]
        public DateTime ExpiredAt { get; set; }
    }

    public class BookingResponse
    {
        public string BookingId { get; set; } = null!;
        public string VehicleUserId { get; set; } = null!;
        public int? VehicleId { get; set; }
        public string VehiclePlateNumber { get; set; } = string.Empty;
        public string VehicleType { get; set; } = string.Empty;
        public string? SlotId { get; set; }
        public string SlotName { get; set; } = string.Empty;
        public string FloorName { get; set; } = string.Empty;
        public DateTime ExpectedArrival { get; set; }
        public DateTime? ExpiredAt { get; set; }
        public DateTime? BookingTime { get; set; }
        public string? Status { get; set; }
        public string? Notes { get; set; }
        public decimal DepositPaid { get; set; }
        public string QrCodeData { get; set; } = string.Empty;
    }

    public class BookingDashboardStatsResponse
    {
        public int TotalBookings { get; set; }
        public int ThisMonthNew { get; set; }
        public int ActiveSessions { get; set; }
        public decimal TotalCost { get; set; }
    }
}
