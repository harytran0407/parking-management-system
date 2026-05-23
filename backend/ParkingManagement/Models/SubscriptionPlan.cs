using System;
using System.Collections.Generic;

namespace ParkingManagement.Models;

public partial class SubscriptionPlan
{
    public string PlanId { get; set; } = null!;

    public int VehicleTypeId { get; set; }

    public int DurationDays { get; set; }

    public decimal Price { get; set; }

    public int? GracePeriodDays { get; set; }

    public virtual ICollection<MonthlyPass> MonthlyPasses { get; set; } = new List<MonthlyPass>();

    public virtual VehicleType VehicleType { get; set; } = null!;
}
