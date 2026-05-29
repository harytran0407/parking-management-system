using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using ParkingManagement.Data;
using ParkingManagement.Models;
using ParkingManagement.DTOs;

namespace ParkingManagement.Repositories
{
    /// <summary>
    /// Thực thi các truy vấn dữ liệu bãi xe bằng Entity Framework Core.
    /// Tuân thủ quy định thiết kế hệ thống PMS, tối ưu hiệu suất chống Race Condition.
    /// </summary>
    public class ParkingRepository : IParkingRepository
    {
        private readonly AppDbContext _context;

        public ParkingRepository(AppDbContext context)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
        }

        public async Task<bool> IsVehicleActiveInParkingAsync(string licensePlate)
        {
            if (string.IsNullOrWhiteSpace(licensePlate)) return false;

            return await _context.ParkingSessions
                .AnyAsync(s => s.LicensePlateIn == licensePlate && s.Status == "ACTIVE");
        }

        // TẠM THỜI
        public async Task<ParkingSlot?> FindFirstAvailableSlotAsync(int vehicleTypeId)
        {
            return await _context.ParkingSlots
                .Include(s => s.Zone)
                .Where(slot => slot.Status == "AVAILABLE"
                               && slot.Zone != null
                               && slot.Zone.VehicleTypeId == vehicleTypeId
                               && slot.Zone.Status == "ACTIVE")
                .OrderBy(slot => slot.Zone!.FloorNumber)
                .ThenBy(slot => slot.SlotName)
                .FirstOrDefaultAsync();
        }

        public async Task CreateSessionAsync(ParkingSession session)
        {
            if (session == null) throw new ArgumentNullException(nameof(session));

            await _context.ParkingSessions.AddAsync(session);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateSessionAsync(ParkingSession session)
        {
            if (session == null) throw new ArgumentNullException(nameof(session));

            _context.ParkingSessions.Update(session);
            await _context.SaveChangesAsync();
        }

        public async Task<ParkingSlot?> GetSlotByIdAsync(string slotId)
        {
            if (string.IsNullOrWhiteSpace(slotId)) return null;

            return await _context.ParkingSlots
                .Include(s => s.Zone)
                .FirstOrDefaultAsync(s => s.SlotId == slotId);
        }

        public async Task SaveChangesWithTransactionAsync(Func<Task> action)
        {
            if (action == null) throw new ArgumentNullException(nameof(action));

            // Sử dụng Isolated Transaction cấp độ cao để đảm bảo an toàn dữ liệu đồng thời
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                await action();

                // Gom tất cả các thay đổi còn lại và Commit toàn cục
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                await transaction.RollbackAsync();
                throw new InvalidOperationException("CONCURRENCY_CONFLICT");
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<ParkingSession?> GetActiveSessionByPlateAsync(string licensePlate)
        {
            if (string.IsNullOrWhiteSpace(licensePlate)) return null;

            return await _context.ParkingSessions
                .Include(s => s.Slot)
                    .ThenInclude(sl => sl!.Zone)
                .FirstOrDefaultAsync(s => s.LicensePlateIn == licensePlate && s.Status == "ACTIVE");
        }

        public async Task<bool> UpdateSessionAndSlotAsync(ParkingSession session, string slotId)
        {
            if (session == null || string.IsNullOrWhiteSpace(slotId)) return false;

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                _context.ParkingSessions.Update(session);

                var slot = await _context.ParkingSlots.FindAsync(slotId);
                if (slot != null)
                {
                    slot.Status = "AVAILABLE";
                    slot.LastUpdated = DateTime.Now;
                    _context.ParkingSlots.Update(slot);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return true;
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<ParkingSession?> GetActiveSessionByIdAsync(string sessionId)
        {
            if (string.IsNullOrWhiteSpace(sessionId)) return null;

            return await _context.ParkingSessions
                .Include(s => s.Slot)
                    .ThenInclude(sl => sl!.Zone)
                .FirstOrDefaultAsync(s => s.SessionId == sessionId && s.Status == "ACTIVE");
        }

        public async Task<bool> UpdateSlotStatusWithLogAsync(string slotId, string status, string staffId, string reason, int estimatedDuration)
        {
            var slot = await _context.ParkingSlots.FindAsync(slotId);
            if (slot == null) return false;

            string oldStatus = slot.Status ?? "UNKNOWN";
            slot.Status = status.ToUpper();
            slot.LastUpdated = DateTime.Now;

            var statusLog = new SlotStatusLog
            {
                LogId = "SLG-" + Guid.NewGuid().ToString("N").Substring(0, 15).ToUpper(),
                SlotId = slotId,
                OldStatus = oldStatus,
                NewStatus = status.ToUpper(),
                ChangedBy = staffId ?? "SYSTEM",
                ChangedAt = DateTime.Now,
                Reason = string.IsNullOrWhiteSpace(reason) ? "No reason provided" : reason,
                EstimatedDurationMinutes = estimatedDuration
            };

            await _context.SlotStatusLogs.AddAsync(statusLog);
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task UpdateSlotAsync(ParkingSlot slot)
        {
            if (slot == null) throw new ArgumentNullException(nameof(slot));


            _context.ParkingSlots.Update(slot);
            await _context.SaveChangesAsync();
        }

        public async Task<PricingPolicy?> GetActivePricingPolicyByVehicleTypeAsync(int vehicleTypeId)
        {
            var today = DateOnly.FromDateTime(DateTime.Today);

            return await _context.PricingPolicies
                .Where(p => p.VehicleTypeId == vehicleTypeId && p.EffectiveDate <= today)
                .OrderByDescending(p => p.EffectiveDate)
                .FirstOrDefaultAsync();
        }

        public async Task<(List<ParkingSlot> Slots, int TotalCount, Dictionary<string, int> StatusCounts)> GetPagedSlotsWithStatusAsync(SlotQueryFilterDto filter)
        {
            // 1. Tạo Query gốc bao gồm cả bảng liên kết Khu Vực (Zone) để lọc tầng và tên khu
            var query = _context.ParkingSlots
                .Include(s => s.Zone)
                // Cần Include thêm ParkingSessions đang Active để lấy Biển số xe (LicensePlate) và Giờ vào (CheckInTime) nếu Slot đang bị chiếm chỗ (OCCUPIED)
                .Include(s => s.ParkingSessions)
                .AsQueryable();

            // 2. Áp dụng các bộ lọc động (Dynamic Filters)
            if (filter.Floor.HasValue)
            {
                query = query.Where(s => s.Zone.FloorNumber == filter.Floor.Value);
            }

            if (!string.IsNullOrWhiteSpace(filter.Zone))
            {
                query = query.Where(s => s.Zone.ZoneName == filter.Zone.Trim());
            }

            if (filter.VehicleTypeId.HasValue)
            {
                query = query.Where(s => s.Zone.VehicleTypeId == filter.VehicleTypeId.Value);
            }

            if (!string.IsNullOrWhiteSpace(filter.Status))
            {
                query = query.Where(s => s.Status == filter.Status.Trim().ToUpper());
            }

            // 3. Tính toán Thống kê Tổng số lượng theo từng Status trước khi Phân trang (Pagination)
            var allFilteredSlots = await query.Select(s => new { s.Status }).ToListAsync();

            var statusCounts = new Dictionary<string, int>
            {
                { "TOTAL", allFilteredSlots.Count },
                { "AVAILABLE", allFilteredSlots.Count(s => s.Status == "AVAILABLE") },
                { "OCCUPIED", allFilteredSlots.Count(s => s.Status == "OCCUPIED") },
                { "RESERVED", allFilteredSlots.Count(s => s.Status == "RESERVED") },
                { "MAINTENANCE", allFilteredSlots.Count(s => s.Status == "MAINTENANCE") }
            };

            int totalCount = allFilteredSlots.Count;

            // 4. Thực hiện Phân trang và sắp xếp mặc định theo Tên ô đỗ
            var pagedSlots = await query
                .OrderBy(s => s.SlotName)
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            return (pagedSlots, totalCount, statusCounts);
        }
    }
}