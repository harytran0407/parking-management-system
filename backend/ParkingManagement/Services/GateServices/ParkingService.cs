using System;
using System.Threading.Tasks;
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
            // 1. Kiểm tra điều kiện tiên quyết
            if (await _parkingRepository.IsVehicleActiveInParkingAsync(dto.LicensePlateIn))
            {
                throw new InvalidOperationException("ACTIVE_SESSION_EXISTS");
            }

            // 2. Định vị vị trí đỗ (Điều hướng Allocation)
            string selectedSlotId = await ResolveSlotIdAsync(dto.SlotId, dto.VehicleTypeId);

            // 3. Khởi tạo phiên
            string sessionId = GenerateSessionId();
            DateTime checkInTime = DateTime.Now;

            // 4. Lưu dữ liệu đồng bộ qua Transaction
            await ExecuteCheckInTransactionAsync(sessionId, checkInTime, dto, selectedSlotId, staffId);

            // 5. Lấy thông tin bổ sung & Map dữ liệu đầu ra
            var slotInfo = await _parkingRepository.GetSlotByIdAsync(selectedSlotId);
            return MapToCheckInResponseDto(sessionId, checkInTime, dto.LicensePlateIn, selectedSlotId, slotInfo);
        }

        public async Task<CheckOutResponseDto> ProcessCheckOutAsync(VehicleCheckOutDto checkOutDto)
        {
            // 1. Kiểm tra và lấy thông tin session hiện hành
            var session = await _parkingRepository.GetActiveSessionByPlateAsync(checkOutDto.LicensePlateOut);
            if (session == null)
            {
                throw new Exception("Không tìm thấy lượt đỗ ACTIVE nào cho xe này.");
            }

            // 2. Tính toán thời gian và chi phí thông qua Helper (Đã tách SOLID)
            var checkOutTime = DateTime.UtcNow;
            int durationMinutes = ParkingCalculationHelper.CalculateDurationMinutes(session.CheckInTime, checkOutTime);

            var policy = await _parkingRepository.GetActivePricingPolicyAsync()
                         ?? throw new Exception("Chính sách giá chưa được cấu hình.");

            decimal totalFee = ParkingCalculationHelper.CalculateParkingFee(durationMinutes, policy.BasePrice, policy.HourlyRate);

            // 3. Cập nhật dữ liệu Entity
            UpdateSessionForCheckOut(session, checkOutDto, checkOutTime, durationMinutes, totalFee);
            await _parkingRepository.UpdateSessionAndSlotAsync(session, session.SlotId ?? string.Empty);

            // 4. Trả kết quả dữ liệu đầu ra
            return MapToCheckOutResponseDto(session, totalFee, durationMinutes, checkOutTime);
        }

        public async Task<ActiveSessionResponseDto> GetActiveSessionByLicensePlateAsync(string licensePlate)
        {
            var session = await _parkingRepository.GetActiveSessionByPlateAsync(licensePlate)
                          ?? throw new InvalidOperationException("ACTIVE_SESSION_NOT_FOUND");

            var currentTime = DateTime.UtcNow;
            int durationMinutes = ParkingCalculationHelper.CalculateDurationMinutes(session.CheckInTime, currentTime);

            decimal currentFee = 0;
            var policy = await _parkingRepository.GetActivePricingPolicyAsync();
            if (policy != null)
            {
                currentFee = ParkingCalculationHelper.CalculateParkingFee(durationMinutes, policy.BasePrice, policy.HourlyRate);
            }

            return MapToActiveSessionResponseDto(session, durationMinutes, currentFee);
        }

        public async Task<PreCheckOutResponseDto> CalculatePreCheckOutFeeAsync(string sessionId)
        {
            var session = await _parkingRepository.GetActiveSessionByIdAsync(sessionId)
                          ?? throw new InvalidOperationException("SESSION_NOT_FOUND_OR_INACTIVE");

            int durationMinutes = ParkingCalculationHelper.CalculateDurationMinutes(session.CheckInTime, DateTime.UtcNow);
            int hours = ParkingCalculationHelper.ConvertMinutesToBillingHours(durationMinutes);

            var policy = await _parkingRepository.GetActivePricingPolicyAsync()
                         ?? throw new InvalidOperationException("PRICING_POLICY_NOT_CONFIGURED");

            decimal totalFee = ParkingCalculationHelper.CalculateParkingFee(durationMinutes, policy.BasePrice, policy.HourlyRate);

            return MapToPreCheckOutResponseDto(session, totalFee, policy, hours);
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

        private async Task ExecuteCheckInTransactionAsync(string sessionId, DateTime checkInTime, VehicleCheckInDto dto, string slotId, string staffId)
        {
            await _parkingRepository.SaveChangesWithTransactionAsync(async () =>
            {
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
                    SlotId = slotId,
                    BookingId = dto.BookingId,
                    Status = "ACTIVE",
                    PaymentStatus = "PENDING"
                };
                await _parkingRepository.CreateSessionAsync(session);

                var slotToUpdate = await _parkingRepository.GetSlotByIdAsync(slotId);
                if (slotToUpdate != null)
                {
                    slotToUpdate.Status = "OCCUPIED";
                    slotToUpdate.CurrentSessionId = sessionId;
                    slotToUpdate.LastUpdated = checkInTime;
                }
            });
        }

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
                CheckInTime = session.CheckInTime ?? DateTime.UtcNow,
                CheckOutTime = session.CheckOutTime ?? checkOutTime,
                DurationMinutes = session.DurationMinutes ?? duration,
                Status = session.Status ?? "COMPLETED",
                TotalFee = session.TotalFee ?? fee,
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
                    CheckInTime = session.CheckInTime ?? DateTime.UtcNow,
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