using ParkingManagement.DTOs.Building;
using ParkingManagement.Repositories;

namespace ParkingManagement.Services.BuildingServices;

public interface IDashboardService
{
    Task<DashboardReportResponse> GetReportAsync(DashboardFilterRequest filter);
    Task<byte[]> ExportCsvAsync(DashboardFilterRequest filter);
}

public class DashboardService : IDashboardService
{
    private readonly IDashboardRepository _repo;
    private const string BuildingId = "B001";

    public DashboardService(IDashboardRepository repo)
    {
        _repo = repo;
    }

    public async Task<DashboardReportResponse> GetReportAsync(DashboardFilterRequest filter)
    {
        var (from, to) = GetDateRange(filter);

        // Vehicle count
        int checkIns = await _repo.CountCheckInsAsync(from, to);
        int checkOuts = await _repo.CountCheckOutsAsync(from, to);
        int currentParked = await _repo.CountCurrentlyParkedAsync();

        // Revenue
        decimal totalRevenue = await _repo.GetTotalRevenueAsync(from, to);
        var revenueByMethod = await _repo.GetRevenueByPaymentMethodAsync(from, to);

        // Occupancy
        int totalSlots = await _repo.GetTotalSlotsAsync(BuildingId);
        int occupiedSlots = await _repo.GetOccupiedSlotsAsync(BuildingId);
        double rate = totalSlots > 0
            ? Math.Round((double)occupiedSlots / totalSlots * 100, 1)
            : 0;

        // Peak hours
        var peakHoursRaw = await _repo.GetPeakHoursAsync(from, to);
        var peakHours = peakHoursRaw
            .Select(x => new PeakHourDto { Hour = x.Hour, CheckIns = x.Count })
            .ToList();

        // AC3: Breakdown by vehicle type
        var vehicleTypes = await _repo.GetAllVehicleTypesAsync();
        var breakdown = new List<VehicleTypeBreakdownDto>();
        foreach (var vt in vehicleTypes)
        {
            breakdown.Add(new VehicleTypeBreakdownDto
            {
                VehicleTypeId = vt.VehicleTypeId,
                VehicleTypeName = vt.VehicleTypeName,
                CheckIns = await _repo.CountCheckInsByTypeAsync(vt.VehicleTypeId, from, to),
                Revenue = await _repo.GetRevenueByTypeAsync(vt.VehicleTypeId, from, to)
            });
        }

        return new DashboardReportResponse
        {
            Period = filter.Period,
            From = from.ToString("yyyy-MM-dd"),
            To = to.ToString("yyyy-MM-dd"),
            VehicleCount = new VehicleCountDto
            {
                TotalCheckIns = checkIns,
                TotalCheckOuts = checkOuts,
                CurrentlyParked = currentParked
            },
            Revenue = new RevenueDto
            {
                Total = totalRevenue,
                ByPaymentMethod = revenueByMethod
            },
            Occupancy = new OccupancyReportDto
            {
                TotalSlots = totalSlots,
                OccupiedSlots = occupiedSlots,
                OccupancyRatePercent = rate
            },
            PeakHours = peakHours,
            BreakdownByVehicleType = breakdown
        };
    }

    // AC4: Export CSV
    public async Task<byte[]> ExportCsvAsync(DashboardFilterRequest filter)
    {
        var report = await GetReportAsync(filter);

        var lines = new List<string>
        {
            // Header
            $"Report Period,{report.From} to {report.To}",
            "",
            "=== VEHICLE COUNT ===",
            "Total Check-ins,Total Check-outs,Currently Parked",
            $"{report.VehicleCount.TotalCheckIns},{report.VehicleCount.TotalCheckOuts},{report.VehicleCount.CurrentlyParked}",
            "",
            "=== REVENUE ===",
            $"Total Revenue,{report.Revenue.Total}",
        };

        foreach (var kv in report.Revenue.ByPaymentMethod)
            lines.Add($"{kv.Key},{kv.Value}");

        lines.Add("");
        lines.Add("=== OCCUPANCY ===");
        lines.Add("Total Slots,Occupied,Occupancy Rate");
        lines.Add($"{report.Occupancy.TotalSlots},{report.Occupancy.OccupiedSlots},{report.Occupancy.OccupancyRatePercent}%");

        lines.Add("");
        lines.Add("=== BREAKDOWN BY VEHICLE TYPE ===");
        lines.Add("Vehicle Type,Check-ins,Revenue");
        foreach (var b in report.BreakdownByVehicleType)
            lines.Add($"{b.VehicleTypeName},{b.CheckIns},{b.Revenue}");

        lines.Add("");
        lines.Add("=== PEAK HOURS (Top 5) ===");
        lines.Add("Hour,Check-ins");
        foreach (var p in report.PeakHours.OrderByDescending(x => x.CheckIns))
            lines.Add($"{p.Hour:D2}:00,{p.CheckIns}");

        return System.Text.Encoding.UTF8.GetBytes(string.Join("\n", lines));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static (DateTime from, DateTime to) GetDateRange(DashboardFilterRequest filter)
    {
        var today = DateTime.Today;

        return filter.Period.ToLower() switch
        {
            "day" => (today, today.AddDays(1).AddSeconds(-1)),
            "week" => (today.AddDays(-(int)today.DayOfWeek), today.AddDays(7 - (int)today.DayOfWeek).AddSeconds(-1)),
            "month" => (new DateTime(today.Year, today.Month, 1), new DateTime(today.Year, today.Month, 1).AddMonths(1).AddSeconds(-1)),
            "custom" => ParseCustomRange(filter),
            _ => (today, today.AddDays(1).AddSeconds(-1))
        };
    }

    private static (DateTime from, DateTime to) ParseCustomRange(DashboardFilterRequest filter)
    {
        if (!DateTime.TryParse(filter.StartDate, out var from))
            throw new ArgumentException("Invalid start_date format (YYYY-MM-DD)");
        if (!DateTime.TryParse(filter.EndDate, out var to))
            throw new ArgumentException("Invalid end_date format (YYYY-MM-DD)");
        if (from > to)
            throw new ArgumentException("start_date must be before end_date");

        return (from, to.AddDays(1).AddSeconds(-1));
    }
}
