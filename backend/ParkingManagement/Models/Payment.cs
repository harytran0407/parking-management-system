using System;
using System.Collections.Generic;

namespace ParkingManagement.Models;

public partial class Payment
{
    public string PaymentId { get; set; } = null!;

    public string PaymentType { get; set; } = null!;

    public decimal AmountDue { get; set; }

    public decimal AmountPaid { get; set; }

    public decimal? ChangeDue { get; set; }

    public string PaymentMethod { get; set; } = null!;

    public DateTime? PaymentTime { get; set; }

    public string? Status { get; set; }

    public string? TransactionId { get; set; }

    public string? ReceiptUrl { get; set; }

    public string? Remarks { get; set; }

    public string? SessionId { get; set; }

    public string? BookingId { get; set; }

    public string? UserId { get; set; }

    public virtual Booking? Booking { get; set; }

    public virtual ICollection<IncidentLog> IncidentLogs { get; set; } = new List<IncidentLog>();


    public virtual ParkingSession? Session { get; set; }

    public virtual User? User { get; set; }
}
