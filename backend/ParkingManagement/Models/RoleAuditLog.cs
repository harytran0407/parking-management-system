using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace ParkingManagement.Models;

public partial class RoleAuditLog
{
    public int RoleLogId { get; set; }

    public string AdminId { get; set; } = null!;

    public string TargetUserId { get; set; } = null!;

    public int? OldRoleId { get; set; }

    public int NewRoleId { get; set; }

    public DateTime? ChangedAt { get; set; }

    public virtual User Admin { get; set; } = null!;

    public virtual User TargetUser { get; set; } = null!;
}
