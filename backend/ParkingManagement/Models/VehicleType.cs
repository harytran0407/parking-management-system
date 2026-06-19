<<<<<<< HEAD
using System;
=======
﻿using System;
>>>>>>> origin/main
using System.Collections.Generic;

namespace ParkingManagement.Models;

public partial class VehicleType
{
    public int VehicleTypeId { get; set; }

    public string VehicleTypeName { get; set; } = null!;

    public virtual ICollection<FloorZone> FloorZones { get; set; } = new List<FloorZone>();

    public virtual ICollection<ParkingSession> ParkingSessions { get; set; } = new List<ParkingSession>();

    public virtual ICollection<PricingPolicy> PricingPolicies { get; set; } = new List<PricingPolicy>();

<<<<<<< HEAD
    public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();
=======
    public virtual ICollection<SubscriptionPlan> SubscriptionPlans { get; set; } = new List<SubscriptionPlan>();

    public virtual ICollection<Vehicle> Vehicles { get; set; } = new List<Vehicle>();
>>>>>>> origin/main
}
