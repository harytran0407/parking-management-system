using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using ParkingManagement.DTOs;
using ParkingManagement.Models;
using ParkingManagement.Repositories;
using ParkingManagement.Services.Helpers;

namespace ParkingManagement.Services
{
    public class ParkingService : IParkingService
    {
        private readonly IParkingRepository _parkingRepository;

        public ParkingService(IParkingRepository parkingRepository)
        {
            _parkingRepository = parkingRepository;
        }

        public async Task<CheckInResponseDto> ProcessWalkInCheckInAsync(VehicleCheckInDto dto, string staffId)
        {
            if (await _parkingRepository.IsVehicleActiveInParkingAsync(dto.LicensePlateIn))
            {
                throw new InvalidOperationException("ACTIVE_SESSION_EXISTS");
            }

            var booking = await _parkingRepository.GetActiveBookingAsync(dto.LicensePlateIn, dto.VehicleTypeId, dto.BookingId);
            string? actualBookingId = booking?.BookingId;

            string selectedSlotId = await ResolveSlotIdAsync(dto.SlotId, dto.VehicleTypeId);

            var initialSlotInfo = await _parkingRepository.GetSlotByIdAsync(selectedSlotId);
            if (initialSlotInfo == null) throw new KeyNotFoundException("SLOT_NOT_AVAILABLE");

            string sessionId = GenerateSessionId();
            DateTime checkInTime = DateTime.Now;

            await _parkingRepository.SaveChangesWithTransactionAsync(async () =>
            {
                var slotToUpdate = await _parkingRepository.GetSlotByIdAsync(selectedSlotId);
                if (slotToUpdate == null) throw new KeyNotFoundException("SLOT_NOT_AVAILABLE");

                if (slotToUpdate.Status?.ToUpper() != "AVAILABLE")
                {
                    throw new InvalidOperationException("CONCURRENCY_CONFLICT");
                }

                var session = new ParkingSession
                {
                    SessionId = sessionId,
                    CheckInTime = checkInTime,
                    LicensePlateIn = dto.LicensePlateIn,
                    VehicleTypeId = dto.VehicleTypeId,
                    CameraIn = dto.CameraIn,
                    GateIn = dto.GateIn,
                    ImageUrlIn = dto.ImageUrlIn,
                    StaffInId = staffId,
                    SlotId = selectedSlotId,
                    BookingId = actualBookingId,
                    Status = "ACTIVE",
                    PaymentStatus = "PENDING"
                };
                await _parkingRepository.CreateSessionAsync(session);

                slotToUpdate.Status = "OCCUPIED";
                slotToUpdate.CurrentSessionId = sessionId;
                slotToUpdate.LastUpdated = checkInTime;

                await _parkingRepository.UpdateSlotAsync(slotToUpdate);

                if (booking != null)
                {
                    booking.Status = "ACTIVE";
                    booking.SlotId = selectedSlotId;
                }
            });

            return MapToCheckInResponseDto(sessionId, checkInTime, dto.LicensePlateIn, selectedSlotId, initialSlotInfo);
        }

        public async Task<CheckOutResponseDto> ProcessCheckOutAsync(VehicleCheckOutDto checkOutDto, string staffId)
        {
            var session = await _parkingRepository.GetActiveSessionByPlateAsync(checkOutDto.LicensePlateOut);
            if (session == null)
            {
                throw new Exception("INVALID_TICKET");
            }
        
            var checkOutTime = DateTime.Now;
            int durationMinutes = ParkingCalculationHelper.CalculateDurationMinutes(session.CheckInTime, checkOutTime);
        
            var policy = await _parkingRepository.GetActivePricingPolicyByVehicleTypeAsync(session.VehicleTypeId)
                         ?? throw new Exception("PRICING_POLICY_NOT_CONFIGURED");
        
            string operatingHours = await _parkingRepository.GetOperatingHoursForDayAsync(checkOutTime);
        
            var feeResult = ParkingCalculationHelper.CalculateParkingFee(
                session.CheckInTime ?? DateTime.Now,
                checkOutTime,
                policy,
                operatingHours
            );

            decimal finalFee = feeResult.CurrentFee;
            Booking? booking = null;

            if (!string.IsNullOrEmpty(session.BookingId))
            {
                booking = await _parkingRepository.GetBookingWithPaymentsAsync(session.BookingId);
                if (booking != null)
                {
                    decimal depositPaid = booking.Payments?.Where(p => p.Status == "SUCCESS").Sum(p => (decimal?)p.AmountPaid) ?? 0m;
                    finalFee -= depositPaid;
                    if (finalFee < 0) finalFee = 0;
                }
            }
        
            await _parkingRepository.SaveChangesWithTransactionAsync(async () =>
            {
                UpdateSessionForCheckOut(session, checkOutDto, staffId, checkOutTime, durationMinutes, finalFee);
                await _parkingRepository.UpdateSessionAsync(session);
        
                if (!string.IsNullOrEmpty(session.SlotId))
                {
                    var slot = await _parkingRepository.GetSlotByIdAsync(session.SlotId);
                    if (slot != null)
                    {
                        slot.Status = "AVAILABLE";
                        slot.CurrentSessionId = null;
                        slot.LastUpdated = checkOutTime;
        
                        await _parkingRepository.UpdateSlotAsync(slot);
                    }
                }

                if (booking != null)
                {
                    booking.Status = "COMPLETED";
                }
            });
        
            return MapToCheckOutResponseDto(session, finalFee, durationMinutes, checkOutTime);
        }

        public async Task<ActiveSessionResponseDto> GetActiveSessionByLicensePlateAsync(string licensePlate)
        {
            var session = await _parkingRepository.GetActiveSessionByPlateAsync(licensePlate)
                          ?? throw new InvalidOperationException("INVALID_TICKET");

            var currentTime = DateTime.Now;
            int durationMinutes = ParkingCalculationHelper.CalculateDurationMinutes(session.CheckInTime, currentTime);

            decimal currentFee = 0;
            var policy = await _parkingRepository.GetActivePricingPolicyByVehicleTypeAsync(session.VehicleTypeId);
            if (policy != null)
            {
                string operatingHours = await _parkingRepository.GetOperatingHoursForDayAsync(currentTime);

                var feeResult = ParkingCalculationHelper.CalculateParkingFee(
                    session.CheckInTime ?? DateTime.Now,
                    currentTime,
                    policy,
                    operatingHours
                );
                currentFee = feeResult.CurrentFee;

                if (!string.IsNullOrEmpty(session.BookingId))
                {
                    var booking = await _parkingRepository.GetBookingWithPaymentsAsync(session.BookingId);
                    if (booking != null)
                    {
                        decimal depositPaid = booking.Payments?.Where(p => p.Status == "SUCCESS").Sum(p => (decimal?)p.AmountPaid) ?? 0m;
                        currentFee -= depositPaid;
                        if (currentFee < 0) currentFee = 0;
                    }
                }
            }

            return MapToActiveSessionResponseDto(session, durationMinutes, currentFee);
        }

        public async Task<ActiveSessionResponseDto> GetActiveSessionBySlotNameAsync(string slotName)
        {
            var slot = await _parkingRepository.GetSlotByNameAsync(slotName);
            if (slot == null) throw new InvalidOperationException("SLOT_NOT_FOUND");
        
            var session = await _parkingRepository.GetActiveSessionBySlotIdAsync(slot.SlotId)
                          ?? throw new InvalidOperationException("ACTIVE_SESSION_NOT_FOUND");
        
            return await GetActiveSessionByLicensePlateAsync(session.LicensePlateIn);
        }

        public async Task<PreCheckOutResponseDto> CalculatePreCheckOutFeeAsync(string sessionId)
        {
            var session = await _parkingRepository.GetActiveSessionByIdAsync(sessionId)
                          ?? throw new InvalidOperationException("INVALID_TICKET");

            var currentTime = DateTime.Now;

            var policy = await _parkingRepository.GetActivePricingPolicyByVehicleTypeAsync(session.VehicleTypeId)
                         ?? throw new InvalidOperationException("PRICING_POLICY_NOT_CONFIGURED");

            string operatingHours = await _parkingRepository.GetOperatingHoursForDayAsync(currentTime);

            var feeResult = ParkingCalculationHelper.CalculateParkingFee(
                session.CheckInTime ?? DateTime.Now,
                currentTime,
                policy,
                operatingHours
            );

            decimal finalFee = feeResult.CurrentFee;
            if (!string.IsNullOrEmpty(session.BookingId))
            {
                var booking = await _parkingRepository.GetBookingWithPaymentsAsync(session.BookingId);
                if (booking != null)
                {
                    decimal depositPaid = booking.Payments?.Where(p => p.Status == "SUCCESS").Sum(p => (decimal?)p.AmountPaid) ?? 0m;
                    finalFee -= depositPaid;
                    if (finalFee < 0) finalFee = 0;
                }
            }
            // Overwrite feeResult.CurrentFee to reflect actual amount to pay
            feeResult.CurrentFee = finalFee;

            return MapToPreCheckOutResponseDto(session, policy, feeResult);
        }

        public async Task<SlotStatusResponseDto> UpdateSlotStatusAsync(UpdateSlotStatusDto dto, string staffId)
        {
            var validStatuses = new[] { "AVAILABLE", "OCCUPIED", "RESERVED", "MAINTENANCE" };
            string upperStatus = dto.Status.ToUpper();

            if (!validStatuses.Contains(upperStatus))
            {
                throw new ArgumentException("INVALID_SLOT_STATUS");
            }

            var slot = await _parkingRepository.GetSlotByIdAsync(dto.SlotId);
            if (slot == null)
            {
                throw new KeyNotFoundException("SLOT_NOT_AVAILABLE");
            }

            if (slot.Status == "OCCUPIED" && (upperStatus == "AVAILABLE" || upperStatus == "RESERVED"))
            {
                throw new InvalidOperationException("CANNOT_MANUALLY_FREE_AN_OCCUPIED_SLOT");
            }

            if (upperStatus == "MAINTENANCE" && slot.Status == "OCCUPIED")
            {
                throw new InvalidOperationException("CANNOT_MAINTAIN_OCCUPIED_SLOT");
            }

            if (upperStatus == "MAINTENANCE" && slot.Status == "RESERVED")
            {
                throw new InvalidOperationException("CANNOT_MAINTAIN_RESERVED_SLOT");
            }

            bool isUpdated = await _parkingRepository.UpdateSlotStatusWithLogAsync(dto.SlotId, upperStatus, staffId, dto.Reason, dto.EstimatedDurationMinutes);

            if (!isUpdated)
            {
                throw new InvalidOperationException("DATABASE_UPDATE_FAILED");
            }

            return new SlotStatusResponseDto
            {
                Success = true,
                Message = "Slot status updated successfully.",
                Data = new SlotStatusResponseData
                {
                    SlotId = slot.SlotId,
                    SlotName = slot.SlotName ?? "Unknown",
                    Status = upperStatus,
                    LastUpdated = DateTime.Now
                }
            };
        }

        public async Task<ParkingSlotsResponseDto> GetRealtimeSlotsAsync(SlotQueryFilterDto filter)
        {
            var (slots, totalCount, statusCounts) = await _parkingRepository.GetPagedSlotsWithStatusAsync(filter);

            var response = new ParkingSlotsResponseDto();

            response.Data.Summary = new SlotSummaryDto
            {
                TotalSlots = statusCounts["TOTAL"],
                Available = statusCounts["AVAILABLE"],
                Occupied = statusCounts["OCCUPIED"],
                Reserved = statusCounts["RESERVED"],
                Maintenance = statusCounts["MAINTENANCE"]
            };

            int totalPages = (int)Math.Ceiling((double)totalCount / filter.PageSize);
            response.Data.Pagination = new PaginationDto
            {
                Page = filter.Page,
                PageSize = filter.PageSize,
                TotalItems = totalCount,
                TotalPages = totalPages == 0 ? 1 : totalPages
            };

            foreach (var slot in slots)
            {
                var activeSession = slot.ParkingSessions?
                    .FirstOrDefault(ps => ps.Status == "ACTIVE" || ps.SessionId == slot.CurrentSessionId);

                var slotDetail = new SlotDetailDto
                {
                    SlotId = slot.SlotId,
                    SlotName = slot.SlotName,
                    Floor = slot.Zone?.FloorNumber ?? 0,
                    Zone = slot.Zone?.ZoneName ?? "N/A",
                    VehicleTypeId = slot.Zone?.VehicleTypeId ?? 0,
                    Status = slot.Status ?? "AVAILABLE",
                    IsHandicap = slot.IsHandicap ?? false,
                    IsElectricCharging = slot.IsElectricCharging ?? false,
                    CurrentSessionId = slot.CurrentSessionId,
                    LastUpdated = slot.LastUpdated,
                    OccupiedByPlate = slot.Status == "OCCUPIED" ? activeSession?.LicensePlateIn : null,
                    OccupiedSince = slot.Status == "OCCUPIED" ? activeSession?.CheckInTime : null
                };

                response.Data.Slots.Add(slotDetail);
            }

            return response;
        }

        public async Task<PagedHistoryResponseDto> GetParkingHistoryAsync(ParkingHistoryFilterDto filter)
        {
            var (items, totalCount) = await _parkingRepository.GetParkingHistoryAsync(
        filter.LicensePlate,
        filter.FromDate,
        filter.ToDate,
        filter.VehicleType,
        filter.Status,
        filter.Page,
        filter.PageSize
            );
        
            var historyItems = items.Select(s => new ParkingHistoryItemDto
            {
                SessionId = s.SessionId,
                LicensePlate = s.LicensePlateIn ?? s.LicensePlateOut ?? "N/A",
                VehicleType = s.VehicleTypeId.ToString(),
                SlotNumber = s.Slot?.SlotName ?? "N/A",
                ZoneName = s.Slot?.Zone?.ZoneName ?? "N/A",
                CheckInTime = s.CheckInTime ?? DateTime.Now,
                CheckOutTime = s.CheckOutTime,
                TotalFee = s.TotalFee ?? 0,
                PaymentStatus = s.Status == "ACTIVE" ? "PARKING" : (s.PaymentStatus ?? "COMPLETED"),
                StaffCheckIn = s.StaffInId ?? "System",
                StaffCheckOut = s.StaffOutId,
                
                Status = s.Status?.ToUpper() ?? (s.CheckOutTime.HasValue ? "COMPLETED" : "ACTIVE")
            }).ToList();
        
            return new PagedHistoryResponseDto
            {
                Success = true,
                Data = historyItems,
                TotalRecords = totalCount,
                Page = filter.Page,
                PageSize = filter.PageSize
            };
        }

        #region Private Sub-Functions (Các hàm phụ trợ nội bộ giúp code gọn gàng)

        private async Task<string> ResolveSlotIdAsync(string? inputSlotId, int vehicleTypeId)
        {
            if (!string.IsNullOrEmpty(inputSlotId)) return inputSlotId;

            var availableSlot = await _parkingRepository.FindFirstAvailableSlotAsync(vehicleTypeId)
                                ?? throw new InvalidOperationException("NO_AVAILABLE_SLOT");
            return availableSlot.SlotId;
        }

        private string GenerateSessionId() => "sess_" + Guid.NewGuid().ToString("N").Substring(0, 10).ToLower();

        private void UpdateSessionForCheckOut(ParkingSession session, VehicleCheckOutDto dto, string staffId, DateTime checkOutTime, int duration, decimal fee)
        {
            session.LicensePlateOut = dto.LicensePlateOut;
            session.CameraOut = dto.CameraOut;
            session.GateOut = dto.GateOut;
            session.ImageUrlOut = dto.ImageUrlOut;
            session.StaffOutId = staffId;
            session.CheckOutTime = checkOutTime;
            session.DurationMinutes = duration;
            session.TotalFee = fee;
            session.Status = "COMPLETED";
            session.PaymentStatus = "PAID";
        }

        #endregion

        #region Data Mappers (Chuyển đổi DTO tách biệt luồng xử lý)

        private CheckInResponseDto MapToCheckInResponseDto(string sessId, DateTime time, string plate, string slotId, ParkingSlot? slotInfo)
        {
            return new CheckInResponseDto
            {
                Success = true,
                Data = new CheckInResultDataDto
                {
                    SessionId = sessId,
                    LicensePlateIn = plate,
                    SlotId = slotId,
                    SlotName = slotInfo?.SlotName ?? "N/A",
                    Floor = slotInfo?.Zone?.FloorNumber ?? 1,
                    Zone = slotInfo?.Zone?.ZoneName ?? "A",
                    CheckInTime = time,
                    Status = "ACTIVE",
                    PaymentStatus = "PENDING"
                }
            };
        }

        private CheckOutResponseDto MapToCheckOutResponseDto(ParkingSession session, decimal fee, int duration, DateTime checkOutTime)
        {
            return new CheckOutResponseDto
            {
                SessionId = session.SessionId,
                LicensePlateIn = session.LicensePlateIn ?? string.Empty,
                CheckInTime = session.CheckInTime ?? DateTime.Now,
                CheckOutTime = checkOutTime,
                DurationMinutes = duration,
                Status = session.Status ?? "COMPLETED",
                TotalFee = fee,
                PaymentStatus = session.PaymentStatus ?? "PAID"
            };
        }

        private ActiveSessionResponseDto MapToActiveSessionResponseDto(ParkingSession session, int duration, decimal fee)
        {
            return new ActiveSessionResponseDto
            {
                Success = true,
                Data = new ActiveSessionDataDto
                {
                    SessionId = session.SessionId,
                    LicensePlateIn = session.LicensePlateIn ?? string.Empty,
                    CheckInTime = session.CheckInTime ?? DateTime.Now,
                    DurationMinutes = duration,
                    SlotId = session.SlotId ?? string.Empty,
                    SlotName = session.Slot?.SlotName ?? "N/A",
                    Floor = session.Slot?.Zone?.FloorNumber ?? 1,
                    CurrentFee = fee,
                    Status = session.Status ?? "ACTIVE",
                    PaymentStatus = session.PaymentStatus ?? "PENDING"
                }
            };
        }

        private PreCheckOutResponseDto MapToPreCheckOutResponseDto(ParkingSession session, PricingPolicy policy, ParkingFeeResult feeResult)
        {
            return new PreCheckOutResponseDto
            {
                Success = true,
                Data = new PreCheckOutDataDto
                {
                    SessionId = session.SessionId,
                    CurrentFee = feeResult.CurrentFee,
                    FeeBreakdown = new FeeBreakdownDto
                    {
                        BasePrice = policy.BasePrice,
                        HourlyRate = policy.HourlyRate,
                        Hours = feeResult.Hours,
                        OvernightFee = feeResult.OvernightFee,
                        Total = feeResult.CurrentFee
                    },
                    GracePeriodRemainingSeconds = feeResult.GracePeriodRemainingSeconds
                }
            };
        }

        #endregion
    }
}