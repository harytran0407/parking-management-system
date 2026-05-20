using System;
using System.Collections.Generic;

namespace ParkingManagement.Models;

public partial class MonthlyPass
{
    public int MonthlyPassId { get; set; }

    public int VehicleId { get; set; }

    public string? PlanId { get; set; }

    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    public string? Status { get; set; }

    public string? PaymentStatus { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();

    public virtual SubscriptionPlan? Plan { get; set; }

    public virtual Vehicle Vehicle { get; set; } = null!;
}
