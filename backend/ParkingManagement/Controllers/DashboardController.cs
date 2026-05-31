using Microsoft.AspNetCore.Mvc;
using ParkingManagement.DTOs.Building;
using ParkingManagement.Services.BuildingServices;

namespace ParkingManagement.Controllers;

[ApiController]
[Route("api/v1/admin/dashboard")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _service;

    public DashboardController(IDashboardService service)
    {
        _service = service;
    }

    // GET /api/v1/admin/dashboard?period=day
    // AC1: charts data — vehicle count, revenue, occupancy
    // AC2: filter by day/week/month/custom
    // AC3: breakdown by vehicle type
    // [Authorize(Roles = "ParkingManager")]
    [HttpGet]
    [ProducesResponseType(typeof(DashboardReportResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetReport([FromQuery] DashboardFilterRequest filter)
    {
        var data = await _service.GetReportAsync(filter);
        return Ok(new { success = true, data });
    }

    // GET /api/v1/admin/dashboard/export?period=month&format=csv
    // AC4: Export CSV or PDF
    // [Authorize(Roles = "ParkingManager")]
    [HttpGet("export")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Export([FromQuery] DashboardFilterRequest filter, [FromQuery] string format = "csv")
    {
        if (format.ToLower() == "pdf")
            return BadRequest(new { success = false, message = "PDF export is not yet supported. Use format=csv." });

        var csvBytes = await _service.ExportCsvAsync(filter);
        string fileName = $"dashboard_report_{filter.Period}_{DateTime.Today:yyyyMMdd}.csv";

        return File(csvBytes, "text/csv", fileName);
    }
}
