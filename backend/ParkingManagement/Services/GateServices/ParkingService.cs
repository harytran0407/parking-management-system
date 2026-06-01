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
            // 1. Kiểm tra xe đã có phiên hoạt động chưa
            if (await _parkingRepository.IsVehicleActiveInParkingAsync(dto.LicensePlateIn))
            {
                throw new InvalidOperationException("ACTIVE_SESSION_EXISTS");
            }

            // 2. Định vị vị trí đỗ
            string selectedSlotId = await ResolveSlotIdAsync(dto.SlotId, dto.VehicleTypeId);

            var initialSlotInfo = await _parkingRepository.GetSlotByIdAsync(selectedSlotId);
            if (initialSlotInfo == null) throw new KeyNotFoundException("SLOT_NOT_AVAILABLE");

            string sessionId = GenerateSessionId();
            DateTime checkInTime = DateTime.Now;

            // 3. THỰC THI ATOMIC TRANSACTION (Kiểm tra và chiếm slot đồng thời)
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
                    BookingId = dto.BookingId,
                    Status = "ACTIVE",
                    PaymentStatus = "PENDING"
                };
                await _parkingRepository.CreateSessionAsync(session);

                slotToUpdate.Status = "OCCUPIED";
                slotToUpdate.CurrentSessionId = sessionId;
                slotToUpdate.LastUpdated = checkInTime;

                await _parkingRepository.UpdateSlotAsync(slotToUpdate);
            });

            return MapToCheckInResponseDto(sessionId, checkInTime, dto.LicensePlateIn, selectedSlotId, initialSlotInfo);
        }

        public async Task<CheckOutResponseDto> ProcessCheckOutAsync(VehicleCheckOutDto checkOutDto)
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

            // ĐỒNG BỘ: Gọi hàm Helper lấy về toàn bộ đối tượng kết quả tính toán
            var feeResult = ParkingCalculationHelper.CalculateParkingFee(
                session.CheckInTime ?? DateTime.Now,
                checkOutTime,
                policy,
                operatingHours
            );

            await _parkingRepository.SaveChangesWithTransactionAsync(async () =>
            {
                UpdateSessionForCheckOut(session, checkOutDto, checkOutTime, durationMinutes, feeResult.CurrentFee);
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
            });

            return MapToCheckOutResponseDto(session, feeResult.CurrentFee, durationMinutes, checkOutTime);
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
            }

            return MapToActiveSessionResponseDto(session, durationMinutes, currentFee);
        }

        public async Task<PreCheckOutResponseDto> CalculatePreCheckOutFeeAsync(string sessionId)
        {
            var session = await _parkingRepository.GetActiveSessionByIdAsync(sessionId)
                          ?? throw new InvalidOperationException("INVALID_TICKET");

            var currentTime = DateTime.Now;

            var policy = await _parkingRepository.GetActivePricingPolicyByVehicleTypeAsync(session.VehicleTypeId)
                         ?? throw new InvalidOperationException("PRICING_POLICY_NOT_CONFIGURED");

            string operatingHours = await _parkingRepository.GetOperatingHoursForDayAsync(currentTime);

            // ĐỒNG BỘ ĐỘNG HOÀN TOÀN: Ép hệ thống chạy qua bộ lọc mới nhất của Helper
            var feeResult = ParkingCalculationHelper.CalculateParkingFee(
                session.CheckInTime ?? DateTime.Now,
                currentTime,
                policy,
                operatingHours
            );

            // Truyền toàn bộ kết quả đóng gói từ bộ Helper sang cho hàm ánh xạ DTO xử lý
            return MapToPreCheckOutResponseDto(session, policy, feeResult);
        }

        public async Task<SlotStatusResponseDto> UpdateSlotStatusAsync(UpdateSlotStatusDto dto, string staffId)
        {
            // 1. Validate trạng thái đầu vào hợp lệ
            var validStatuses = new[] { "AVAILABLE", "OCCUPIED", "RESERVED", "MAINTENANCE" };
            string upperStatus = dto.Status.ToUpper();

            if (!validStatuses.Contains(upperStatus))
            {
                throw new ArgumentException("INVALID_SLOT_STATUS");
            }

            // 2. Kiểm tra sự tồn tại của Slot
            var slot = await _parkingRepository.GetSlotByIdAsync(dto.SlotId);
            if (slot == null)
            {
                throw new KeyNotFoundException("SLOT_NOT_AVAILABLE");
            }

            // --- KIỂM TRA RÀNG BUỘC LOGIC BUSINESS ---
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
            // ---------------------------------------------------------

            // 3. Tiến hành cập nhật Database & Ghi Log
            bool isUpdated = await _parkingRepository.UpdateSlotStatusWithLogAsync(dto.SlotId, upperStatus, staffId, dto.Reason, dto.EstimatedDurationMinutes);

            if (!isUpdated)
            {
                throw new InvalidOperationException("DATABASE_UPDATE_FAILED");
            }

            // 4. Định dạng dữ liệu trả về...
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
            // 1. Gọi Repository lấy dữ liệu thô từ Database
            var (slots, totalCount, statusCounts) = await _parkingRepository.GetPagedSlotsWithStatusAsync(filter);

            var response = new ParkingSlotsResponseDto();

            // 2. Thiết lập khối Summary số lượng ô đỗ theo đúng định dạng API yêu cầu
            response.Data.Summary = new SlotSummaryDto
            {
                TotalSlots = statusCounts["TOTAL"],
                Available = statusCounts["AVAILABLE"],
                Occupied = statusCounts["OCCUPIED"],
                Reserved = statusCounts["RESERVED"],
                Maintenance = statusCounts["MAINTENANCE"]
            };

            // 3. Thiết lập khối thông tin phân trang (Pagination)
            int totalPages = (int)Math.Ceiling((double)totalCount / filter.PageSize);
            response.Data.Pagination = new PaginationDto
            {
                Page = filter.Page,
                PageSize = filter.PageSize,
                TotalItems = totalCount,
                TotalPages = totalPages == 0 ? 1 : totalPages
            };

            // 4. Ánh xạ danh sách chi tiết ô đỗ xe (Mapping sang DTO)
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

        #region Private Sub-Functions (Các hàm phụ trợ nội bộ giúp code gọn gàng)

        private async Task<string> ResolveSlotIdAsync(string? inputSlotId, int vehicleTypeId)
        {
            if (!string.IsNullOrEmpty(inputSlotId)) return inputSlotId;

            var availableSlot = await _parkingRepository.FindFirstAvailableSlotAsync(vehicleTypeId)
                                ?? throw new InvalidOperationException("NO_AVAILABLE_SLOT");
            return availableSlot.SlotId;
        }

        private string GenerateSessionId() => "sess_" + Guid.NewGuid().ToString("N").Substring(0, 10).ToLower();

        private void UpdateSessionForCheckOut(ParkingSession session, VehicleCheckOutDto dto, DateTime checkOutTime, int duration, decimal fee)
        {
            session.LicensePlateOut = dto.LicensePlateOut;
            session.CameraOut = dto.CameraOut;
            session.GateOut = dto.GateOut;
            session.ImageUrlOut = dto.ImageUrlOut;
            session.StaffOutId = dto.StaffOutId;
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
                    CurrentFee = feeResult.CurrentFee, // Đồng bộ tổng tiền hóa đơn lớn
                    FeeBreakdown = new FeeBreakdownDto
                    {
                        BasePrice = policy.BasePrice,
                        HourlyRate = policy.HourlyRate,
                        Hours = feeResult.Hours,         // Đồng bộ số giờ (Bằng 0 nếu đang trong thời gian ân hạn)
                        OvernightFee = feeResult.OvernightFee,
                        Total = feeResult.CurrentFee     // Đồng bộ tổng tiền chi tiết breakdown
                    },
                    // Đồng bộ số giây ân hạn thực tế còn lại (Sẽ tự động về 0 nếu xe đã đỗ quá giờ miễn phí)
                    GracePeriodRemainingSeconds = feeResult.GracePeriodRemainingSeconds
                }
            };
        }

        #endregion
    }
}