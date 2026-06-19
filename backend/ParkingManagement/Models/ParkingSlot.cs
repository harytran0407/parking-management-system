<<<<<<< HEAD
using System;
=======
﻿using System;
>>>>>>> origin/main
using System.Collections.Generic;

namespace ParkingManagement.Models;

public partial class ParkingSlot
{
    public string SlotId { get; set; } = null!;

    public string SlotName { get; set; } = null!;

    public string? Status { get; set; }

    public bool? IsHandicap { get; set; }

    public bool? IsElectricCharging { get; set; }

    public string? CurrentSessionId { get; set; }

    public DateTime? LastUpdated { get; set; }

    public int ZoneId { get; set; }

<<<<<<< HEAD
=======
    public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();
>>>>>>> origin/main

    public virtual ICollection<ParkingSession> ParkingSessions { get; set; } = new List<ParkingSession>();

    public virtual FloorZone Zone { get; set; } = null!;
}
