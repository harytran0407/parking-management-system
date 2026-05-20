using System;
using System.Collections.Generic;

namespace ParkingManagement.Models;

public partial class IncidentLog
{
    public int LogId { get; set; }

    public string? SessionId { get; set; }

    public string ReportedBy { get; set; } = null!;

    public string IssueType { get; set; } = null!;

    public string? Description { get; set; }

    public DateTime? ReportTime { get; set; }

    public string? Status { get; set; }

    public string? CustomerPhone { get; set; }

    public string? CustomerEmail { get; set; }

    public string? PaymentId { get; set; }

    public string? ResolvedBy { get; set; }

    public DateTime? ResolvedAt { get; set; }

    public virtual Payment? Payment { get; set; }

    public virtual User ReportedByNavigation { get; set; } = null!;

    public virtual User? ResolvedByNavigation { get; set; }

    public virtual ParkingSession? Session { get; set; }
}
