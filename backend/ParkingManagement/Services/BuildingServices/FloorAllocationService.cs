using ParkingManagement.DTOs.Building;
using ParkingManagement.Models;
using ParkingManagement.Repositories;

namespace ParkingManagement.Services.BuildingServices;

public interface IFloorAllocationService
{
    Task<List<FloorZoneResponse>> GetAllAsync(string buildingId);
    Task<UpdateFloorAllocationResponse> UpdateAllocationAsync(int zoneId, UpdateFloorAllocationRequest request);
    Task<FloorZoneResponse> CreateZoneAsync(string buildingId, CreateFloorZoneRequest request);
    Task DeleteZoneAsync(int zoneId);

}

public class FloorAllocationService : IFloorAllocationService
{
    private readonly IFloorAllocationRepository _repo;

    public FloorAllocationService(IFloorAllocationRepository repo)
    {
        _repo = repo;
    }

    // ── GET ALL — AC1: interface to assign vehicle type per floor ─────────────
    public async Task<List<FloorZoneResponse>> GetAllAsync(string buildingId)
    {
        var zones = await _repo.GetAllByBuildingAsync(buildingId);
        var result = new List<FloorZoneResponse>();

        foreach (var z in zones)
        {
            result.Add(new FloorZoneResponse
            {
                ZoneId = z.ZoneId,
                ZoneName = z.ZoneName,
                FloorNumber = z.FloorNumber,
                Capacity = z.Capacity,
                Status = z.Status,
                VehicleTypeId = z.VehicleTypeId,
                VehicleTypeName = z.VehicleType.VehicleTypeName,
                ActiveVehiclesCount = await _repo.CountActiveVehiclesAsync(z.ZoneId)
            });
        }

        return result;
    }
    // ── CREATE FLOOR 
    public async Task<FloorZoneResponse> CreateZoneAsync(string buildingId, CreateFloorZoneRequest request)
    {
        var vehicleType = await _repo.GetVehicleTypeAsync(request.VehicleTypeId)
            ?? throw new KeyNotFoundException($"Vehicle type {request.VehicleTypeId} not found");

        if (await _repo.FloorNumberExistsAsync(buildingId, request.FloorNumber))
            throw new InvalidOperationException($"Floor {request.FloorNumber} already exists in this building");

        var zone = new FloorZone
        {
            ZoneName = request.ZoneName,
            FloorNumber = request.FloorNumber,
            Capacity = request.Capacity,
            Status = "ACTIVE",
            VehicleTypeId = request.VehicleTypeId,
            BuildingId = buildingId
        };

        var created = await _repo.CreateAsync(zone);

        return new FloorZoneResponse
        {
            ZoneId = created.ZoneId,
            ZoneName = created.ZoneName,
            FloorNumber = created.FloorNumber,
            Capacity = created.Capacity,
            Status = created.Status,
            VehicleTypeId = created.VehicleTypeId,
            VehicleTypeName = vehicleType.VehicleTypeName,
            ActiveVehiclesCount = 0
        };
    }

    // ── PUT — AC1: assign vehicle type, AC2: warning, AC3: save time ──────────

    public async Task<UpdateFloorAllocationResponse> UpdateAllocationAsync(
    int zoneId, UpdateFloorAllocationRequest request)
    {
        var zone = await _repo.GetByIdAsync(zoneId)
            ?? throw new KeyNotFoundException($"Zone {zoneId} not found");

        var vehicleType = await _repo.GetVehicleTypeAsync(request.VehicleTypeId)
            ?? throw new KeyNotFoundException($"Vehicle type {request.VehicleTypeId} not found");

        // AC2: cảnh báo nếu đang có xe
        int activeVehicles = await _repo.CountActiveVehiclesAsync(zoneId);
        string? warning = activeVehicles > 0
            ? $"Warning: {activeVehicles} active vehicle(s) in this zone. Changes take effect from save time."
            : null;

        // Dọn dẹp hậu tố " - {loại xe}" cũ nếu có để đưa tên phân khu về dạng thuần túy
        int hyphenIndex = zone.ZoneName.IndexOf(" - ");
        if (hyphenIndex >= 0)
        {
            zone.ZoneName = zone.ZoneName.Substring(0, hyphenIndex);
        }
        zone.VehicleTypeId = request.VehicleTypeId;

        if (request.Capacity.HasValue && request.Capacity>=0)
            zone.Capacity = request.Capacity.Value;

        if (!string.IsNullOrEmpty(request.Status))
            zone.Status = request.Status;

        await _repo.UpdateAsync(zone);

        return new UpdateFloorAllocationResponse
        {
            ZoneId = zone.ZoneId,
            ZoneName = zone.ZoneName,
            FloorNumber = zone.FloorNumber,
            VehicleTypeId = zone.VehicleTypeId,
            VehicleTypeName = vehicleType.VehicleTypeName,
            UpdatedAt = DateTime.UtcNow,
            Warning = warning
        };

    }
    public async Task DeleteZoneAsync(int zoneId)
    {
        var eneity=await _repo.GetByIdAsync(zoneId)
            ?? throw new KeyNotFoundException($"Zone {zoneId} not found");
        var activeVehicles = await _repo.CountActiveVehiclesAsync(zoneId);
        if (activeVehicles > 0)
            throw new InvalidOperationException(
                $"Cannot delete: {activeVehicles} active parking session(s) using this vehicle type");
        await _repo.DeleteZoneAsync(eneity);

    }

}
