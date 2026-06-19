<<<<<<< HEAD
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ParkingManagement.Models;

[Table("SYSTEM_LOGS")]
public partial class SystemLog
{
    [Key]
    [Column("LOG_ID")]
    public int LogId { get; set; }

    [Column("LOG_LEVEL")]
    [Required]
    [StringLength(50)]
    public string LogLevel { get; set; } = null!;

    [Column("MESSAGE")]
    [Required]
    public string Message { get; set; } = null!;

    [Column("SOURCE")]
    [StringLength(150)]
    public string? Source { get; set; }

    [Column("CREATE_AT")]
    public DateTime? CreatedAt { get; set; }
}
=======
﻿using System;

namespace ParkingManagement.Models
{
    public class SystemLog
    {
        public int LogId { get; set; }
        public string LogLevel { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string? Source { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
>>>>>>> origin/main
