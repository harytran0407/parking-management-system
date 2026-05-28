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

            // Bổ sung: Lấy trước thông tin slot (chỉ dùng để map dữ liệu trả về DTO ở cuối)
            var initialSlotInfo = await _parkingRepository.GetSlotByIdAsync(selectedSlotId);
            if (initialSlotInfo == null) throw new KeyNotFoundException("SLOT_NOT_AVAILABLE");

            string sessionId = GenerateSessionId();
            DateTime checkInTime = DateTime.Now;

            // 3. THỰC THI ATOMIC TRANSACTION (Kiểm tra và chiếm slot đồng thời)
            await _parkingRepository.SaveChangesWithTransactionAsync(async () =>
            {
                // Đọc lại trạng thái slot trực tiếp bên trong Transaction block để đảm bảo dữ liệu mới nhất
                var slotToUpdate = await _parkingRepository.GetSlotByIdAsync(selectedSlotId);
                if (slotToUpdate == null) throw new KeyNotFoundException("SLOT_NOT_AVAILABLE");

                // KIỂM TRA TRẠNG THÁI NGAY TRONG TRANSACTION (Ngăn chặn Race Condition)
                if (slotToUpdate.Status?.ToUpper() != "AVAILABLE")
                {
                    throw new InvalidOperationException("CONCURRENCY_CONFLICT");
                }

                // Khởi tạo và lưu phiên đỗ xe mới
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

                // Cập nhật trạng thái slot sang OCCUPIED ngay tại đây
                slotToUpdate.Status = "OCCUPIED";
                slotToUpdate.CurrentSessionId = sessionId;
                slotToUpdate.LastUpdated = checkInTime;

                await _parkingRepository.UpdateSlotAsync(slotToUpdate);
            });

            // 4. Trả kết quả dữ liệu đầu ra an toàn
            return MapToCheckInResponseDto(sessionId, checkInTime, dto.LicensePlateIn, selectedSlotId, initialSlotInfo);
        }

        public async Task<CheckOutResponseDto> ProcessCheckOutAsync(VehicleCheckOutDto checkOutDto)
        {
            // 1. Kiểm tra và lấy thông tin session hiện hành
            var session = await _parkingRepository.GetActiveSessionByPlateAsync(checkOutDto.LicensePlateOut);
            if (session == null)
            {
                throw new Exception("INVALID_TICKET");
            }

            // 2. Tính toán thời gian và chi phí trực tiếp (Không còn ép Kind thủ công)
            var checkOutTime = DateTime.Now;
            int durationMinutes = ParkingCalculationHelper.CalculateDurationMinutes(session.CheckInTime, checkOutTime);

            var policy = await _parkingRepository.GetActivePricingPolicyByVehicleTypeAsync(session.VehicleTypeId)
                         ?? throw new Exception("PRICING_POLICY_NOT_CONFIGURED");

            decimal totalFee = ParkingCalculationHelper.CalculateParkingFee(durationMinutes, policy.BasePrice, policy.HourlyRate);

            // 3. Thực hiện cập nhật đồng bộ (Session + Slot) trong một Transaction
            await _parkingRepository.SaveChangesWithTransactionAsync(async () =>
            {
                // A. Cập nhật thông tin session
                UpdateSessionForCheckOut(session, checkOutDto, checkOutTime, durationMinutes, totalFee);
                await _parkingRepository.UpdateSessionAsync(session);

                // B. Giải phóng slot 
                if (!string.IsNullOrEmpty(session.SlotId))
                {
                    var slot = await _parkingRepository.GetSlotByIdAsync(session.SlotId);
                    if (slot != null)
                    {
                        slot.Status = "AVAILABLE";         // Đưa về trạng thái khả dụng
                        slot.CurrentSessionId = null;      // Xóa ID phiên đã kết thúc
                        slot.LastUpdated = checkOutTime;

                        await _parkingRepository.UpdateSlotAsync(slot);
                    }
                }
            });

            return MapToCheckOutResponseDto(session, totalFee, durationMinutes, checkOutTime);
        }

        public async Task<ActiveSessionResponseDto> GetActiveSessionByLicensePlateAsync(string licensePlate)
        {
            var session = await _parkingRepository.GetActiveSessionByPlateAsync(licensePlate)
                          ?? throw new InvalidOperationException("INVALID_TICKET");

            // Tính toán thời gian thực tế trực tiếp với DateTime.Now
            var currentTime = DateTime.Now;
            int durationMinutes = ParkingCalculationHelper.CalculateDurationMinutes(session.CheckInTime, currentTime);

            decimal currentFee = 0;
            var policy = await _parkingRepository.GetActivePricingPolicyByVehicleTypeAsync(session.VehicleTypeId);
            if (policy != null)
            {
                currentFee = ParkingCalculationHelper.CalculateParkingFee(durationMinutes, policy.BasePrice, policy.HourlyRate);
            }

            return MapToActiveSessionResponseDto(session, durationMinutes, currentFee);
        }

        public async Task<PreCheckOutResponseDto> CalculatePreCheckOutFeeAsync(string sessionId)
        {
            var session = await _parkingRepository.GetActiveSessionByIdAsync(sessionId)
                          ?? throw new InvalidOperationException("INVALID_TICKET");

            // Tính toán trực tiếp cực kỳ ngắn gọn
            var currentTime = DateTime.Now;
            int durationMinutes = ParkingCalculationHelper.CalculateDurationMinutes(session.CheckInTime, currentTime);

            int hours = ParkingCalculationHelper.ConvertMinutesToBillingHours(durationMinutes);

            var policy = await _parkingRepository.GetActivePricingPolicyByVehicleTypeAsync(session.VehicleTypeId)
                         ?? throw new InvalidOperationException("PRICING_POLICY_NOT_CONFIGURED");

            decimal totalFee = ParkingCalculationHelper.CalculateParkingFee(durationMinutes, policy.BasePrice, policy.HourlyRate);

            return MapToPreCheckOutResponseDto(session, totalFee, policy, hours);
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

        private PreCheckOutResponseDto MapToPreCheckOutResponseDto(ParkingSession session, decimal fee, PricingPolicy policy, int hours)
        {
            return new PreCheckOutResponseDto
            {
                Success = true,
                Data = new PreCheckOutDataDto
                {
                    SessionId = session.SessionId,
                    CurrentFee = fee,
                    FeeBreakdown = new FeeBreakdownDto
                    {
                        BasePrice = policy.BasePrice,
                        HourlyRate = policy.HourlyRate,
                        Hours = hours,
                        OvernightFee = 0,
                        Total = fee
                    },
                    GracePeriodRemainingSeconds = 300
                }
            };
        }

        #endregion
    }
}