using System;
using System.Collections.Generic;

namespace ParkingManagement.Models;

public partial class PricingPolicy
{
    public int PolicyId { get; set; }

    public decimal BasePrice { get; set; }

    public decimal HourlyRate { get; set; }

    public decimal OvernightFee { get; set; }

    public DateOnly EffectiveDate { get; set; }

    public int VehicleTypeId { get; set; }

    public decimal HandlingFee { get; set; }

    public virtual VehicleType VehicleType { get; set; } = null!;
}
