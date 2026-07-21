using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using ParkingManagement.Data;
using ParkingManagement.Models;
using ParkingManagement.DTOs;
using ParkingManagement.Services.Helpers;

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

        // Zone-based capacity management
        public async Task<FloorZone?> FindBestAvailableZoneAsync(int vehicleTypeId)
        {
            return await _context.FloorZones
                .Where(z => z.VehicleTypeId == vehicleTypeId
                         && z.Status == "ACTIVE"
                         && z.AvailableCapacity > 0)
                .OrderBy(z => z.FloorNumber)
                .ThenByDescending(z => z.AvailableCapacity)
                .FirstOrDefaultAsync();
        }

        public async Task<FloorZone?> GetZoneByIdAsync(int zoneId)
        {
            return await _context.FloorZones.FindAsync(zoneId);
        }

        public async Task<FloorZone?> GetAnyActiveZoneByVehicleTypeAsync(int vehicleTypeId)
        {
            return await _context.FloorZones
                .Where(z => z.VehicleTypeId == vehicleTypeId && z.Status == "ACTIVE")
                .OrderBy(z => z.FloorNumber)
                .FirstOrDefaultAsync();
        }

        public async Task DecrementZoneCapacityAsync(int zoneId)
        {
            await _context.FloorZones
                .Where(z => z.ZoneId == zoneId && z.AvailableCapacity > 0)
                .ExecuteUpdateAsync(s => s.SetProperty(z => z.AvailableCapacity, z => z.AvailableCapacity - 1));
        }

        public async Task IncrementZoneCapacityAsync(int zoneId)
        {
            await _context.FloorZones
                .Where(z => z.ZoneId == zoneId)
                .ExecuteUpdateAsync(s => s.SetProperty(z => z.AvailableCapacity, z => z.AvailableCapacity + 1));
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

        public async Task<ParkingSession?> GetActiveSessionByPlateAsync(string licensePlate, bool exactMatch = false)
        {
            if (string.IsNullOrWhiteSpace(licensePlate)) return null;

            if (exactMatch)
            {
                var upperPlate = licensePlate.Trim().ToUpper();
                return await _context.ParkingSessions
                    .Include(s => s.Zone)
                    .Include(s => s.Booking)
                        .ThenInclude(b => b.Payments)
                    .Include(s => s.Booking)
                        .ThenInclude(b => b.VehicleUser)
                    .Include(s => s.Payments)
                    .Include(s => s.VehicleType)
                    .FirstOrDefaultAsync(s => s.LicensePlateIn == upperPlate && s.Status == "ACTIVE");
            }
            else
            {
                var cleanPlate = licensePlate.Replace("-", "").Replace(".", "").Replace(" ", "").ToUpper();
                return await _context.ParkingSessions
                    .Include(s => s.Zone)
                    .Include(s => s.Booking)
                        .ThenInclude(b => b.Payments)
                    .Include(s => s.Booking)
                        .ThenInclude(b => b.VehicleUser)
                    .Include(s => s.Payments)
                    .Include(s => s.VehicleType)
                    .FirstOrDefaultAsync(s => s.LicensePlateIn.Replace("-", "").Replace(".", "").Replace(" ", "").ToUpper() == cleanPlate && s.Status == "ACTIVE");
            }
        }

        public async Task<ParkingSession?> GetActiveSessionByTicketCodeAsync(string ticketCode)
        {
            if (string.IsNullOrWhiteSpace(ticketCode)) return null;

            return await _context.ParkingSessions
                .Include(s => s.Zone)
                .Include(s => s.Booking)
                    .ThenInclude(b => b.Payments)
                .Include(s => s.Booking)
                    .ThenInclude(b => b.VehicleUser)
                .Include(s => s.Payments)
                .FirstOrDefaultAsync(s => s.TicketCode == ticketCode && s.Status == "ACTIVE");
        }



        public async Task<ParkingSession?> GetActiveSessionByIdAsync(string sessionId)
        {
            if (string.IsNullOrWhiteSpace(sessionId)) return null;

            return await _context.ParkingSessions
                .Include(s => s.Zone)
                .Include(s => s.Booking)
                    .ThenInclude(b => b.Payments)
                .Include(s => s.Booking)
                    .ThenInclude(b => b.VehicleUser)
                .Include(s => s.Payments)
                .Include(s => s.VehicleType)
                .FirstOrDefaultAsync(s => s.SessionId == sessionId && s.Status == "ACTIVE");
        }

        public async Task<bool> UpdateSlotStatusWithLogAsync(string slotId, string status, string staffId, string reason, int estimatedDuration)
        {
            var slot = await _context.ParkingSlots.FindAsync(slotId);
            if (slot == null) return false;

            string oldStatus = slot.Status ?? "UNKNOWN";
            slot.Status = status.ToUpper();
            slot.LastUpdated = ParkingCalculationHelper.VnNow;

            var statusLog = new SlotStatusLog
            {
                LogId = "SLG-" + Guid.NewGuid().ToString("N").Substring(0, 15).ToUpper(),
                SlotId = slotId,
                OldStatus = oldStatus,
                NewStatus = status.ToUpper(),
                ChangedBy = staffId ?? "SYSTEM",
                ChangedAt = ParkingCalculationHelper.VnNow,
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
                var zoneFilter = filter.Zone.Trim();
                query = query.Where(s => s.Zone.ZoneName == zoneFilter || s.Zone.ZoneName.StartsWith(zoneFilter + " - "));
            }

            if (filter.VehicleTypeId.HasValue)
            {
                query = query.Where(s => s.Zone.VehicleTypeId == filter.VehicleTypeId.Value);
            }

            if (!string.IsNullOrWhiteSpace(filter.Status))
            {
                query = query.Where(s => s.Status == filter.Status.Trim().ToUpper());
            }

            var zoneQuery = _context.FloorZones.AsQueryable();
            if (filter.Floor.HasValue)
            {
                zoneQuery = zoneQuery.Where(z => z.FloorNumber == filter.Floor.Value);
            }
            if (!string.IsNullOrWhiteSpace(filter.Zone))
            {
                var zoneFilter = filter.Zone.Trim();
                zoneQuery = zoneQuery.Where(z => z.ZoneName == zoneFilter || z.ZoneName.StartsWith(zoneFilter + " - "));
            }
            if (filter.VehicleTypeId.HasValue)
            {
                zoneQuery = zoneQuery.Where(z => z.VehicleTypeId == filter.VehicleTypeId.Value);
            }

            var matchingZones = await zoneQuery.ToListAsync();
            var zoneIds = matchingZones.Select(z => z.ZoneId).ToList();
            var vehicleTypeIds = matchingZones.Select(z => z.VehicleTypeId).Distinct().ToList();

            int totalCapacity = 0;
            int availableCapacity = 0;
            int occupiedCount = 0;
            int reservedCount = 0;
            int maintenanceCount = 0;

            bool hasSlots = await _context.ParkingSlots.AnyAsync(s => zoneIds.Contains(s.ZoneId));
            if (hasSlots)
            {
                var slotsQuery = _context.ParkingSlots.Where(s => zoneIds.Contains(s.ZoneId));
                totalCapacity = await slotsQuery.CountAsync();
                availableCapacity = await slotsQuery.CountAsync(s => s.Status == "AVAILABLE");
                occupiedCount = await slotsQuery.CountAsync(s => s.Status == "OCCUPIED");
                reservedCount = await slotsQuery.CountAsync(s => s.Status == "RESERVED");
                maintenanceCount = await slotsQuery.CountAsync(s => s.Status == "MAINTENANCE");
            }
            else
            {
                totalCapacity = matchingZones.Sum(z => z.Capacity);
                availableCapacity = matchingZones.Sum(z => z.AvailableCapacity);

                occupiedCount = await _context.ParkingSessions
                    .CountAsync(s => s.Status == "ACTIVE" && (s.ZoneId.HasValue || s.SlotId != null) && 
                                     zoneIds.Contains(s.ZoneId ?? s.Slot!.ZoneId));

                reservedCount = await _context.Bookings
                    .CountAsync(b => (b.Status == "CONFIRMED" || b.Status == "PENDING") && b.ZoneId.HasValue && 
                                     zoneIds.Contains(b.ZoneId.Value));
                
                maintenanceCount = 0;
            }

            var statusCounts = new Dictionary<string, int>
            {
                { "TOTAL", totalCapacity },
                { "AVAILABLE", availableCapacity },
                { "OCCUPIED", occupiedCount },
                { "RESERVED", reservedCount },
                { "MAINTENANCE", maintenanceCount }
            };

            int totalCount = await query.CountAsync();

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
            int pageSize,
            bool? over3Days = null,
            bool? overtime = null)
        {
            if (page < 1) page = 1;
            if (pageSize <= 0) pageSize = 15;
        
            var query = _context.ParkingSessions
                .Include(s => s.Zone)
                .Include(s => s.StaffIn)
                .Include(s => s.StaffOut)
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

            if (over3Days.HasValue && over3Days.Value)
            {
                var threeDaysAgo = ParkingCalculationHelper.VnNow.AddDays(-3);
                query = query.Where(s => s.Status != null && s.Status.ToUpper() == "ACTIVE" && s.CheckInTime <= threeDaysAgo);
            }

            if (overtime.HasValue && overtime.Value)
            {
                var twentyFourHoursAgo = ParkingCalculationHelper.VnNow.AddHours(-24);
                query = query.Where(s => s.Status != null && s.Status.ToUpper() == "ACTIVE" && s.CheckInTime <= twentyFourHoursAgo);
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

            var cleanInputPlate = licensePlate.Replace("-", "").Replace(".", "").Replace(" ", "").ToUpper();

            // Auto-cancel expired bookings
            var expiredBookings = await _context.Bookings
                .Where(b => b.LicensePlate.Replace("-", "").Replace(".", "").Replace(" ", "").ToUpper() == cleanInputPlate
                            && (b.Status == "PENDING" || b.Status == "CONFIRMED")
                            && b.ExpectedArrival.AddMinutes(30) < currentTime)
                .ToListAsync();

            if (expiredBookings.Any())
            {
                foreach (var b in expiredBookings)
                {
                    if (b.Status == "PENDING")
                    {
                        b.Notes = "unpaid";
                    }
                    b.Status = "CANCELLED";
                }
                await _context.SaveChangesAsync();
            }
        
            return await _context.Bookings
                .Include(b => b.Zone)
                .Include(b => b.VehicleType)
                .FirstOrDefaultAsync(b => b.LicensePlate.Replace("-", "").Replace(".", "").Replace(" ", "").ToUpper() == cleanInputPlate
                    && b.Status == "CONFIRMED"
                    && b.ExpectedArrival.AddHours(-12) <= currentTime
                    && b.ExpectedArrival.AddMinutes(30) >= currentTime);
        }

        public async Task<bool> HasActiveBookingByLicensePlateAsync(string licensePlate, DateTime currentTime)
        {
            if (string.IsNullOrWhiteSpace(licensePlate)) return false;

            var cleanInputPlate = licensePlate.Replace("-", "").Replace(".", "").Replace(" ", "").ToUpper();

            // Auto-cancel expired bookings
            var expiredBookings = await _context.Bookings
                .Where(b => b.LicensePlate.Replace("-", "").Replace(".", "").Replace(" ", "").ToUpper() == cleanInputPlate
                            && (b.Status == "PENDING" || b.Status == "CONFIRMED")
                            && b.ExpectedArrival.AddMinutes(30) < currentTime)
                .ToListAsync();

            if (expiredBookings.Any())
            {
                foreach (var b in expiredBookings)
                {
                    if (b.Status == "PENDING")
                    {
                        b.Notes = "unpaid";
                    }
                    b.Status = "CANCELLED";
                }
                await _context.SaveChangesAsync();
            }
        
            return await _context.Bookings
                .AnyAsync(b => b.LicensePlate.Replace("-", "").Replace(".", "").Replace(" ", "").ToUpper() == cleanInputPlate
                          && b.Status == "CONFIRMED" 
                          && b.ExpectedArrival.AddHours(-12) <= currentTime
                          && b.ExpectedArrival.AddMinutes(30) >= currentTime);
        }

        public async Task UpdateBookingStatusAsync(string bookingId, string status, int? zoneId = null)
        {
            if (string.IsNullOrWhiteSpace(bookingId)) return;

            var booking = await _context.Bookings.FindAsync(bookingId);
            if (booking != null)
            {
                booking.Status = status.ToUpper();
                if (zoneId.HasValue)
                {
                    booking.ZoneId = zoneId.Value;
                }
                _context.Bookings.Update(booking);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<ParkingSession?> GetActiveSessionByBookingIdAsync(string bookingId)
        {
            return await _context.ParkingSessions
                .Include(s => s.Zone)
                .Include(s => s.Booking)
                    .ThenInclude(b => b.Payments)
                .Include(s => s.Booking)
                    .ThenInclude(b => b.VehicleUser)
                .Include(s => s.Payments)
                .FirstOrDefaultAsync(s => s.BookingId == bookingId && s.Status == "ACTIVE");
        }

        public async Task MarkSessionPaidAsync(ParkingSession session, decimal fee, DateTime? timePaidUntil)
        {
            var payment = new Payment
            {
                PaymentId = "PAY-QP-" + Guid.NewGuid().ToString("N").Substring(0, 10).ToUpper(),
                PaymentType = "SESSION",
                SessionId = session.SessionId,
                AmountDue = fee,
                AmountPaid = fee,
                ChangeDue = 0,
                PaymentMethod = "CASH",
                Status = "SUCCESS",
                UserId = null,
                PaymentTime = ParkingCalculationHelper.VnNow,
                TransactionId = "MOCK_" + Guid.NewGuid().ToString("N").Substring(0, 12).ToUpper()
            };

            session.PaymentStatus = "PAID";
            session.TimePaidUntil = timePaidUntil;
            session.TotalFee = (session.Payments.Where(p => p.Status == "SUCCESS").Sum(p => p.AmountPaid)) + fee;

            await _context.Payments.AddAsync(payment);
            _context.ParkingSessions.Update(session);
            await _context.SaveChangesAsync();
        }

        public async Task CreatePaymentAsync(Payment payment)
        {
            await _context.Payments.AddAsync(payment);
            await _context.SaveChangesAsync();
        }

        public async Task<List<ZoneRealtimeStatsDto>> GetZoneRealtimeStatsAsync()
        {
            var zones = await _context.FloorZones
                .Include(z => z.VehicleType)
                .Include(z => z.ParkingSlots)
                .Where(z => z.Status == "ACTIVE")
                .ToListAsync();

            // Số xe đang đỗ thực tế theo từng zone (ACTIVE sessions có ZoneId hoặc gián tiếp qua Slot)
            var occupiedByZone = await _context.ParkingSessions
                .Where(s => s.Status == "ACTIVE" && (s.ZoneId.HasValue || s.SlotId != null))
                .GroupBy(s => s.ZoneId ?? s.Slot!.ZoneId)
                .Select(g => new { ZoneId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.ZoneId, x => x.Count);

            // Số booking CONFIRMED/PENDING chưa check-in theo từng zone
            var bookedByZone = await _context.Bookings
                .Where(b => (b.Status == "CONFIRMED" || b.Status == "PENDING") && b.ZoneId.HasValue)
                .GroupBy(b => b.ZoneId!.Value)
                .Select(g => new { ZoneId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.ZoneId, x => x.Count);

            return zones.Select(z =>
            {
                bool hasSlots = z.ParkingSlots.Any();
                int capacity = hasSlots ? z.ParkingSlots.Count : z.Capacity;
                int availableCapacity = hasSlots ? z.ParkingSlots.Count(s => s.Status == "AVAILABLE") : z.AvailableCapacity;
                int occupiedCount = hasSlots ? z.ParkingSlots.Count(s => s.Status == "OCCUPIED") : occupiedByZone.GetValueOrDefault(z.ZoneId, 0);
                int bookedCount = hasSlots ? z.ParkingSlots.Count(s => s.Status == "RESERVED") : bookedByZone.GetValueOrDefault(z.ZoneId, 0);
                int maintenanceCount = z.ParkingSlots.Count(s => s.Status == "MAINTENANCE");

                return new ZoneRealtimeStatsDto
                {
                    ZoneId = z.ZoneId,
                    ZoneName = z.ZoneName,
                    FloorNumber = z.FloorNumber,
                    Capacity = capacity,
                    AvailableCapacity = availableCapacity,
                    OccupiedCount = occupiedCount,
                    BookedCount = bookedCount,
                    MaintenanceCount = maintenanceCount,
                    VehicleTypeName = z.VehicleType.VehicleTypeName
                };
            }).ToList();
        }

        /// <summary>
        /// Tìm slot đầu tiên AVAILABLE trong Zone (sắp xếp theo SlotName) và đánh dấu OCCUPIED.
        /// Nếu không có slot nào khả dụng (zone chưa có slot trong DB), bỏ qua để tương thích ngược.
        /// </summary>
        public async Task OccupyFirstAvailableSlotInZoneAsync(int zoneId)
        {
            // Ưu tiên slot RESERVED trước (check-in booking), nếu không có thì lấy AVAILABLE (walk-in)
            var targetSlotId = await _context.ParkingSlots
                .Where(s => s.ZoneId == zoneId && (s.Status == "RESERVED" || s.Status == "AVAILABLE"))
                .OrderBy(s => s.Status == "RESERVED" ? 0 : 1) // RESERVED ưu tiên trước
                .ThenBy(s => s.SlotName)
                .Select(s => s.SlotId)
                .FirstOrDefaultAsync();

            if (targetSlotId == null) return; // Không có slot trong DB — bỏ qua, tương thích ngược

            await _context.ParkingSlots
                .Where(s => s.SlotId == targetSlotId)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(x => x.Status, "OCCUPIED")
                    .SetProperty(x => x.LastUpdated, ParkingCalculationHelper.VnNow));
        }

        /// <summary>
        /// Tìm slot OCCUPIED đầu tiên trong Zone (sắp xếp theo LastUpdated tăng dần — slot bị chiếm lâu nhất)
        /// và giải phóng về AVAILABLE khi xe check-out.
        /// </summary>
        public async Task ReleaseOldestOccupiedSlotInZoneAsync(int zoneId)
        {
            var targetSlotId = await _context.ParkingSlots
                .Where(s => s.ZoneId == zoneId && s.Status == "OCCUPIED")
                .OrderBy(s => s.LastUpdated)
                .Select(s => s.SlotId)
                .FirstOrDefaultAsync();

            if (targetSlotId == null) return; // Không có slot OCCUPIED — bỏ qua

            await _context.ParkingSlots
                .Where(s => s.SlotId == targetSlotId)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(x => x.Status, "AVAILABLE")
                    .SetProperty(x => x.LastUpdated, ParkingCalculationHelper.VnNow));
        }

        /// <summary>
        /// Tìm slot đầu tiên AVAILABLE trong Zone và đánh dấu RESERVED khi tạo booking.
        /// </summary>
        public async Task ReserveFirstAvailableSlotInZoneAsync(int zoneId)
        {
            var targetSlotId = await _context.ParkingSlots
                .Where(s => s.ZoneId == zoneId && s.Status == "AVAILABLE")
                .OrderBy(s => s.SlotName)
                .Select(s => s.SlotId)
                .FirstOrDefaultAsync();

            if (targetSlotId == null) return; // Không có slot trong DB — bỏ qua, tương thích ngược

            await _context.ParkingSlots
                .Where(s => s.SlotId == targetSlotId)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(x => x.Status, "RESERVED")
                    .SetProperty(x => x.LastUpdated, ParkingCalculationHelper.VnNow));
        }

        /// <summary>
        /// Tìm slot RESERVED cũ nhất trong Zone và giải phóng về AVAILABLE khi booking bị hủy / hết hạn.
        /// </summary>
        public async Task ReleaseOldestReservedSlotInZoneAsync(int zoneId)
        {
            var targetSlotId = await _context.ParkingSlots
                .Where(s => s.ZoneId == zoneId && s.Status == "RESERVED")
                .OrderBy(s => s.LastUpdated)
                .Select(s => s.SlotId)
                .FirstOrDefaultAsync();

            if (targetSlotId == null) return; // Không có slot RESERVED — bỏ qua

            await _context.ParkingSlots
                .Where(s => s.SlotId == targetSlotId)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(x => x.Status, "AVAILABLE")
                    .SetProperty(x => x.LastUpdated, ParkingCalculationHelper.VnNow));
        }
    }
}
