using System;
using System.Collections.Generic;

namespace ParkingManagement.Models;

public partial class FloorZone
{
    public int ZoneId { get; set; }

    public string ZoneName { get; set; } = null!;

    public int FloorNumber { get; set; }

    public int Capacity { get; set; }

    public string? Status { get; set; }

    public int VehicleTypeId { get; set; }

    public string? BuildingId { get; set; }

    public virtual ParkingBuilding? Building { get; set; }

    public virtual ICollection<ParkingSlot> ParkingSlots { get; set; } = new List<ParkingSlot>();

    public virtual VehicleType VehicleType { get; set; } = null!;
}
