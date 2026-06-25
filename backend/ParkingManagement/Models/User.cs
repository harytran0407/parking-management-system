using System;
using System.Collections.Generic;

namespace ParkingManagement.Models;

public partial class User
{
    public string UserId { get; set; } = null!;

    public string Username { get; set; } = null!;

    public string Password { get; set; } = null!;

    public string? FullName { get; set; }

    public string? Email { get; set; }

    public string? Phone { get; set; }

    public int? RoleId { get; set; }

    public string? Status { get; set; }

    public DateTime? LastLogin { get; set; }

    public DateTime? CreatedAt { get; set; }

    public string? AvatarUrl { get; set; }

    public string? OtpCode { get; set; }

    public DateTime? OtpExpiredAt { get; set; }

    public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();

    public virtual ICollection<IncidentLog> IncidentLogReportedByNavigations { get; set; } = new List<IncidentLog>();

    public virtual ICollection<IncidentLog> IncidentLogResolvedByNavigations { get; set; } = new List<IncidentLog>();

    public virtual ICollection<ParkingSession> ParkingSessionStaffIns { get; set; } = new List<ParkingSession>();

    public virtual ICollection<ParkingSession> ParkingSessionStaffOuts { get; set; } = new List<ParkingSession>();

    public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();

    public virtual Role? Role { get; set; }
}
