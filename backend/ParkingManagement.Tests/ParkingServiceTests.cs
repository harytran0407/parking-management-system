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
    }
}