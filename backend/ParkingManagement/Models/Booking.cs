using System;
using System.Collections.Generic;

namespace ParkingManagement.Models;

public partial class Booking
{
    public string BookingId { get; set; } = null!;

    public string VehicleUserId { get; set; } = null!;

    public int? VehicleId { get; set; }

    public string? SlotId { get; set; }

    public DateTime ExpectedArrival { get; set; }

    public DateTime? ExpiredAt { get; set; }

    public DateTime? BookingTime { get; set; }

    public string? Status { get; set; }

    public string? Notes { get; set; }

    public virtual ICollection<ParkingSession> ParkingSessions { get; set; } = new List<ParkingSession>();

    public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();

    public virtual ParkingSlot? Slot { get; set; }

    public virtual Vehicle? Vehicle { get; set; }

    public virtual User VehicleUser { get; set; } = null!;
}
