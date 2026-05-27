using System;
using System.Threading.Tasks;
using ParkingManagement.DTOs;
using ParkingManagement.Models;
using ParkingManagement.Repositories;

namespace ParkingManagement.Services
{
    /// <summary>
    /// Lớp thực thi (Implementation) cụ thể cho các nghiệp vụ đã cam kết ở IParkingService.
    /// </summary>
    public class ParkingService : IParkingService
    {
        // Khai báo thuộc tính kết nối dữ liệu xuống tầng cơ sở dữ liệu
        private readonly IParkingRepository _parkingRepository;

        /// <summary>
        /// Hàm khởi tạo nhận thực thể Repository thông qua cơ chế Dependency Injection (DI)
        /// </summary>
        public ParkingService(IParkingRepository parkingRepository)
        {
            _parkingRepository = parkingRepository;
        }

        /// <summary>
        /// Triển khai chi tiết luồng nghiệp vụ Check-in xe vào bãi
        /// </summary>
        public async Task<CheckInResponseDto> ProcessWalkInCheckInAsync(VehicleCheckInDto dto, string staffId)
        {
            // 1. KIỂM TRA ĐIỀU KIỆN TIÊN QUYẾT: Tránh xe bị trùng biển số đang hoạt động trong bãi
            if (await _parkingRepository.IsVehicleActiveInParkingAsync(dto.LicensePlateIn))
            {
                throw new InvalidOperationException("ACTIVE_SESSION_EXISTS");
            }

            // 2. XỬ LÝ VỊ TRÍ ĐỖ: Sử dụng mã vị trí truyền lên hoặc kích hoạt Smart Allocation tự động tìm slot trống
            string selectedSlotId = dto.SlotId!;
            if (string.IsNullOrEmpty(selectedSlotId))
            {
                var availableSlot = await _parkingRepository.FindFirstAvailableSlotAsync(dto.VehicleTypeId);
                if (availableSlot == null)
                {
                    throw new InvalidOperationException("NO_AVAILABLE_SLOT");
                }
                selectedSlotId = availableSlot.SlotId;
            }

            // 3. SINH DỮ LIỆU ĐỊNH DANH: Khởi tạo mã phiên dạng "sess_" và lấy mốc thời gian thực tế
            string sessionId = "sess_" + Guid.NewGuid().ToString("N").Substring(0, 10).ToLower();
            DateTime checkInTime = DateTime.Now;

            // 4. THỰC THI TRANSACTION ĐỒNG BỘ: Tạo mới phiên xe và ép trạng thái ô đỗ sang 'OCCUPIED'
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
                    SlotId = selectedSlotId,
                    BookingId = dto.BookingId,
                    Status = "ACTIVE",
                    PaymentStatus = "PENDING"
                };
                await _parkingRepository.CreateSessionAsync(session);

                var slotToUpdate = await _parkingRepository.GetSlotByIdAsync(selectedSlotId);
                if (slotToUpdate != null)
                {
                    slotToUpdate.Status = "OCCUPIED";
                    slotToUpdate.CurrentSessionId = sessionId;
                    slotToUpdate.LastUpdated = checkInTime;
                }
            });

            // 5. TRUY VẤN MỞ RỘNG: Lấy dữ liệu tầng (Floor) và khu vực (Zone) từ liên kết bảng để đổ ra Response
            var slotInfo = await _parkingRepository.GetSlotByIdAsync(selectedSlotId);
            int floorNumber = slotInfo?.Zone?.FloorNumber ?? 1;
            string zoneName = slotInfo?.Zone?.ZoneName ?? "A";

            // 6. ĐÓNG GÓI KẾT QUẢ: Trả về DTO cấu trúc chuẩn khớp hoàn toàn với tài liệu thiết kế API
            return new CheckInResponseDto
            {
                Success = true,
                Data = new CheckInResultDataDto
                {
                    SessionId = sessionId,
                    LicensePlateIn = dto.LicensePlateIn,
                    SlotId = selectedSlotId,
                    SlotName = slotInfo?.SlotName ?? "N/A",
                    Floor = floorNumber,
                    Zone = zoneName,
                    CheckInTime = checkInTime,
                    Status = "ACTIVE",
                    PaymentStatus = "PENDING"
                }
            };
        }

        public async Task<CheckOutResponseDto> ProcessCheckOutAsync(VehicleCheckOutDto checkOutDto)
        {
            // 1. Kiểm tra lượt đỗ ACTIVE
            var session = await _parkingRepository.GetActiveSessionByPlateAsync(checkOutDto.LicensePlateOut);
            if (session == null)
            {
                throw new Exception("Không tìm thấy lượt đỗ ACTIVE nào cho xe này.");
            }

            // 2. Tính toán thời gian thực tế
            // SỬA LỖI: Do CheckInTime trong DB có thể là Nullable, dùng ?? để fallback nếu null
            var checkInTime = session.CheckInTime ?? DateTime.UtcNow;
            var checkOutTime = DateTime.UtcNow;

            var duration = checkOutTime - checkInTime;

            // SỬA LỖI: Dùng .TotalMinutes trực tiếp từ biến duration (Kiểu TimeSpan không có dấu ?)
            int durationMinutes = (int)Math.Max(0, duration.TotalMinutes);

            // 3. Lấy bảng giá từ Database
            var policy = await _parkingRepository.GetActivePricingPolicyAsync();
            if (policy == null)
            {
                throw new Exception("Chính sách giá (pricing_policy) chưa được cấu hình.");
            }

            // 4. Tính tiền theo block giờ dựa trên cấu trúc bảng thực tế của bạn
            // SỬA LỖI: Đổi BaseRateFirstHour -> BasePrice, HourlyRateAfter -> HourlyRate
            decimal totalFee = CalculateFee(durationMinutes, policy.BasePrice, policy.HourlyRate);

            // 5. Gán dữ liệu check-out vào Entity
            session.LicensePlateOut = checkOutDto.LicensePlateOut;
            session.CameraOut = checkOutDto.CameraOut;
            session.GateOut = checkOutDto.GateOut;
            session.ImageUrlOut = checkOutDto.ImageUrlOut;
            session.StaffOutId = checkOutDto.StaffOutId;
            session.CheckOutTime = checkOutTime;
            session.DurationMinutes = durationMinutes;
            session.TotalFee = totalFee;
            session.Status = "COMPLETED";
            session.PaymentStatus = "PAID";

            // SỬA LỖI / WARNING: Ép kiểu hoặc fallback khi SlotId bị null để tránh Warning CS8604
            string slotIdParam = session.SlotId ?? string.Empty;
            await _parkingRepository.UpdateSessionAndSlotAsync(session, slotIdParam);

            // 6. Map dữ liệu sang DTO trả về
            // SỬA LỖI: Thêm dấu .Value hoặc ?? để ép kiểu từ dữ liệu Nullable (?, decimal?) sang kiểu dữ liệu thường
            return new CheckOutResponseDto
            {
                // SỬA LỖI: Đổi session.Id -> session.SessionId theo chuẩn DB của bạn
                SessionId = session.SessionId,
                LicensePlateIn = session.LicensePlateIn ?? string.Empty,
                CheckInTime = session.CheckInTime ?? checkInTime,
                CheckOutTime = session.CheckOutTime ?? checkOutTime,
                DurationMinutes = session.DurationMinutes ?? durationMinutes,
                Status = session.Status ?? "COMPLETED",
                TotalFee = session.TotalFee ?? totalFee,
                PaymentStatus = session.PaymentStatus ?? "PAID"
            };
        }

        // SỬA LỖI: Đồng bộ kiểu dữ liệu decimal nhận từ PRICING_POLICY
        private decimal CalculateFee(int minutes, decimal baseRate, decimal hourlyRate)
        {
            if (minutes <= 0) return 0;

            int hours = (int)Math.Ceiling(minutes / 60.0);

            if (hours <= 1)
            {
                return baseRate;
            }

            return baseRate + ((hours - 1) * hourlyRate);
        }
    }
}