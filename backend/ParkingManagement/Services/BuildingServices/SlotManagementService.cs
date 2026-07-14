using ParkingManagement.DTOs;
using ParkingManagement.Models;
using ParkingManagement.Repositories;

namespace ParkingManagement.Services.BuildingServices;

public interface ISlotManagementService
{
    Task<BulkCreateSlotsResponse> BulkCreateSlotsAsync(BulkCreateSlotsRequest request);
    Task<EditSlotResponse> EditSlotAsync(string slotId, EditSlotRequest request);
    Task DeleteSlotAsync(string slotId);
    Task BulkDeleteSlotsAsync(List<string> slotIds);
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
    
        string zoneLetter = "Z";
        if (!string.IsNullOrEmpty(zone.ZoneName))
        {
            string cleanZoneName = zone.ZoneName.Replace("Zone", "", StringComparison.OrdinalIgnoreCase).Trim();
    
            if (!string.IsNullOrEmpty(cleanZoneName))
            {
                zoneLetter = cleanZoneName.Substring(0, 1).ToUpper();
            }
            else
            {
                zoneLetter = zone.ZoneName.Substring(0, 1).ToUpper();
            }
        }
    
        int currentSerialNumber = await _repo.GetMaxSlotNumberAsync(zone.FloorNumber);
    
        var newSlots = new List<ParkingSlot>();
        var createdItems = new List<SlotCreatedItem>();
        int slotsCreatedCount = 0;
    
        while (slotsCreatedCount < request.Count)
        {
            currentSerialNumber++;
    
            // Đệm số thứ tự thành 2 chữ số: 1 -> "01", 12 -> "12"
            string serialPart = currentSerialNumber.ToString("D2");
    
            string candidateId = $"slt_{zone.FloorNumber}{serialPart}";
            string candidateName = $"{zoneLetter}{zone.FloorNumber}{serialPart}";
    
            bool isIdExists = await _repo.SlotIdExistsAsync(candidateId);
            bool isNameExists = await _repo.SlotNameExistsAsync(candidateName);
    
            if (isIdExists || isNameExists)
            {
                continue;
            }
    
            var slot = new ParkingSlot
            {
                SlotId = candidateId,
                SlotName = candidateName,
                Status = "AVAILABLE",
                IsHandicap = false,
                IsElectricCharging = false,
                ZoneId = request.ZoneId,
                LastUpdated = DateTime.UtcNow
            };
    
            newSlots.Add(slot);
            createdItems.Add(new SlotCreatedItem { SlotId = candidateId, SlotName = candidateName });
    
            slotsCreatedCount++;
        }
    
        // Cập nhật sức chứa của Zone
        zone.Capacity += request.Count;
        zone.AvailableCapacity += request.Count;
    
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

        if (request.ClearSession && !string.IsNullOrEmpty(slot.CurrentSessionId))
        {
            var session = await _repo.GetActiveSessionBySlotAsync(slotId);
            if (session != null)
            {
                session.Status = "CANCELLED";
                session.CheckOutTime = DateTime.UtcNow;
                await _repo.UpdateSessionAsync(session);
            }

            slot.CurrentSessionId = null;
            slot.Status = "AVAILABLE";
            slot.LastUpdated = DateTime.UtcNow;
            sessionCleared = true;
        }

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

    public async Task BulkDeleteSlotsAsync(List<string> slotIds)
    {
        if (slotIds == null || slotIds.Count == 0)
            return;

        var slots = new List<ParkingSlot>();
        foreach (var id in slotIds)
        {
            var slot = await _repo.GetSlotByIdAsync(id)
                ?? throw new KeyNotFoundException($"Slot '{id}' not found");

            if (slot.Status != "AVAILABLE")
                throw new InvalidOperationException(
                    $"Cannot delete slot '{id}': current status is '{slot.Status}'. Only AVAILABLE slots can be deleted.");

            slots.Add(slot);
        }

        foreach (var slot in slots)
        {
            await _repo.DeleteSlotAsync(slot);
        }
    }
}