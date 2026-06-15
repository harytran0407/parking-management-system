using System;
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

    public int VehicleTypeId { get; set; }

    public string? SlotId { get; set; }

    public int? VehicleId { get; set; }

    public string? BookingId { get; set; }

    public string? TicketCode { get; set; }

    public virtual Booking? Booking { get; set; }

    public virtual ICollection<IncidentLog> IncidentLogs { get; set; } = new List<IncidentLog>();

    public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();

    public virtual ParkingSlot? Slot { get; set; }

    public virtual User? StaffIn { get; set; }

    public virtual User? StaffOut { get; set; }

    public virtual Vehicle? Vehicle { get; set; }

    public virtual VehicleType VehicleType { get; set; } = null!;
}
