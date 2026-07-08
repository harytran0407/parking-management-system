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
            var zoneName = z.ZoneName;
            int hyphenIndex = zoneName.IndexOf(" - ");
            if (hyphenIndex >= 0)
            {
                zoneName = zoneName.Substring(0, hyphenIndex);
            }

            result.Add(new FloorZoneResponse
            {
                ZoneId = z.ZoneId,
                ZoneName = zoneName,
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

        if (await _repo.FloorNumberExistsAsync(buildingId, request.FloorNumber, request.ZoneName))
            throw new InvalidOperationException($"Floor {request.FloorNumber} with zone name '{request.ZoneName}' already exists in this building");

        var zone = new FloorZone
        {
            ZoneName = request.ZoneName,
            FloorNumber = request.FloorNumber,
            Capacity = request.Capacity,
            AvailableCapacity = request.Capacity,
            Status = "ACTIVE",
            VehicleTypeId = request.VehicleTypeId,
            BuildingId = buildingId
        };

        var created = await _repo.CreateAsync(zone);
        await _repo.SyncZoneSlotsAsync(created.ZoneId, created.Capacity);

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

        if (request.Capacity.HasValue)
        {
            if (request.Capacity.Value < activeVehicles)
            {
                throw new InvalidOperationException(
                    $"Cannot set capacity to {request.Capacity.Value} because there are {activeVehicles} active vehicle(s) currently parked in this zone.");
            }
            int capacityDelta = request.Capacity.Value - zone.Capacity;
            zone.AvailableCapacity = Math.Max(0, zone.AvailableCapacity + capacityDelta);
            zone.Capacity = request.Capacity.Value;
            await _repo.SyncZoneSlotsAsync(zone.ZoneId, zone.Capacity);
        }

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
        
        if (await _repo.HasActiveBookingsAsync(zoneId))
            throw new InvalidOperationException(
                "Cannot delete: there are pending or confirmed bookings associated with this zone.");

        await _repo.DeleteZoneAsync(eneity);

    }

}
