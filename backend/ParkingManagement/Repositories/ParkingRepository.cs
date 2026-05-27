using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ParkingManagement.Data;
using ParkingManagement.Models;

namespace ParkingManagement.Repositories
{
    /// <summary>
    /// Thực thi các truy vấn dữ liệu thực tế bằng Entity Framework Core.
    /// </summary>
    public class ParkingRepository : IParkingRepository
    {
        private readonly AppDbContext _context;

        public ParkingRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<bool> IsVehicleActiveInParkingAsync(string licensePlate)
        {
            return await _context.ParkingSessions
                .AnyAsync(s => s.LicensePlateIn == licensePlate && s.Status == "ACTIVE");
        }

        /// <summary>
        /// SỬA ĐỔI: Đổi kiểu trả về từ dynamic? sang ParkingSlot? để khớp Interface
        /// </summary>
        public async Task<ParkingSlot?> FindFirstAvailableSlotAsync(int vehicleTypeId)
        {
            // Truy vấn trực tiếp thực thể ParkingSlot và nạp kèm (Include) FloorZone để lọc loại xe
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
            await _context.ParkingSessions.AddAsync(session);
        }

        public async Task<ParkingSlot?> GetSlotByIdAsync(string slotId)
        {
            return await _context.ParkingSlots
                .Include(s => s.Zone)
                .FirstOrDefaultAsync(s => s.SlotId == slotId);
        }

        public async Task SaveChangesWithTransactionAsync(Func<Task> action)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                await action();
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<ParkingSession?> GetActiveSessionByPlateAsync(string licensePlate)
        {
            return await _context.ParkingSessions
                .Include(s => s.Slot)
                    .ThenInclude(sl => sl!.Zone)
                .FirstOrDefaultAsync(s => s.LicensePlateIn == licensePlate && s.Status == "ACTIVE");
        }

        public async Task<PricingPolicy?> GetActivePricingPolicyAsync()
        {
            var today = DateOnly.FromDateTime(DateTime.Now);
            return await _context.PricingPolicies
                .Where(p => p.EffectiveDate <= today)
                .OrderByDescending(p => p.EffectiveDate)
                .FirstOrDefaultAsync();
        }

        public async Task<bool> UpdateSessionAndSlotAsync(ParkingSession session, string slotId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                _context.ParkingSessions.Update(session);

                var slot = await _context.ParkingSlots.FindAsync(slotId);
                if (slot != null)
                {
                    slot.Status = "Available";
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
            return await _context.ParkingSessions
                .Include(s => s.Slot)
                    .ThenInclude(sl => sl!.Zone)
                .FirstOrDefaultAsync(s => s.SessionId == sessionId && s.Status == "ACTIVE");
        }

        public async Task<bool> UpdateSlotStatusWithLogAsync(string slotId, string status, string staffId, string reason, int estimatedDuration)
        {
            var slot = await _context.ParkingSlots.FindAsync(slotId);
            if (slot == null) return false;

            slot.Status = status.ToUpper();
            slot.LastUpdated = DateTime.Now;

            var statusLog = new SlotStatusLog
            {
                LogId = "log_" + Guid.NewGuid().ToString("N").Substring(0, 10),
                SlotId = slotId,
                NewStatus = status.ToUpper(),
                ChangedByStaffId = staffId,
                ChangedAt = DateTime.Now,
                Reason = reason,
                EstimatedDurationMinutes = estimatedDuration
            };

            await _context.SlotStatusLogs.AddAsync(statusLog);
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task UpdateSessionAsync(ParkingSession session)
        {
            _context.ParkingSessions.Update(session);
            await Task.CompletedTask; // Đảm bảo đúng chuẩn async
        }

        public async Task UpdateSlotAsync(ParkingSlot slot)
        {
            // Nếu Service muốn đổi trạng thái sang OCCUPIED (khi xe vào bãi)
            if (slot.Status.ToUpper() == "OCCUPIED")
            {
                // Truy vấn thực thể gốc trực tiếp từ DB trong phạm vi context hiện tại
                var dbSlot = await _context.ParkingSlots.FindAsync(slot.SlotId);

                if (dbSlot == null)
                    throw new KeyNotFoundException("Slot không tồn tại.");

                // Kiểm tra ATOMIC: Nếu lúc này trạng thái trong DB đã bị thằng khác đổi thành OCCUPIED hoặc MAINTENANCE
                if (dbSlot.Status.ToUpper() != "AVAILABLE")
                {
                    throw new InvalidOperationException("Race Condition Detected: Ô đỗ xe vừa bị chiếm dụng bởi một xe khác!");
                }

                // Nếu vẫn trống, cập nhật dữ liệu mới
                dbSlot.Status = "OCCUPIED";
                dbSlot.LastUpdated = DateTime.Now;
            }
            else
            {
                // Các trường hợp cập nhật thông thường khác
                _context.ParkingSlots.Update(slot);
            }

            await _context.SaveChangesAsync();
        }

        /// <summary>
        /// BỔ SUNG: Triển khai hàm bị thiếu để giải quyết triệt để lỗi build CS0535
        /// </summary>
        public async Task<PricingPolicy?> GetActivePricingPolicyByVehicleTypeAsync(int vehicleTypeId)
        {
            var today = DateOnly.FromDateTime(DateTime.Now);

            return await _context.PricingPolicies
                .Where(p => p.VehicleTypeId == vehicleTypeId
                            && p.EffectiveDate <= today)
                .OrderByDescending(p => p.EffectiveDate)
                .FirstOrDefaultAsync();
        }
    }
}