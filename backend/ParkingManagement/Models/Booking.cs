using System;
using System.Collections.Generic;

namespace ParkingManagement.Models;

public partial class Booking
{
    public string BookingId { get; set; } = null!;

    public string VehicleUserId { get; set; } = null!;

    public string LicensePlate { get; set; } = null!;

    public int VehicleTypeId { get; set; }

    /// <summary>Zone được gợi ý khi đặt chỗ (thay thế SlotId).</summary>
    public int? ZoneId { get; set; }

    public DateTime ExpectedArrival { get; set; }

    public DateTime? ExpiredAt { get; set; }

    public DateTime? BookingTime { get; set; }

    public string? Status { get; set; }

    public string? Notes { get; set; }

    public virtual ICollection<ParkingSession> ParkingSessions { get; set; } = new List<ParkingSession>();

    public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();

    public virtual FloorZone? Zone { get; set; }

    public virtual VehicleType VehicleType { get; set; } = null!;

    public virtual User VehicleUser { get; set; } = null!;
}
