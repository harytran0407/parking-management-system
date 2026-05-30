using ParkingManagement.DTOs;
using ParkingManagement.Models;
using ParkingManagement.Repositories;

namespace ParkingManagement.Services.BuildingServices;

public interface ISlotManagementService
{
    Task<BulkCreateSlotsResponse> BulkCreateSlotsAsync(BulkCreateSlotsRequest request);
    Task<EditSlotResponse> EditSlotAsync(string slotId, EditSlotRequest request);
    Task DeleteSlotAsync(string slotId);
}

public class SlotManagementService : ISlotManagementService
{
    private readonly ISlotManagementRepository _repo;

    public SlotManagementService(ISlotManagementRepository repo)
    {
        _repo = repo;
    }

    // ── POST: Tạo X slot cho tầng Y ───────────────────────────────────────────

    public async Task<BulkCreateSlotsResponse> BulkCreateSlotsAsync(BulkCreateSlotsRequest request)
    {
        var zone = await _repo.GetZoneWithTypeAsync(request.ZoneId)
            ?? throw new KeyNotFoundException($"Zone {request.ZoneId} not found");

        // Đếm slot hiện có để generate tên tiếp theo
        int existingCount = await _repo.CountSlotsInZoneAsync(request.ZoneId);

        var newSlots = new List<ParkingSlot>();
        var createdItems = new List<SlotCreatedItem>();

        for (int i = 1; i <= request.Count; i++)
        {
            int slotNumber = existingCount + i;
            string zoneLetter = zone.ZoneName.Length > 5 ? zone.ZoneName[5].ToString() : "X";

            // SlotId: "A101", "A102"... — ZoneLetter + FloorNumber + SlotNumber(2 digits)
            string slotId = $"{zoneLetter}{zone.FloorNumber}{slotNumber:D2}";
            string slotName = slotId;

            // Tránh trùng SlotId nếu đã tồn tại
            int suffix = 0;
            string candidateId = slotId;
            while (await _repo.SlotIdExistsAsync(candidateId))
            {
                suffix++;
                candidateId = $"{slotId}_{suffix}";
            }
            slotId = candidateId;
            slotName = candidateId;

            var slot = new ParkingSlot
            {
                SlotId = slotId,
                SlotName = slotName,
                Status = "AVAILABLE",
                IsHandicap = false,
                IsElectricCharging = false,
                ZoneId = request.ZoneId,
                LastUpdated = DateTime.UtcNow
            };

            newSlots.Add(slot);
            createdItems.Add(new SlotCreatedItem { SlotId = slotId, SlotName = slotName });
        }

        await _repo.AddSlotsAsync(newSlots);

        return new BulkCreateSlotsResponse
        {
            ZoneId = zone.ZoneId,
            ZoneName = zone.ZoneName,
            FloorNumber = zone.FloorNumber,
            VehicleTypeName = zone.VehicleType.VehicleTypeName,
            SlotsCreated = newSlots.Count,
            Slots = createdItems
        };
    }

    // ── PUT: Edit slot (is_handicap, is_electric_charging, clear session) ─────

    public async Task<EditSlotResponse> EditSlotAsync(string slotId, EditSlotRequest request)
    {
        var slot = await _repo.GetSlotByIdAsync(slotId)
            ?? throw new KeyNotFoundException($"Slot '{slotId}' not found");

        bool sessionCleared = false;

        // Nếu yêu cầu xóa session hiện tại
        if (request.ClearSession && !string.IsNullOrEmpty(slot.CurrentSessionId))
        {
            var session = await _repo.GetActiveSessionBySlotAsync(slotId);
            if (session != null)
            {
                // Cancel session và reset slot về AVAILABLE
                session.Status = "CANCELLED";
                session.CheckOutTime = DateTime.UtcNow;
                await _repo.UpdateSessionAsync(session);
            }

            slot.CurrentSessionId = null;
            slot.Status = "AVAILABLE";
            slot.LastUpdated = DateTime.UtcNow;
            sessionCleared = true;
        }

        // Update các field khác nếu được truyền vào
        if (request.IsHandicap.HasValue)
            slot.IsHandicap = request.IsHandicap.Value;

        if (request.IsElectricCharging.HasValue)
            slot.IsElectricCharging = request.IsElectricCharging.Value;

        slot.LastUpdated = DateTime.UtcNow;
        await _repo.UpdateSlotAsync(slot);

        return new EditSlotResponse
        {
            SlotId = slot.SlotId,
            SlotName = slot.SlotName,
            Status = slot.Status,
            IsHandicap = slot.IsHandicap,
            IsElectricCharging = slot.IsElectricCharging,
            CurrentSessionId = slot.CurrentSessionId,
            LastUpdated = slot.LastUpdated,
            SessionCleared = sessionCleared
        };
    }

    // ── DELETE: Không cho xóa nếu slot đang có xe ────────────────────────────

    public async Task DeleteSlotAsync(string slotId)
    {
        var slot = await _repo.GetSlotByIdAsync(slotId)
            ?? throw new KeyNotFoundException($"Slot '{slotId}' not found");

        if (slot.Status != "AVAILABLE")
            throw new InvalidOperationException(
                $"Cannot delete slot '{slotId}': current status is '{slot.Status}'. Only AVAILABLE slots can be deleted.");

        await _repo.DeleteSlotAsync(slot);
    }
}
