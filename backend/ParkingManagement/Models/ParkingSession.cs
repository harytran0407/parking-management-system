<<<<<<< HEAD
using System;
=======
﻿using System;
>>>>>>> origin/main
using System.Collections.Generic;

namespace ParkingManagement.Models;

public partial class ParkingSession
{
    public string SessionId { get; set; } = null!;

    public DateTime? CheckInTime { get; set; }

    public DateTime? CheckOutTime { get; set; }

    public int? DurationMinutes { get; set; }

    public string LicensePlateIn { get; set; } = null!;

    public string? ImageUrlIn { get; set; }

    public string? CameraIn { get; set; }

    public string? GateIn { get; set; }

    public string? StaffInId { get; set; }

    public string? LicensePlateOut { get; set; }

    public string? ImageUrlOut { get; set; }

    public string? GateOut { get; set; }

    public string? CameraOut { get; set; }

    public string? StaffOutId { get; set; }

    public decimal? TotalFee { get; set; }

    public string? Status { get; set; }

    public string? PaymentStatus { get; set; }

<<<<<<< HEAD
    public bool? IsLocked { get; set; }

    public int VehicleTypeId { get; set; }

    /// <summary>Zone nơi xe được đỗ (cơ chế mới thay thế SlotId trong luồng chính).</summary>
    public int? ZoneId { get; set; }

    /// <summary>Giữ lại để tương thích ngược với dữ liệu cũ.</summary>
    public string? SlotId { get; set; }

=======
    public int VehicleTypeId { get; set; }

    public string? SlotId { get; set; }

    public int? VehicleId { get; set; }

>>>>>>> origin/main
    public string? BookingId { get; set; }

    public string? TicketCode { get; set; }

    public virtual Booking? Booking { get; set; }

    public virtual ICollection<IncidentLog> IncidentLogs { get; set; } = new List<IncidentLog>();

    public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();

<<<<<<< HEAD
    public virtual FloorZone? Zone { get; set; }

=======
>>>>>>> origin/main
    public virtual ParkingSlot? Slot { get; set; }

    public virtual User? StaffIn { get; set; }

    public virtual User? StaffOut { get; set; }

<<<<<<< HEAD
    public virtual VehicleType VehicleType { get; set; } = null!;
=======
    public virtual Vehicle? Vehicle { get; set; }

    public virtual VehicleType VehicleType { get; set; } = null!;


>>>>>>> origin/main
}
