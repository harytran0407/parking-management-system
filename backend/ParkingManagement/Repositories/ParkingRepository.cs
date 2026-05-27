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
            // Kiểm tra sự tồn tại của phiên đỗ xe đang hoạt động
            return await _context.ParkingSessions
                .AnyAsync(s => s.LicensePlateIn == licensePlate && s.Status == "ACTIVE");
        }

        public async Task<dynamic?> FindFirstAvailableSlotAsync(int vehicleTypeId)
        {
            // LINQ Join giữa ParkingSlots và FloorZone để tìm ô trống phù hợp loại xe
            var query = from slot in _context.ParkingSlots
                        join zone in _context.Set<FloorZone>() on slot.ZoneId equals zone.ZoneId
                        where slot.Status == "AVAILABLE" && zone.VehicleTypeId == vehicleTypeId && zone.Status == "ACTIVE"
                        orderby zone.FloorNumber ascending, slot.SlotName ascending
                        select new
                        {
                            SlotId = slot.SlotId,
                            SlotName = slot.SlotName,
                            FloorNumber = zone.FloorNumber,
                            ZoneName = zone.ZoneName
                        };

            return await query.FirstOrDefaultAsync();
        }

        public async Task CreateSessionAsync(ParkingSession session)
        {
            // Thêm phiên mới vào bộ nhớ đệm theo dõi (Tracking) của EF
            await _context.ParkingSessions.AddAsync(session);
        }

        public async Task<ParkingSlot?> GetSlotByIdAsync(string slotId)
        {
            // Tìm kiếm ô đỗ theo ID (Ưu tiên kiểm tra trong Cache trước)
            return await _context.ParkingSlots.FindAsync(slotId);
        }

        public async Task SaveChangesWithTransactionAsync(Func<Task> action)
        {
            // Thực thi chuỗi hành động đồng bộ bọc trong một DB Transaction
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
            // Lấy phiên hoạt động theo biển số xe kèm thông tin Slot và Zone liên kết
            return await _context.ParkingSessions
                .Include(s => s.Slot)
                    .ThenInclude(sl => sl!.Zone)
                .FirstOrDefaultAsync(s => s.LicensePlateIn == licensePlate && s.Status == "ACTIVE");
        }

        public async Task<PricingPolicy?> GetActivePricingPolicyAsync()
        {
            // Lấy chính sách giá có hiệu lực gần nhất so với ngày hiện tại
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            return await _context.PricingPolicies
                .Where(p => p.EffectiveDate <= today)
                .OrderByDescending(p => p.EffectiveDate)
                .FirstOrDefaultAsync();
        }

        public async Task<bool> UpdateSessionAndSlotAsync(ParkingSession session, string slotId)
        {
            // Cập nhật kết thúc phiên và giải phóng trạng thái ô đỗ về Available
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
            // Lấy phiên hoạt động theo SessionId kèm thông tin Slot và Zone liên kết
            return await _context.ParkingSessions
                .Include(s => s.Slot)
                    .ThenInclude(sl => sl!.Zone)
                .FirstOrDefaultAsync(s => s.SessionId == sessionId && s.Status == "ACTIVE");
        }
    }
}