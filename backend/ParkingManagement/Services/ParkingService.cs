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
    }
}