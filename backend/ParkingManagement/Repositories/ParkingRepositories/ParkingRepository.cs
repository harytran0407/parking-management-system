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

        public async Task<ParkingSlot?> GetSlotByNameAsync(string slotName)
        {
            if (string.IsNullOrWhiteSpace(slotName)) return null;

            return await _context.ParkingSlots
                .Include(s => s.Zone)
                .FirstOrDefaultAsync(s => s.SlotName.ToUpper() == slotName.Trim().ToUpper());
        }

        public async Task<ParkingSession?> GetActiveSessionBySlotIdAsync(string slotId)
        {
            return await _context.ParkingSessions
                .Include(s => s.Slot)
                    .ThenInclude(sl => sl!.Zone)
                .FirstOrDefaultAsync(s => s.SlotId == slotId && s.Status == "ACTIVE");
        }

        public async Task SaveChangesWithTransactionAsync(Func<Task> action)
        {
            if (action == null) throw new ArgumentNullException(nameof(action));

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                await action();

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

        public async Task<ParkingSession?> GetActiveSessionByTicketCodeAsync(string ticketCode)
        {
            if (string.IsNullOrWhiteSpace(ticketCode)) return null;

            return await _context.ParkingSessions
                .Include(s => s.Slot)
                .ThenInclude(sl => sl!.Zone)
                .FirstOrDefaultAsync(s => s.TicketCode == ticketCode && s.Status == "ACTIVE");
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
            var query = _context.ParkingSlots
                .Include(s => s.Zone)
                .Include(s => s.ParkingSessions)
                .AsQueryable();

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

            var pagedSlots = await query
                .OrderBy(s => s.SlotName)
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            return (pagedSlots, totalCount, statusCounts);
        }

        public async Task<string> GetOperatingHoursForDayAsync(DateTime referenceTime)
        {
            var building = await _context.ParkingBuildings.FindAsync("B001");

            if (building == null) return "06:00-22:00";

            if (building.Is247 == true)
            {
                return "00:00-24:00";
            }

            bool isWeekend = referenceTime.DayOfWeek == DayOfWeek.Saturday || referenceTime.DayOfWeek == DayOfWeek.Sunday;

            return isWeekend
                ? (building.WeekendHours ?? "06:00-22:00")
                : (building.WeekdayHours ?? "06:00-22:00");
        }

        public async Task<(List<ParkingSession> Items, int TotalCount)> GetParkingHistoryAsync(
            string? licensePlate, 
            DateTime? fromDate, 
            DateTime? toDate, 
            string? vehicleType, 
            string? status, 
            int page, 
            int pageSize)
        {
            if (page < 1) page = 1;
            if (pageSize <= 0) pageSize = 15;
        
            var query = _context.ParkingSessions
                .Include(s => s.Slot)
                    .ThenInclude(sl => sl!.Zone)
                .AsQueryable();
        
            if (!string.IsNullOrWhiteSpace(licensePlate))
            {
                var cleanedPlate = licensePlate.Trim();
                query = query.Where(s => s.LicensePlateIn.Contains(cleanedPlate) ||
                                     (s.LicensePlateOut != null && s.LicensePlateOut.Contains(cleanedPlate)));
            }
        
            if (fromDate.HasValue)
            {
                query = query.Where(s => s.CheckInTime >= fromDate.Value);
            }
        
            if (toDate.HasValue)
            {
                var endOfToDate = toDate.Value.Date.AddDays(1).AddTicks(-1);
                query = query.Where(s => s.CheckInTime <= endOfToDate);
            }
        
            if (!string.IsNullOrWhiteSpace(vehicleType) && int.TryParse(vehicleType, out int vehicleTypeId))
            {
                query = query.Where(s => s.VehicleTypeId == vehicleTypeId);
            }
        
            if (!string.IsNullOrWhiteSpace(status))
            {
                string searchStatus = status.Trim().ToUpper();
                
                if (searchStatus == "LOST_TICKET")
                {
                    query = query.Where(s => s.Status != null && s.Status.ToUpper() == "LOST_TICKET");
                }
                else
                {
                    query = query.Where(s => s.Status != null && s.Status.ToUpper() == searchStatus);
                }
            }
        
            int totalCount = await query.CountAsync();
        
            var items = await query
                .OrderByDescending(s => s.CheckOutTime ?? s.CheckInTime)
                .ThenByDescending(s => s.SessionId) 
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        
            return (items, totalCount);
        }

        // Booking Services
        public async Task<Booking?> GetValidBookingByLicensePlateAsync(string licensePlate, DateTime currentTime)
        {
            if (string.IsNullOrWhiteSpace(licensePlate)) return null;
        
            return await _context.Bookings
                .Include(b => b.Slot)
                    .ThenInclude(s => s!.Zone)
                .Include(b => b.Vehicle) // Chắc chắn Include bảng Vehicle để thực hiện so khớp dữ liệu liên kết
                .FirstOrDefaultAsync(b => b.Vehicle != null 
                    && b.Vehicle.VehiclePlateNumber == licensePlate // <-- Đã sửa thành VehiclePlateNumber
                    && b.Status == "CONFIRMED"
                    && b.ExpectedArrival <= currentTime
                    && b.ExpiredAt > currentTime);
        }

        public async Task<bool> HasActiveBookingByLicensePlateAsync(string licensePlate, DateTime currentTime)
        {
            if (string.IsNullOrWhiteSpace(licensePlate)) return false;
        
            return await _context.Bookings
                .AnyAsync(b => b.Vehicle.VehiclePlateNumber == licensePlate 
                          && (b.Status == "PENDING" || b.Status == "CONFIRMED") 
                          && b.ExpectedArrival <= currentTime
                          && b.ExpiredAt > currentTime);
        }

        public async Task UpdateBookingStatusAsync(string bookingId, string status)
        {
            if (string.IsNullOrWhiteSpace(bookingId)) return;

            var booking = await _context.Bookings.FindAsync(bookingId);
            if (booking != null)
            {
                booking.Status = status.ToUpper();
                _context.Bookings.Update(booking);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<ParkingSession?> GetActiveSessionByBookingIdAsync(string bookingId)
        {
            return await _context.ParkingSessions
                .Include(s => s.Slot)
                .ThenInclude(p => p.Zone)
                .FirstOrDefaultAsync(s => s.BookingId == bookingId && s.Status == "ACTIVE");
        }
    }
}