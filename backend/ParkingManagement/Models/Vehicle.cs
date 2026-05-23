using System;
using System.Collections.Generic;

namespace ParkingManagement.Models;

public partial class Vehicle
{
    public int VehicleId { get; set; }

    public string VehiclePlateNumber { get; set; } = null!;

    public string? VehicleDescription { get; set; }

    public string? Brand { get; set; }

    public string? Model { get; set; }

    public string? Color { get; set; }

    public int VehicleTypeId { get; set; }

    public string VehicleUserId { get; set; } = null!;

    public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();

    public virtual ICollection<MonthlyPass> MonthlyPasses { get; set; } = new List<MonthlyPass>();

    public virtual ICollection<ParkingSession> ParkingSessions { get; set; } = new List<ParkingSession>();

    public virtual VehicleType VehicleType { get; set; } = null!;

    public virtual User VehicleUser { get; set; } = null!;
}
