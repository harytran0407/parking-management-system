using System;
using System.Collections.Generic;

namespace ParkingManagement.Models;

public partial class PricingPolicy
{
    public int PolicyId { get; set; }

    public decimal BasePrice { get; set; }

    public int BaseHours { get; set; }

    public decimal SubsequentRate { get; set; }

    public int SubsequentHours { get; set; }

    public decimal DailyMaxPrice { get; set; }

    public DateOnly EffectiveDate { get; set; }

    public int VehicleTypeId { get; set; }

    public decimal HandlingFee { get; set; }

    public virtual VehicleType VehicleType { get; set; } = null!;
}
