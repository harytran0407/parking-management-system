<<<<<<< HEAD
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ParkingManagement.Models;

[Table("SYSTEM_SETTING")]
public partial class SystemSetting
{
    [Key]
    [Column("SETTING_ID")]
    public int SettingId { get; set; }

    [Column("SETTING_KEY")]
    [Required]
    [StringLength(100)]
    public string SettingKey { get; set; } = null!;

    [Column("SETTING_VALUE")]
    [Required]
    public string SettingValue { get; set; } = null!;

    [Column("DESCRIPTION")]
    [StringLength(255)]
    public string? Description { get; set; }

    [Column("UPDATE_AT")]
    public DateTime? UpdatedAt { get; set; }
}
=======
﻿using System;

namespace ParkingManagement.Models
{
    public class SystemSetting
    {
        public int SettingId { get; set; }
        public string SettingKey { get; set; } = string.Empty;
        public string SettingValue { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
>>>>>>> origin/main
