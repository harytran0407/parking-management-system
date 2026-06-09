using System;
using System.Collections.Generic;

namespace ParkingManagement.Models;

public partial class ParkingBuilding
{
    public string BuildingId { get; set; } = null!;

    public string BuildingName { get; set; } = null!;

    public string? Address { get; set; }

    public int TotalFloors { get; set; }

    public int TotalSlots { get; set; }

    public string? WeekdayHours { get; set; }

    public string? WeekendHours { get; set; }

    public bool? Is247 { get; set; }

    public string? Status { get; set; }

    public virtual ICollection<FloorZone> FloorZones { get; set; } = new List<FloorZone>();
}
