<<<<<<< HEAD
using System;
=======
﻿using System;
>>>>>>> origin/main
using System.Collections.Generic;

namespace ParkingManagement.Models;

public partial class FloorZone
{
    public int ZoneId { get; set; }

    public string ZoneName { get; set; } = null!;

    public int FloorNumber { get; set; }

    public int Capacity { get; set; }

<<<<<<< HEAD
    /// <summary>Số chỗ trống thực tế. Giảm khi check-in, tăng khi check-out.</summary>
    public int AvailableCapacity { get; set; }

=======
>>>>>>> origin/main
    public string? Status { get; set; }

    public int VehicleTypeId { get; set; }

    public string? BuildingId { get; set; }

    public virtual ParkingBuilding? Building { get; set; }

    public virtual ICollection<ParkingSlot> ParkingSlots { get; set; } = new List<ParkingSlot>();

<<<<<<< HEAD
    public virtual ICollection<ParkingSession> ParkingSessions { get; set; } = new List<ParkingSession>();

    public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();

=======
>>>>>>> origin/main
    public virtual VehicleType VehicleType { get; set; } = null!;
}
