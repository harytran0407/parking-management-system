using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ParkingManagement.Models
{
    [Table("USER_BAN_LOG")]
    public class UserBanLog
    {
        [Key]
        [Column("LOG_ID")]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int LogId { get; set; }

        [Required]
        [Column("TARGET_USER_ID")]
        [StringLength(36)]
        public string TargetUserId { get; set; }

        [Required]
        [Column("ACTION")]
        [StringLength(20)]
        public string Action { get; set; }

        [Required]
        [Column("REASON", TypeName = "TEXT")]
        public string Reason { get; set; }

        [Required]
        [Column("ACTION_BY")]
        [StringLength(36)]
        public string ActionBy { get; set; }

        [Column("CREATED_AT")]
        public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("TargetUserId")]
        public virtual User TargetUser { get; set; }

        [ForeignKey("ActionBy")]
        public virtual User ActionByUser { get; set; }
    }
}
