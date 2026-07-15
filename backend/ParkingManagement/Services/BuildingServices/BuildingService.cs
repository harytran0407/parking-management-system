using ParkingManagement.DTOs.Building;
using ParkingManagement.Repositories;

namespace ParkingManagement.Services.BuildingServices;
public interface IBuildingService
{
    Task<BuildingInfoResponse> GetBuildingInfoAsync(string buildingId);
    Task<UpdateBuildingResponse> UpdateBuildingInfoAsync(string buildingId, UpdateBuildingRequest request);
}

public class BuildingService : IBuildingService
{
    private readonly IBuildingRepository _repo;
    private readonly ILogger<BuildingService> _logger;

    public BuildingService(IBuildingRepository repo, ILogger<BuildingService> logger)
    {
        _repo = repo;
        _logger = logger;
    }

    // ── GET ──────────────────────────────────────────────────────────────────

    public async Task<BuildingInfoResponse> GetBuildingInfoAsync(string buildingId)
    {
        var building = await _repo.GetByIdAsync(buildingId)
            ?? throw new KeyNotFoundException($"Building '{buildingId}' not found");

        var (occupied, available) = await _repo.GetOccupancyAsync(buildingId);
        int total = occupied + available;
        double rate = total > 0 ? Math.Round((double)occupied / total * 100, 1) : 0;

        var vtAvailability = await _repo.GetOccupancyByVehicleTypeAsync(buildingId);

        return new BuildingInfoResponse
        {
            BuildingId = building.BuildingId,
            BuildingName = building.BuildingName,
            Address = building.Address,
            TotalFloors = building.TotalFloors,
            TotalSlots = total,  // Use live computed total from FloorZones (occupied + available)
            Status = building.Status,
            OperationHours = new OperationHoursDto
            {
                WeekdayHours = building.WeekdayHours,
                WeekendHours = building.WeekendHours,
                Is247 = building.Is247 ?? false
            },
            CurrentOccupancy = new OccupancyDto
            {
                TotalOccupied = occupied,
                TotalAvailable = available,
                OccupancyRate = rate
            },
            VehicleTypeAvailability = vtAvailability
        };
    }

    // ── PUT ──────────────────────────────────────────────────────────────────

    public async Task<UpdateBuildingResponse> UpdateBuildingInfoAsync(
        string buildingId, UpdateBuildingRequest request)
    {
        var building = await _repo.GetByIdAsync(buildingId)
            ?? throw new KeyNotFoundException($"Building '{buildingId}' not found");

        building.BuildingName = request.BuildingName.Trim();
        building.Address = request.Address.Trim();
        building.Is247 = request.Is247;

        if (!request.Is247)
        {
            building.WeekdayHours = request.WeekdayHours?.Trim();
            building.WeekendHours = request.WeekendHours?.Trim();
        }
        else
        {
            building.WeekdayHours = null;
            building.WeekendHours = null;
        }

        await _repo.UpdateAsync(building);
        _logger.LogInformation("Building {Id} updated", buildingId);

        return new UpdateBuildingResponse
        {
            BuildingId = building.BuildingId,
            BuildingName = building.BuildingName,
            Address = building.Address,
            WeekdayHours = building.WeekdayHours,
            WeekendHours = building.WeekendHours,
            Is247 = building.Is247 ?? false,
            UpdatedAt = DateTime.UtcNow
        };
    }
}
