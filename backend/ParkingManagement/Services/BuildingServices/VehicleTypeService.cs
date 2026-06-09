using ParkingManagement.Models;
using ParkingManagement.Repositories;

using ParkingManagement.DTOs.Building;
namespace ParkingManagement.Services.BuildingServices;

public interface IVehicleTypeService
{
    Task<List<VehicleTypeResponse>> GetAllAsync();
    Task<VehicleTypeResponse> GetByIdAsync(int id);
    Task<VehicleTypeResponse> CreateAsync(CreateVehicleTypeRequest request);
    Task<VehicleTypeResponse> UpdateAsync(int id, UpdateVehicleTypeRequest request);
    Task<DeleteVehicleTypePreview> GetDeletePreviewAsync(int id);
    Task DeleteAsync(int id);
}

public class VehicleTypeService : IVehicleTypeService
{
    private readonly IVehicleTypeRepository _repo;

    public VehicleTypeService(IVehicleTypeRepository repo)
    {
        _repo = repo;
    }

    // ── GET ALL ───────────────────────────────────────────────────────────────

    public async Task<List<VehicleTypeResponse>> GetAllAsync()
    {
        var types = await _repo.GetAllAsync();
        var result = new List<VehicleTypeResponse>();

        foreach (var t in types)
        {
            result.Add(new VehicleTypeResponse
            {
                VehicleTypeId = t.VehicleTypeId,
                VehicleTypeName = t.VehicleTypeName,
                RelatedSlotsCount = await _repo.CountRelatedSlotsAsync(t.VehicleTypeId),
                ActiveSessionsCount = await _repo.CountActiveSessionsAsync(t.VehicleTypeId)
            });
        }

        return result;
    }

    // ── GET BY ID ─────────────────────────────────────────────────────────────

    public async Task<VehicleTypeResponse> GetByIdAsync(int id)
    {
        var t = await _repo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Vehicle type {id} not found");

        return new VehicleTypeResponse
        {
            VehicleTypeId = t.VehicleTypeId,
            VehicleTypeName = t.VehicleTypeName,
            RelatedSlotsCount = await _repo.CountRelatedSlotsAsync(id),
            ActiveSessionsCount = await _repo.CountActiveSessionsAsync(id)
        };
    }

    // ── CREATE ────────────────────────────────────────────────────────────────

    public async Task<VehicleTypeResponse> CreateAsync(CreateVehicleTypeRequest request)
    {
        if (await _repo.ExistsByNameAsync(request.VehicleTypeName))
            throw new InvalidOperationException($"Vehicle type '{request.VehicleTypeName}' already exists");

        var entity = new VehicleType { VehicleTypeName = request.VehicleTypeName.Trim() };
        var created = await _repo.CreateAsync(entity);

        return new VehicleTypeResponse
        {
            VehicleTypeId = created.VehicleTypeId,
            VehicleTypeName = created.VehicleTypeName,
            RelatedSlotsCount = 0,
            ActiveSessionsCount = 0
        };
    }

    // ── UPDATE ────────────────────────────────────────────────────────────────

    public async Task<VehicleTypeResponse> UpdateAsync(int id, UpdateVehicleTypeRequest request)
    {
        var entity = await _repo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Vehicle type {id} not found");

        if (await _repo.ExistsByNameAsync(request.VehicleTypeName, excludeId: id))
            throw new InvalidOperationException($"Vehicle type '{request.VehicleTypeName}' already exists");

        entity.VehicleTypeName = request.VehicleTypeName.Trim();
        await _repo.UpdateAsync(entity);

        return new VehicleTypeResponse
        {
            VehicleTypeId = entity.VehicleTypeId,
            VehicleTypeName = entity.VehicleTypeName,
            RelatedSlotsCount = await _repo.CountRelatedSlotsAsync(id),
            ActiveSessionsCount = await _repo.CountActiveSessionsAsync(id)
        };
    }

    // ── DELETE PREVIEW — AC3: show related slots count ────────────────────────

    public async Task<DeleteVehicleTypePreview> GetDeletePreviewAsync(int id)
    {
        var entity = await _repo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Vehicle type {id} not found");

        int slots = await _repo.CountRelatedSlotsAsync(id);
        int sessions = await _repo.CountActiveSessionsAsync(id);
        bool canDelete = slots == 0 && sessions == 0;

        string? reason = null;
        if (!canDelete)
        {
            var parts = new List<string>();
            if (sessions > 0) parts.Add($"{sessions} active session(s)");
            if (slots > 0) parts.Add($"{slots} related slot(s)");
            reason = "Cannot delete: has " + string.Join(" and ", parts);
        }

        return new DeleteVehicleTypePreview
        {
            VehicleTypeId = entity.VehicleTypeId,
            VehicleTypeName = entity.VehicleTypeName,
            RelatedSlotsCount = slots,
            ActiveSessionsCount = sessions,
            CanDelete = canDelete,
            Reason = reason
        };
    }

    // ── DELETE — AC2: block if has active slots or sessions ───────────────────

    public async Task DeleteAsync(int id)
    {
        var entity = await _repo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Vehicle type {id} not found");

        int sessions = await _repo.CountActiveSessionsAsync(id);
        if (sessions > 0)
            throw new InvalidOperationException(
                $"Cannot delete: {sessions} active parking session(s) using this vehicle type");

        int slots = await _repo.CountRelatedSlotsAsync(id);
        if (slots > 0)
            throw new InvalidOperationException(
                $"Cannot delete: {slots} parking slot(s) assigned to this vehicle type");

        await _repo.DeleteAsync(entity);
    }
}
