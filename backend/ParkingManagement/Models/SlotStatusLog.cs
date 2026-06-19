<<<<<<< HEAD
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ParkingManagement.Models
{
    [Table("SLOT_STATUS_LOGS")]
    public class SlotStatusLog
    {
        [Key]
        [Column("log_id")]
        public string LogId { get; set; } = null!;

        [Column("slot_id")]
        public string SlotId { get; set; } = null!;

        [Column("old_status")]
        public string OldStatus { get; set; } = null!; 

        [Column("new_status")]
        public string NewStatus { get; set; } = null!;

        [Column("changed_by")]
        public string ChangedBy { get; set; } = null!; 

        [Column("changed_at")]
        public DateTime ChangedAt { get; set; }

        [Column("reason")]
        public string? Reason { get; set; } 

        [Column("estimated_duration_minutes")]
        public int EstimatedDurationMinutes { get; set; }
    }
}
=======
﻿using System;
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
>>>>>>> origin/main
