using System;
using System.Threading.Tasks;
using Moq;
using Xunit;
using FluentAssertions;
using ParkingManagement.Services;
using ParkingManagement.Repositories;
using ParkingManagement.DTOs;
using ParkingManagement.Models; 

namespace ParkingManagement.Tests
{
    public class ParkingServiceTests
    {
        // Khai báo các đối tượng giả lập (Mock)
        private readonly Mock<IParkingRepository> _mockRepository;
        private readonly ParkingService _parkingService;

        public ParkingServiceTests()
        {
            // 1. Khởi tạo Mock cho Repository
            _mockRepository = new Mock<IParkingRepository>();

            // 2. Tiêm Mock Repository vào Service thực tế cần test
            _parkingService = new ParkingService(_mockRepository.Object);
        }

        // =========================================================================
        // CASE 1: THẤT BẠI - XE ĐÃ CÓ PHIÊN HOẠT ĐỘNG TRONG BÃI (ACTIVE_SESSION_EXISTS)
        // =========================================================================
        [Fact]
        public async Task ProcessWalkInCheckInAsync_ShouldThrowException_WhenVehicleIsAlreadyActive()
        {
            // Arrange (Chuẩn bị)
            var dto = new VehicleCheckInDto { LicensePlateIn = "51H-12345", VehicleTypeId = 1 };

            // Giả lập: Kiểm tra biển số xe -> Trả về true (Xe đang ở trong bãi)
            _mockRepository.Setup(repo => repo.IsVehicleActiveInParkingAsync(dto.LicensePlateIn))
                           .ReturnsAsync(true);

            // Act (Hành động)
            Func<Task> act = async () => await _parkingService.ProcessWalkInCheckInAsync(dto, "usr_001");

            // Assert (Kiểm tra lỗi quăng ra)
            await act.Should().ThrowAsync<InvalidOperationException>()
                     .WithMessage("ACTIVE_SESSION_EXISTS");
        }

        // =========================================================================
        // CASE 2: THÀNH CÔNG - KHÁCH TRUYỀN SẴN SLOT_ID HỢP LỆ
        // =========================================================================
        [Fact]
        public async Task ProcessWalkInCheckInAsync_ShouldReturnSuccessResponse_WhenDataIsValid()
        {
            // Arrange (Chuẩn bị)
            var dto = new VehicleCheckInDto
            {
                LicensePlateIn = "51H-12345",
                VehicleTypeId = 1,
                SlotId = "slt_002"
            };

            // Giả lập 1: Xe chưa có trong bãi (trả về false)
            _mockRepository.Setup(repo => repo.IsVehicleActiveInParkingAsync(dto.LicensePlateIn))
                           .ReturnsAsync(false);

            // Giả lập 2: Tìm thấy vị trí đỗ được chỉ định cụ thể từ client
            var fakeSlot = new ParkingSlot
            {
                SlotId = "slt_002",
                SlotName = "A102",
                Zone = new FloorZone { FloorNumber = 1, ZoneName = "A" }
            };
            _mockRepository.Setup(repo => repo.GetSlotByIdAsync(dto.SlotId))
                           .ReturnsAsync(fakeSlot);

            // Giả lập 3: Thực thi Transaction an toàn cho hàm lưu trữ (Đã fix lỗi biên dịch)
            _mockRepository.Setup(repo => repo.SaveChangesWithTransactionAsync(It.IsAny<Func<Task>>()))
                           .Returns(async (Func<Task> action) => await action());

            // Act (Hành động)
            var result = await _parkingService.ProcessWalkInCheckInAsync(dto, "usr_001");

            // Assert (Kiểm tra dữ liệu phản hồi)
            result.Should().NotBeNull();
            result.Success.Should().BeTrue();
            result.Data.SessionId.Should().StartWith("sess_");
            result.Data.LicensePlateIn.Should().Be("51H-12345");
            result.Data.SlotId.Should().Be("slt_002");
            result.Data.SlotName.Should().Be("A102");
            result.Data.Floor.Should().Be(1);
            result.Data.Zone.Should().Be("A");
            result.Data.Status.Should().Be("ACTIVE");
            result.Data.PaymentStatus.Should().Be("PENDING");
        }

        // =========================================================================
        // CASE 3: THÀNH CÔNG - TỰ ĐỘNG PHÂN BỔ VỊ TRÍ ĐỖ (SMART ALLOCATION) KHI SLOT_ID = NULL
        // =========================================================================
        [Fact]
        public async Task ProcessWalkInCheckInAsync_ShouldAllocateAutomatically_WhenSlotIdIsNullOrEmpty()
        {
            // Arrange (Chuẩn bị DTO không truyền SlotId)
            var dto = new VehicleCheckInDto
            {
                LicensePlateIn = "51H-12345",
                VehicleTypeId = 1,
                SlotId = null
            };

            // Giả lập 1: Xe chưa có trong bãi
            _mockRepository.Setup(repo => repo.IsVehicleActiveInParkingAsync(dto.LicensePlateIn))
                           .ReturnsAsync(false);

            // Giả lập 2: Thuật toán tự động tìm thấy slot 'slt_089' (C045) còn trống cho xe máy
            var allocatedSlot = new ParkingSlot
            {
                SlotId = "slt_089",
                SlotName = "C045",
                Zone = new FloorZone { FloorNumber = 3, ZoneName = "C" }
            };
            _mockRepository.Setup(repo => repo.FindFirstAvailableSlotAsync(dto.VehicleTypeId))
                           .ReturnsAsync(allocatedSlot);

            // Giả lập 3: Hàm nạp lại thông tin slot sau khi gán
            _mockRepository.Setup(repo => repo.GetSlotByIdAsync("slt_089"))
                           .ReturnsAsync(allocatedSlot);

            // Giả lập 4: Xử lý Transaction an toàn
            _mockRepository.Setup(repo => repo.SaveChangesWithTransactionAsync(It.IsAny<Func<Task>>()))
                           .Returns(async (Func<Task> action) => await action());

            // Act (Hành động)
            var result = await _parkingService.ProcessWalkInCheckInAsync(dto, "usr_001");

            // Assert (Kiểm tra xem hệ thống có tự gán đúng mã 'slt_089' không)
            result.Should().NotBeNull();
            result.Success.Should().BeTrue();
            result.Data.SlotId.Should().Be("slt_089");
            result.Data.SlotName.Should().Be("C045");
            result.Data.Floor.Should().Be(3);
            result.Data.Zone.Should().Be("C");

            // Xác thực: Đảm bảo hàm FindFirstAvailableSlotAsync thực sự được gọi kích hoạt 1 lần
            _mockRepository.Verify(repo => repo.FindFirstAvailableSlotAsync(dto.VehicleTypeId), Times.Once);
        }

        // =========================================================================
        // CASE 4: THẤT BẠI - BÃI XE ĐÃ ĐẦY VỊ TRÍ TRỐNG (NO_AVAILABLE_SLOT)
        // =========================================================================
        [Fact]
        public async Task ProcessWalkInCheckInAsync_ShouldThrowException_WhenNoSlotsAreAvailable()
        {
            // Arrange (Chuẩn bị DTO yêu cầu tự động tìm slot)
            var dto = new VehicleCheckInDto { LicensePlateIn = "51H-12345", VehicleTypeId = 1, SlotId = null };

            // Giả lập 1: Xe chưa có trong bãi
            _mockRepository.Setup(repo => repo.IsVehicleActiveInParkingAsync(dto.LicensePlateIn))
                           .ReturnsAsync(false);

            // Giả lập 2: Hệ thống quét bãi xe và trả về null (Đã hết vị trí đỗ phù hợp)
            _mockRepository.Setup(repo => repo.FindFirstAvailableSlotAsync(dto.VehicleTypeId))
                           .ReturnsAsync((ParkingSlot?)null);

            // Act (Hành động)
            Func<Task> act = async () => await _parkingService.ProcessWalkInCheckInAsync(dto, "usr_001");

            // Assert (Kiểm tra quăng ra lỗi hết chỗ đỗ)
            await act.Should().ThrowAsync<InvalidOperationException>()
                     .WithMessage("NO_AVAILABLE_SLOT");
        }

        // =========================================================================
        // CASE 5: THÀNH CÔNG - CHECK-OUT ĐÚNG HẠN, TÍNH TIỀN GIỜ ĐẦU (BASE PRICE)
        // =========================================================================
        [Fact]
        public async Task ProcessCheckOutAsync_ShouldReturnSuccessResponse_WithBasePrice_WhenDurationIsLessThanAnHour()
        {
            // Arrange (Chuẩn bị dữ liệu check-out trong vòng 45 phút)
            var checkOutDto = new VehicleCheckOutDto
            {
                LicensePlateOut = "51H-12345",
                CameraOut = "cam_out_01",
                GateOut = "gate_out_01",
                ImageUrlOut = "/uploads/plates/out_abc.jpg",
                StaffOutId = "usr_001"
            };

            // Giả lập 1: Tìm thấy session đang ACTIVE (Xe vào cách đây 45 phút)
            var fakeSession = new ParkingSession
            {
                SessionId = "sess_12345",
                LicensePlateIn = "51H-12345",
                CheckInTime = DateTime.UtcNow.AddMinutes(-45), // 45 phút trước
                SlotId = "slt_002",
                Status = "ACTIVE"
            };
            _mockRepository.Setup(repo => repo.GetActiveSessionByPlateAsync(checkOutDto.LicensePlateOut))
                           .ReturnsAsync(fakeSession);

            // Giả lập 2: Lấy bảng giá từ DB (Giá gốc: 20k, Mỗi giờ tiếp theo: 10k)
            var fakePolicy = new PricingPolicy
            {
                BasePrice = 20000,
                HourlyRate = 10000,
                EffectiveDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1))
            };
            _mockRepository.Setup(repo => repo.GetActivePricingPolicyAsync())
                           .ReturnsAsync(fakePolicy);

            // Giả lập 3: Xử lý Transaction cập nhật DB
            _mockRepository.Setup(repo => repo.UpdateSessionAndSlotAsync(It.IsAny<ParkingSession>(), It.IsAny<string>()))
                           .ReturnsAsync(true);

            // Act (Hành động)
            var result = await _parkingService.ProcessCheckOutAsync(checkOutDto);

            // Assert (Kiểm tra kết quả - Dưới 1 tiếng phải tính bằng Base Price)
            result.Should().NotBeNull();
            result.SessionId.Should().Be("sess_12345");
            result.DurationMinutes.Should().BeInRange(44, 46); // Cho phép sai lệch nhẹ mili-giây lúc chạy test
            result.TotalFee.Should().Be(20000); // 20k tiền gốc
            result.Status.Should().Be("COMPLETED");
            result.PaymentStatus.Should().Be("PAID");
        }

        // =========================================================================
        // CASE 6: THÀNH CÔNG - TÍNH LŨY TIẾN THEO GIỜ THỰC TẾ (LÀM TRÒN LÊN BLOCK GIỜ)
        // =========================================================================
        [Fact]
        public async Task ProcessCheckOutAsync_ShouldCalculateFeeCorrectly_WhenDurationIsOverOneHour()
        {
            // Arrange (Chuẩn bị dữ liệu đỗ xe trong 2 tiếng 15 phút -> Tính 3 tiếng)
            var checkOutDto = new VehicleCheckOutDto
            {
                LicensePlateOut = "51H-12345",
                CameraOut = "cam_out_01",
                GateOut = "gate_out_01",
                StaffOutId = "usr_001"
            };

            var fakeSession = new ParkingSession
            {
                SessionId = "sess_99999",
                LicensePlateIn = "51H-12345",
                CheckInTime = DateTime.UtcNow.AddMinutes(-135), // 2 tiếng 15 phút trước
                SlotId = "slt_002",
                Status = "ACTIVE"
            };
            _mockRepository.Setup(repo => repo.GetActiveSessionByPlateAsync(checkOutDto.LicensePlateOut))
                           .ReturnsAsync(fakeSession);

            var fakePolicy = new PricingPolicy
            {
                BasePrice = 20000,   // Giờ đầu 20k
                HourlyRate = 10000,  // Các giờ tiếp theo +10k
                EffectiveDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1))
            };
            _mockRepository.Setup(repo => repo.GetActivePricingPolicyAsync())
                           .ReturnsAsync(fakePolicy);

            _mockRepository.Setup(repo => repo.UpdateSessionAndSlotAsync(It.IsAny<ParkingSession>(), It.IsAny<string>()))
                           .ReturnsAsync(true);

            // Act
            var result = await _parkingService.ProcessCheckOutAsync(checkOutDto);

            // Assert (135 phút = 2 giờ 15 phút -> Làm tròn lên 3 giờ. Tiền = 20k + 10k + 10k = 40k)
            result.TotalFee.Should().Be(40000);
            result.DurationMinutes.Should().BeInRange(134, 136);
        }

        // =========================================================================
        // CASE 7: THẤT BẠI - XE KHÔNG CÓ TRONG BÃI HOẶC ĐÃ CHECK-OUT RỒI
        // =========================================================================
        [Fact]
        public async Task ProcessCheckOutAsync_ShouldThrowException_WhenNoActiveSessionFound()
        {
            // Arrange
            var checkOutDto = new VehicleCheckOutDto { LicensePlateOut = "51H-INVALID", CameraOut = "cam_01", GateOut = "g_01", StaffOutId = "u_01" };

            // Giả lập không tìm thấy lượt xe đỗ nào có trạng thái ACTIVE
            _mockRepository.Setup(repo => repo.GetActiveSessionByPlateAsync(checkOutDto.LicensePlateOut))
                           .ReturnsAsync((ParkingSession?)null);

            // Act
            Func<Task> act = async () => await _parkingService.ProcessCheckOutAsync(checkOutDto);

            // Assert
            await act.Should().ThrowAsync<Exception>()
                     .WithMessage("Không tìm thấy lượt đỗ ACTIVE nào cho xe này.");
        }

        // =========================================================================
        // CASE 8: THẤT BẠI - HỆ THỐNG CHƯA CÀI ĐẶT BẢNG GIÁ (PRICING POLICY NULL)
        // =========================================================================
        [Fact]
        public async Task ProcessCheckOutAsync_ShouldThrowException_WhenPricingPolicyIsMissing()
        {
            // Arrange
            var checkOutDto = new VehicleCheckOutDto { LicensePlateOut = "51H-12345", CameraOut = "cam_01", GateOut = "g_01", StaffOutId = "u_01" };

            var fakeSession = new ParkingSession
            {
                SessionId = "sess_123",
                LicensePlateIn = "51H-12345",
                CheckInTime = DateTime.UtcNow.AddHours(-1),
                SlotId = "slt_002",
                Status = "ACTIVE"
            };
            _mockRepository.Setup(repo => repo.GetActiveSessionByPlateAsync(checkOutDto.LicensePlateOut))
                           .ReturnsAsync(fakeSession);

            // Giả lập DB trống, chưa được cấu hình bảng giá nào cả
            _mockRepository.Setup(repo => repo.GetActivePricingPolicyAsync())
                           .ReturnsAsync((PricingPolicy?)null);

            // Act
            Func<Task> act = async () => await _parkingService.ProcessCheckOutAsync(checkOutDto);

            // Assert
            await act.Should().ThrowAsync<Exception>()
                     .WithMessage("Chính sách giá chưa được cấu hình.");
        }
    }
}