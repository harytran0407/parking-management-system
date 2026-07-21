using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ParkingManagement.Data;
using ParkingManagement.Models;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace ParkingManagement.Controllers
{
    [ApiController]
    [Route("api/v1/manager/incidents")]
    [Authorize(Roles = "ParkingManager")]
    public class IncidentManagerController : ControllerBase
    {
        private readonly AppDbContext _context;

        public IncidentManagerController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/v1/manager/incidents
        [HttpGet]
        public async Task<IActionResult> GetIncidents([FromQuery] string? status, [FromQuery] string? search)
        {
            var query = _context.IncidentLogs
                .Include(i => i.ReportedByNavigation)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(i => i.Status == status);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                string lowerSearch = search.ToLower();
                query = query.Where(i => (i.Description != null && i.Description.ToLower().Contains(lowerSearch)) ||
                                         i.IssueType.ToLower().Contains(lowerSearch) ||
                                         (i.ReportedByNavigation != null && i.ReportedByNavigation.FullName != null && i.ReportedByNavigation.FullName.ToLower().Contains(lowerSearch)));
            }

            var logs = await query
                .OrderByDescending(i => i.ReportTime)
                .Select(i => new
                {
                    log_id = i.LogId,
                    session_id = i.SessionId,
                    reported_by = i.ReportedBy,
                    reporter_name = i.ReportedByNavigation != null ? (i.ReportedByNavigation.FullName ?? i.ReportedByNavigation.Username) : i.ReportedBy,
                    reporter_avatar = i.ReportedByNavigation != null ? i.ReportedByNavigation.AvatarUrl : null,
                    issue_type = i.IssueType,
                    description = i.Description,
                    report_time = i.ReportTime,
                    status = i.Status,
                    customer_phone = i.CustomerPhone,
                    customer_email = i.CustomerEmail,
                    payment_id = i.PaymentId,
                    resolved_by = i.ResolvedBy,
                    resolved_at = i.ResolvedAt,
                    license_plate_in = i.Session != null ? i.Session.LicensePlateIn : null,
                    license_plate_out = i.Session != null ? i.Session.LicensePlateOut : null,
                    image_url_in = i.Session != null ? i.Session.ImageUrlIn : null,
                    image_url_out = i.Session != null ? i.Session.ImageUrlOut : null,
                    total_fee = i.Session != null ? i.Session.TotalFee : null,
                    check_in_time = i.Session != null ? i.Session.CheckInTime : null,
                    check_out_time = i.Session != null ? i.Session.CheckOutTime : null,
                    duration_minutes = i.Session != null ? i.Session.DurationMinutes : null,
                    slot_name = i.Session != null && i.Session.Slot != null ? i.Session.Slot.SlotName : (i.Session != null ? i.Session.SlotId : null),
                    zone_name = i.Session != null && i.Session.Zone != null ? i.Session.Zone.ZoneName : null
                })
                .ToListAsync();

            return Ok(new
            {
                success = true,
                data = logs
            });
        }
    }
}
