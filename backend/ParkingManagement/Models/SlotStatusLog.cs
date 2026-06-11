using System;
using System.Collections.Generic;

namespace ParkingManagement.Models;

public partial class SlotStatusLog
{
    public string LogId { get; set; } = null!;

    public string SlotId { get; set; } = null!;

    public string OldStatus { get; set; } = null!;

    public string NewStatus { get; set; } = null!;

    public string ChangedBy { get; set; } = null!;

    public DateTime ChangedAt { get; set; }

    public string? Reason { get; set; }

    public int? EstimatedDurationMinutes { get; set; }
}
