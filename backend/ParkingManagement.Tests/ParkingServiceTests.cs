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
        private readonly Mock<IParkingRepository> _mockRepository;
        private readonly ParkingService _parkingService;

        public ParkingServiceTests()
        {
            _mockRepository = new Mock<IParkingRepository>();
            _parkingService = new ParkingService(_mockRepository.Object);
        }

        // =========================================================================
        // CASE 1: THẤT BẠI - XE ĐÃ CÓ PHIÊN HOẠT ĐỘNG TRONG BÃI (ACTIVE_SESSION_EXISTS)
        // =========================================================================
        [Fact]
        public async Task ProcessWalkInCheckInAsync_ShouldThrowException_WhenVehicleIsAlreadyActive()
        {
            var dto = new VehicleCheckInDto { LicensePlateIn = "51H-12345", VehicleTypeId = 1 };

            _mockRepository.Setup(repo => repo.IsVehicleActiveInParkingAsync(dto.LicensePlateIn))
                           .ReturnsAsync(true);

            Func<Task> act = async () => await _parkingService.ProcessWalkInCheckInAsync(dto, "usr_001");

            await act.Should().ThrowAsync<InvalidOperationException>()
                     .WithMessage("ACTIVE_SESSION_EXISTS");
        }

        // =========================================================================
        // CASE 2: THÀNH CÔNG - KHÁCH TRUYỀN SẴN SLOT_ID HỢP LỆ
        // =========================================================================
        [Fact]
        public async Task ProcessWalkInCheckInAsync_ShouldReturnSuccessResponse_WhenDataIsValid()
        {
            var dto = new VehicleCheckInDto
            {
                LicensePlateIn = "51H-12345",
                VehicleTypeId = 1,
                SlotId = "slt_002"
            };

            _mockRepository.Setup(repo => repo.IsVehicleActiveInParkingAsync(dto.LicensePlateIn))
                           .ReturnsAsync(false);

            var fakeSlot = new ParkingSlot
            {
                SlotId = "slt_002",
                SlotName = "A102",
                Zone = new FloorZone { FloorNumber = 1, ZoneName = "A" }
            };
            _mockRepository.Setup(repo => repo.GetSlotByIdAsync(dto.SlotId))
                           .ReturnsAsync(fakeSlot);

            _mockRepository.Setup(repo => repo.SaveChangesWithTransactionAsync(It.IsAny<Func<Task>>()))
                           .Returns(async (Func<Task> action) => await action());

            var result = await _parkingService.ProcessWalkInCheckInAsync(dto, "usr_001");

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
            var dto = new VehicleCheckInDto
            {
                LicensePlateIn = "51H-12345",
                VehicleTypeId = 1,
                SlotId = null
            };

            _mockRepository.Setup(repo => repo.IsVehicleActiveInParkingAsync(dto.LicensePlateIn))
                           .ReturnsAsync(false);

            var allocatedSlot = new ParkingSlot
            {
                SlotId = "slt_089",
                SlotName = "C045",
                Zone = new FloorZone { FloorNumber = 3, ZoneName = "C" }
            };
            _mockRepository.Setup(repo => repo.FindFirstAvailableSlotAsync(dto.VehicleTypeId))
                           .ReturnsAsync(allocatedSlot);

            _mockRepository.Setup(repo => repo.GetSlotByIdAsync("slt_089"))
                           .ReturnsAsync(allocatedSlot);

            _mockRepository.Setup(repo => repo.SaveChangesWithTransactionAsync(It.IsAny<Func<Task>>()))
                           .Returns(async (Func<Task> action) => await action());

            var result = await _parkingService.ProcessWalkInCheckInAsync(dto, "usr_001");

            result.Should().NotBeNull();
            result.Success.Should().BeTrue();
            result.Data.SlotId.Should().Be("slt_089");
            result.Data.SlotName.Should().Be("C045");
            result.Data.Floor.Should().Be(3);
            result.Data.Zone.Should().Be("C");

            _mockRepository.Verify(repo => repo.FindFirstAvailableSlotAsync(dto.VehicleTypeId), Times.Once);
        }

        // =========================================================================
        // CASE 4: THẤT BẠI - BÃI XE ĐÃ ĐẦY VỊ TRÍ TRỐNG (NO_AVAILABLE_SLOT)
        // =========================================================================
        [Fact]
        public async Task ProcessWalkInCheckInAsync_ShouldThrowException_WhenNoSlotsAreAvailable()
        {
            var dto = new VehicleCheckInDto { LicensePlateIn = "51H-12345", VehicleTypeId = 1, SlotId = null };

            _mockRepository.Setup(repo => repo.IsVehicleActiveInParkingAsync(dto.LicensePlateIn))
                           .ReturnsAsync(false);

            _mockRepository.Setup(repo => repo.FindFirstAvailableSlotAsync(dto.VehicleTypeId))
                           .ReturnsAsync(default(ParkingSlot));

            Func<Task> act = async () => await _parkingService.ProcessWalkInCheckInAsync(dto, "usr_001");

            await act.Should().ThrowAsync<InvalidOperationException>()
                     .WithMessage("NO_AVAILABLE_SLOT");
        }

        // =========================================================================
        // CASE 5: THÀNH CÔNG - CHECK-OUT ĐÚNG HẠN, TÍNH TIỀN GIỜ ĐẦU (BASE PRICE)
        // =========================================================================
        [Fact]
        public async Task ProcessCheckOutAsync_ShouldReturnSuccessResponse_WithBasePrice_WhenDurationIsLessThanAnHour()
        {
            var checkOutDto = new VehicleCheckOutDto
            {
                LicensePlateOut = "51H-12345",
                CameraOut = "cam_out_01",
                GateOut = "gate_out_01",
                ImageUrlOut = "/uploads/plates/out_abc.jpg",
                StaffOutId = "usr_001"
            };

            var fakeSession = new ParkingSession
            {
                SessionId = "sess_12345",
                LicensePlateIn = "51H-12345",
                CheckInTime = DateTime.UtcNow.AddMinutes(-45),
                SlotId = "slt_002",
                Status = "ACTIVE",
                VehicleTypeId = 1
            };
            _mockRepository.Setup(repo => repo.GetActiveSessionByPlateAsync(checkOutDto.LicensePlateOut))
                           .ReturnsAsync(fakeSession);

            var fakePolicy = new PricingPolicy
            {
                BasePrice = 20000,
                HourlyRate = 10000,
                VehicleTypeId = 1,
                EffectiveDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1))
            };
            _mockRepository.Setup(repo => repo.GetActivePricingPolicyAsync())
                           .ReturnsAsync(fakePolicy);

            _mockRepository.Setup(repo => repo.UpdateSessionAndSlotAsync(It.IsAny<ParkingSession>(), It.IsAny<string>()))
                           .ReturnsAsync(true);

            var result = await _parkingService.ProcessCheckOutAsync(checkOutDto);

            result.Should().NotBeNull();
            result.SessionId.Should().Be("sess_12345");
            result.DurationMinutes.Should().BeInRange(44, 46);
            result.TotalFee.Should().Be(20000);
            result.Status.Should().Be("COMPLETED");
            result.PaymentStatus.Should().Be("PAID");
        }

        // =========================================================================
        // CASE 6: THÀNH CÔNG - TÍNH LŨY TIẾN THEO GIỜ THỰC TẾ (LÀM TRÒN LÊN BLOCK GIỜ)
        // =========================================================================
        [Fact]
        public async Task ProcessCheckOutAsync_ShouldCalculateFeeCorrectly_WhenDurationIsOverOneHour()
        {
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
                CheckInTime = DateTime.UtcNow.AddMinutes(-135),
                SlotId = "slt_002",
                Status = "ACTIVE",
                VehicleTypeId = 1
            };
            _mockRepository.Setup(repo => repo.GetActiveSessionByPlateAsync(checkOutDto.LicensePlateOut))
                           .ReturnsAsync(fakeSession);

            var fakePolicy = new PricingPolicy
            {
                BasePrice = 20000,
                HourlyRate = 10000,
                VehicleTypeId = 1,
                EffectiveDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1))
            };
            _mockRepository.Setup(repo => repo.GetActivePricingPolicyAsync())
                           .ReturnsAsync(fakePolicy);

            _mockRepository.Setup(repo => repo.UpdateSessionAndSlotAsync(It.IsAny<ParkingSession>(), It.IsAny<string>()))
                           .ReturnsAsync(true);

            var result = await _parkingService.ProcessCheckOutAsync(checkOutDto);

            result.TotalFee.Should().Be(40000);
            result.DurationMinutes.Should().BeInRange(134, 136);
        }

        // =========================================================================
        // CASE 7: THẤT BẠI - XE KHÔNG CÓ TRONG BÃI HOẶC ĐÃ CHECK-OUT RỒI
        // =========================================================================
        [Fact]
        public async Task ProcessCheckOutAsync_ShouldThrowException_WhenNoActiveSessionFound()
        {
            var checkOutDto = new VehicleCheckOutDto { LicensePlateOut = "51H-INVALID", CameraOut = "cam_01", GateOut = "g_01", StaffOutId = "u_01" };

            _mockRepository.Setup(repo => repo.GetActiveSessionByPlateAsync(checkOutDto.LicensePlateOut))
                           .ReturnsAsync(default(ParkingSession));

            Func<Task> act = async () => await _parkingService.ProcessCheckOutAsync(checkOutDto);

            await act.Should().ThrowAsync<Exception>()
                     .WithMessage("Không tìm thấy lượt đỗ ACTIVE nào cho xe này.");
        }

        // =========================================================================
        // CASE 8: THẤT BẠI - HỆ THỐNG CHƯA CÀI ĐẶT BẢNG GIÁ (PRICING POLICY NULL)
        // =========================================================================
        [Fact]
        public async Task ProcessCheckOutAsync_ShouldThrowException_WhenPricingPolicyIsMissing()
        {
            var checkOutDto = new VehicleCheckOutDto { LicensePlateOut = "51H-12345", CameraOut = "cam_01", GateOut = "g_01", StaffOutId = "u_01" };

            var fakeSession = new ParkingSession
            {
                SessionId = "sess_123",
                LicensePlateIn = "51H-12345",
                CheckInTime = DateTime.UtcNow.AddHours(-1),
                SlotId = "slt_002",
                Status = "ACTIVE",
                VehicleTypeId = 1
            };
            _mockRepository.Setup(repo => repo.GetActiveSessionByPlateAsync(checkOutDto.LicensePlateOut))
                           .ReturnsAsync(fakeSession);

            _mockRepository.Setup(repo => repo.GetActivePricingPolicyAsync())
                           .ReturnsAsync(default(PricingPolicy));

            Func<Task> act = async () => await _parkingService.ProcessCheckOutAsync(checkOutDto);

            await act.Should().ThrowAsync<Exception>()
                     .WithMessage("Chính sách giá chưa được cấu hình.");
        }

        // =========================================================================
        // CASE 9: [API 5.3] THÀNH CÔNG - TRA CỨU XE ĐANG ĐỖ BẰNG BIỂN SỐ 
        // =========================================================================
        [Fact]
        public async Task CASE_1_GetActiveSessionAsync_ShouldReturnDetails_WhenSessionIsActive()
        {
            string licensePlate = "51H-12345";
            var fakeSession = new ParkingSession
            {
                SessionId = "sess_12345",
                LicensePlateIn = licensePlate,
                CheckInTime = DateTime.UtcNow.AddMinutes(-45),
                SlotId = "slt_089",
                Status = "ACTIVE",
                VehicleTypeId = 1
            };

            var fakePolicy = new PricingPolicy { BasePrice = 15000, HourlyRate = 10000, VehicleTypeId = 1 };

            _mockRepository.Setup(repo => repo.GetActiveSessionByPlateAsync(licensePlate)).ReturnsAsync(fakeSession);
            _mockRepository.Setup(repo => repo.GetActivePricingPolicyAsync()).ReturnsAsync(fakePolicy);

            var result = await _parkingService.GetActiveSessionByLicensePlateAsync(licensePlate);

            result.Should().NotBeNull();
            result.Success.Should().BeTrue();
            result.Data.SessionId.Should().Be("sess_12345");
            result.Data.CurrentFee.Should().Be(15000);
        }

        // =========================================================================
        // CASE 10: [API 5.3] THẤT BẠI - BIỂN SỐ XE KHÔNG CÓ TRONG BÃI HOẶC ĐÃ RA RỒI
        // =========================================================================
        [Fact]
        public async Task CASE_2_GetActiveSessionAsync_ShouldReturnFalse_WhenNoActiveSessionFound()
        {
            // Arrange
            string licensePlate = "51H-99999";
            _mockRepository.Setup(repo => repo.GetActiveSessionByPlateAsync(licensePlate))
                           .ReturnsAsync(default(ParkingSession));

            // Act
            Func<Task> act = async () => await _parkingService.GetActiveSessionByLicensePlateAsync(licensePlate);

            // Assert: Đồng bộ hóa kỳ vọng với việc ném ngoại lệ InvalidOperationException từ Service thực tế của bạn
            await act.Should().ThrowAsync<InvalidOperationException>()
                     .WithMessage("ACTIVE_SESSION_NOT_FOUND");
        }

        // =========================================================================
        // CASE 11: [API 5.4] THÀNH CÔNG - TÍNH TRƯỚC TIỀN VÀ TRẢ VỀ CHI TIẾT FEE BREAKDOWN
        // =========================================================================
        [Fact]
        public async Task CASE_3_CalculateFeeAsync_ShouldReturnCorrectBreakdown_ForTwoHours()
        {
            // Arrange (Giả lập xe đỗ đúng 2 tiếng = 120 phút)
            string sessionId = "sess_12345";
            var fakeSession = new ParkingSession
            {
                SessionId = sessionId,
                CheckInTime = DateTime.UtcNow.AddHours(-2),
                VehicleTypeId = 1,
                Status = "ACTIVE"
            };
            var fakePolicy = new PricingPolicy { BasePrice = 15000, HourlyRate = 10000, VehicleTypeId = 1 };

            _mockRepository.Setup(repo => repo.GetActiveSessionByIdAsync(sessionId)).ReturnsAsync(fakeSession);
            _mockRepository.Setup(repo => repo.GetActivePricingPolicyAsync()).ReturnsAsync(fakePolicy);

            // Act
            var result = await _parkingService.CalculatePreCheckOutFeeAsync(sessionId);

            // Assert
            result.Success.Should().BeTrue();
            result.Data.CurrentFee.Should().Be(25000);
            result.Data.FeeBreakdown.Hours.Should().Be(2);
            result.Data.FeeBreakdown.BasePrice.Should().Be(15000);
            result.Data.FeeBreakdown.Total.Should().Be(25000);
        }
    }
}