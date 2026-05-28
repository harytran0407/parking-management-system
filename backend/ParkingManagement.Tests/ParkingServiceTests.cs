using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using Moq;
using Xunit;
using ParkingManagement.DTOs;
using ParkingManagement.Models;
using ParkingManagement.Repositories;
using ParkingManagement.Services;

namespace ParkingManagement.Tests.Services
{
    public class ParkingServiceTests
    {
        private readonly Mock<IParkingRepository> _parkingRepositoryMock;
        private readonly ParkingService _parkingService;

        public ParkingServiceTests()
        {
            _parkingRepositoryMock = new Mock<IParkingRepository>();
            _parkingService = new ParkingService(_parkingRepositoryMock.Object);

            // Giả lập hàm bọc Transaction thực thi Action truyền vào ngay lập tức để phục vụ kiểm thử đơn vị
            _parkingRepositoryMock
                .Setup(r => r.SaveChangesWithTransactionAsync(It.IsAny<Func<Task>>()))
                .Returns((Func<Task> action) => action?.Invoke() ?? Task.CompletedTask);
        }

        #region PHẦN 1: PROCESS WALK-IN CHECK-IN (6 TEST CASES)

        // TC-01: Check-in thành công với Slot được chỉ định sẵn đang AVAILABLE
        [Fact]
        public async Task ProcessWalkInCheckIn_WithSpecifiedValidSlot_ReturnsSuccess()
        {
            // Arrange
            var dto = new VehicleCheckInDto { LicensePlateIn = "51G-12345", SlotId = "SLOT-A1", VehicleTypeId = 1 };
            var slot = new ParkingSlot { SlotId = "SLOT-A1", Status = "AVAILABLE", SlotName = "A1" };

            _parkingRepositoryMock.Setup(r => r.IsVehicleActiveInParkingAsync(dto.LicensePlateIn)).ReturnsAsync(false);
            _parkingRepositoryMock.Setup(r => r.GetSlotByIdAsync(dto.SlotId)).ReturnsAsync(slot);

            // Act
            var result = await _parkingService.ProcessWalkInCheckInAsync(dto, "STAFF-01");

            // Assert
            Assert.True(result.Success);
            Assert.Equal("ACTIVE", result.Data.Status);
            Assert.Equal("SLOT-A1", result.Data.SlotId);
            _parkingRepositoryMock.Verify(r => r.CreateSessionAsync(It.IsAny<ParkingSession>()), Times.Once);
            _parkingRepositoryMock.Verify(r => r.UpdateSlotAsync(It.IsAny<ParkingSlot>()), Times.Once);
        }

        // TC-02: Check-in thành công không truyền SlotId (Hệ thống tự động điều phối vị trí trống)
        [Fact]
        public async Task ProcessWalkInCheckIn_NoSlotId_AutoResolvesAvailableSlot()
        {
            // Arrange
            var dto = new VehicleCheckInDto { LicensePlateIn = "51G-12345", SlotId = null, VehicleTypeId = 1 };
            var autoSlot = new ParkingSlot { SlotId = "SLOT-AUTO", Status = "AVAILABLE", SlotName = "Auto-01" };

            _parkingRepositoryMock.Setup(r => r.IsVehicleActiveInParkingAsync(dto.LicensePlateIn)).ReturnsAsync(false);
            _parkingRepositoryMock.Setup(r => r.FindFirstAvailableSlotAsync(dto.VehicleTypeId)).ReturnsAsync(autoSlot);
            _parkingRepositoryMock.Setup(r => r.GetSlotByIdAsync("SLOT-AUTO")).ReturnsAsync(autoSlot);

            // Act
            var result = await _parkingService.ProcessWalkInCheckInAsync(dto, "STAFF-01");

            // Assert
            Assert.True(result.Success);
            Assert.Equal("SLOT-AUTO", result.Data.SlotId);
        }

        // TC-03: Thất bại khi xe đã có một phiên hoạt động (ACTIVE) khác chưa checkout trong bãi
        [Fact]
        public async Task ProcessWalkInCheckIn_VehicleAlreadyActive_ThrowsInvalidOperationException()
        {
            // Arrange
            var dto = new VehicleCheckInDto { LicensePlateIn = "51G-12345" };
            _parkingRepositoryMock.Setup(r => r.IsVehicleActiveInParkingAsync(dto.LicensePlateIn)).ReturnsAsync(true);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _parkingService.ProcessWalkInCheckInAsync(dto, "STAFF-01"));
            Assert.Equal("ACTIVE_SESSION_EXISTS", ex.Message);
        }

        // TC-04: Thất bại khi SlotId yêu cầu không tồn tại trong cơ sở dữ liệu
        [Fact]
        public async Task ProcessWalkInCheckIn_SlotNotFound_ThrowsKeyNotFoundException()
        {
            // Arrange
            var dto = new VehicleCheckInDto { LicensePlateIn = "51G-12345", SlotId = "INVALID-ID" };

            _parkingRepositoryMock.Setup(r => r.IsVehicleActiveInParkingAsync(dto.LicensePlateIn)).ReturnsAsync(false);
            _parkingRepositoryMock.Setup(r => r.GetSlotByIdAsync(dto.SlotId)).ReturnsAsync((ParkingSlot?)null);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _parkingService.ProcessWalkInCheckInAsync(dto, "STAFF-01"));

            Assert.Equal("SLOT_NOT_AVAILABLE", ex.Message);
        }

        // TC-05: Thất bại khi chọn vào một Slot hiện đang bị xe khác chiếm chỗ (OCCUPIED) gây xung đột đồng thời
        [Fact]
        public async Task ProcessWalkInCheckIn_SlotOccupied_ThrowsInvalidOperationException()
        {
            // Arrange
            var dto = new VehicleCheckInDto { LicensePlateIn = "51G-12345", SlotId = "SLOT-BUSY" };
            var slot = new ParkingSlot { SlotId = "SLOT-BUSY", Status = "OCCUPIED" };

            _parkingRepositoryMock.Setup(r => r.IsVehicleActiveInParkingAsync(dto.LicensePlateIn)).ReturnsAsync(false);
            _parkingRepositoryMock.Setup(r => r.GetSlotByIdAsync(dto.SlotId)).ReturnsAsync(slot);

            // Act & Assert           
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _parkingService.ProcessWalkInCheckInAsync(dto, "STAFF-01"));

            Assert.Equal("CONCURRENCY_CONFLICT", ex.Message);
        }

        // TC-06: Thất bại khi tự động điều phối slot nhưng bãi đã hết sạch vị trí trống cho loại xe đó
        [Fact]
        public async Task ProcessWalkInCheckIn_NoAvailableSlotInSystem_ThrowsInvalidOperationException()
        {
            // Arrange
            var dto = new VehicleCheckInDto { LicensePlateIn = "51G-12345", SlotId = null, VehicleTypeId = 2 };
            _parkingRepositoryMock.Setup(r => r.IsVehicleActiveInParkingAsync(dto.LicensePlateIn)).ReturnsAsync(false);
            _parkingRepositoryMock.Setup(r => r.FindFirstAvailableSlotAsync(dto.VehicleTypeId)).ReturnsAsync((ParkingSlot?)null);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _parkingService.ProcessWalkInCheckInAsync(dto, "STAFF-01"));
            Assert.Equal("NO_AVAILABLE_SLOT", ex.Message);
        }

        #endregion

        #region PHẦN 2: PROCESS CHECK-OUT (5 TEST CASES)

        // TC-07: Check-out thành công, giải phóng trạng thái slot và cập nhật phiên thành COMPLETED
        [Fact]
        public async Task ProcessCheckOut_ValidRequest_CompletesSessionAndFreesSlot()
        {
            // Arrange
            var dto = new VehicleCheckOutDto { LicensePlateOut = "51G-12345", StaffOutId = "STAFF-02" };
            var session = new ParkingSession { SessionId = "SESS-01", VehicleTypeId = 1, SlotId = "SLOT-A1", CheckInTime = DateTime.Now.AddHours(-2) };
            var policy = new PricingPolicy { BasePrice = 10000, HourlyRate = 5000 };
            var slot = new ParkingSlot { SlotId = "SLOT-A1", Status = "OCCUPIED" };

            _parkingRepositoryMock.Setup(r => r.GetActiveSessionByPlateAsync(dto.LicensePlateOut)).ReturnsAsync(session);
            _parkingRepositoryMock.Setup(r => r.GetActivePricingPolicyByVehicleTypeAsync(session.VehicleTypeId)).ReturnsAsync(policy);
            _parkingRepositoryMock.Setup(r => r.GetSlotByIdAsync(session.SlotId)).ReturnsAsync(slot);

            // Act
            var result = await _parkingService.ProcessCheckOutAsync(dto);

            // Assert
            Assert.Equal("COMPLETED", result.Status);
            Assert.Equal("PAID", result.PaymentStatus);
            Assert.Equal("AVAILABLE", slot.Status);
            Assert.Null(slot.CurrentSessionId);
            _parkingRepositoryMock.Verify(r => r.UpdateSessionAsync(session), Times.Once);
            _parkingRepositoryMock.Verify(r => r.UpdateSlotAsync(slot), Times.Once);
        }

        // TC-08: Thất bại khi cố tình check-out một xe không tìm thấy lượt đỗ active nào
        [Fact]
        public async Task ProcessCheckOut_SessionNotFound_ThrowsException()
        {
            // Arrange
            var dto = new VehicleCheckOutDto { LicensePlateOut = "51G-NOTFOUND" };
            _parkingRepositoryMock.Setup(r => r.GetActiveSessionByPlateAsync(dto.LicensePlateOut)).ReturnsAsync((ParkingSession?)null);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<Exception>(() => _parkingService.ProcessCheckOutAsync(dto));
            Assert.Equal("INVALID_TICKET", ex.Message);
        }

        // TC-09: Thất bại khi xe đang đỗ hợp lệ nhưng loại xe đó chưa cấu hình biểu giá hệ thống
        [Fact]
        public async Task ProcessCheckOut_PricingPolicyNotFound_ThrowsException()
        {
            // Arrange
            var dto = new VehicleCheckOutDto { LicensePlateOut = "51G-12345" };
            var session = new ParkingSession { SessionId = "SESS-01", VehicleTypeId = 99, CheckInTime = DateTime.Now.AddHours(-1) };

            _parkingRepositoryMock.Setup(r => r.GetActiveSessionByPlateAsync(dto.LicensePlateOut)).ReturnsAsync(session);
            _parkingRepositoryMock.Setup(r => r.GetActivePricingPolicyByVehicleTypeAsync(session.VehicleTypeId)).ReturnsAsync((PricingPolicy?)null);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<Exception>(() => _parkingService.ProcessCheckOutAsync(dto));
            Assert.Equal("PRICING_POLICY_NOT_CONFIGURED", ex.Message);
        }

        // TC-10: Biên - Check-out an toàn đối với các phiên đỗ đặc biệt không gắn SlotId cố định
        [Fact]
        public async Task ProcessCheckOut_SessionWithNoSlotId_CompletesSuccessfullyWithoutCrashing()
        {
            // Arrange
            var dto = new VehicleCheckOutDto { LicensePlateOut = "51G-12345" };
            var session = new ParkingSession { SessionId = "SESS-01", VehicleTypeId = 1, SlotId = null, CheckInTime = DateTime.Now.AddHours(-1) };
            var policy = new PricingPolicy { BasePrice = 10000, HourlyRate = 2000 };

            _parkingRepositoryMock.Setup(r => r.GetActiveSessionByPlateAsync(dto.LicensePlateOut)).ReturnsAsync(session);
            _parkingRepositoryMock.Setup(r => r.GetActivePricingPolicyByVehicleTypeAsync(session.VehicleTypeId)).ReturnsAsync(policy);

            // Act
            var result = await _parkingService.ProcessCheckOutAsync(dto);

            // Assert
            Assert.Equal("COMPLETED", result.Status);
            _parkingRepositoryMock.Verify(r => r.GetSlotByIdAsync(It.IsAny<string>()), Times.Never);
        }

        // TC-11: Biên - Xe vừa vào bãi rồi quay đầu checkout ra ngay (Tính phí thông qua Helper)
        [Fact]
        public async Task ProcessCheckOut_ValidDuration_ReturnsCalculatedFee()
        {
            // Arrange
            var dto = new VehicleCheckOutDto { LicensePlateOut = "51G-12345" };
            var session = new ParkingSession { SessionId = "SESS-01", VehicleTypeId = 1, CheckInTime = DateTime.Now };
            var policy = new PricingPolicy { BasePrice = 15000, HourlyRate = 5000 };

            _parkingRepositoryMock.Setup(r => r.GetActiveSessionByPlateAsync(dto.LicensePlateOut)).ReturnsAsync(session);
            _parkingRepositoryMock.Setup(r => r.GetActivePricingPolicyByVehicleTypeAsync(session.VehicleTypeId)).ReturnsAsync(policy);

            // Act
            var result = await _parkingService.ProcessCheckOutAsync(dto);

            // Assert
            Assert.NotNull(result);
            Assert.True(result.DurationMinutes >= 0);
        }

        #endregion

        #region PHẦN 3: GET ACTIVE SESSION BY LICENSE PLATE (3 TEST CASES)

        // TC-12: Tra cứu thành công phiên hoạt động của xe theo biển số cùng mức phí tạm tính
        [Fact]
        public async Task GetActiveSessionByLicensePlate_ValidPlate_ReturnsActiveSessionDetails()
        {
            // Arrange
            var session = new ParkingSession
            {
                SessionId = "SESS-99",
                LicensePlateIn = "30A-99999",
                CheckInTime = DateTime.Now.AddMinutes(-30),
                Slot = new ParkingSlot { SlotName = "Vip-01" }
            };
            var policy = new PricingPolicy { BasePrice = 20000, HourlyRate = 10000 };

            _parkingRepositoryMock.Setup(r => r.GetActiveSessionByPlateAsync("30A-99999")).ReturnsAsync(session);
            _parkingRepositoryMock.Setup(r => r.GetActivePricingPolicyByVehicleTypeAsync(session.VehicleTypeId)).ReturnsAsync(policy);

            // Act
            var result = await _parkingService.GetActiveSessionByLicensePlateAsync("30A-99999");

            // Assert
            Assert.True(result.Success);
            Assert.Equal("Vip-01", result.Data.SlotName);
            Assert.Equal(1, result.Data.Floor); // Khớp với giá trị mặc định fallback 1 khi không có liên kết đối tượng Zone
        }

        // TC-13: Thất bại khi tra cứu thông tin của một biển số xe không nằm trong bãi
        [Fact]
        public async Task GetActiveSessionByLicensePlate_NotFound_ThrowsInvalidOperationException()
        {
            // Arrange
            _parkingRepositoryMock.Setup(r => r.GetActiveSessionByPlateAsync("30A-00000")).ReturnsAsync((ParkingSession?)null);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _parkingService.GetActiveSessionByLicensePlateAsync("30A-00000"));
            Assert.Equal("INVALID_TICKET", ex.Message);
        }

        // TC-14: Biên - Tra cứu xe đang hoạt động nhưng dữ liệu điều hướng liên kết Slot bị Null trong DB
        [Fact]
        public async Task GetActiveSessionByLicensePlate_NullNavigationProperties_HandlesFallbackGracefully()
        {
            // Arrange
            var session = new ParkingSession { SessionId = "SESS-99", Slot = null };

            _parkingRepositoryMock.Setup(r => r.GetActiveSessionByPlateAsync("30A-99999")).ReturnsAsync(session);

            // Act
            var result = await _parkingService.GetActiveSessionByLicensePlateAsync("30A-99999");

            // Assert - Đảm bảo dữ liệu mapping an toàn không crash lỗi NullReferenceException
            Assert.Equal("N/A", result.Data.SlotName);
            Assert.Equal(1, result.Data.Floor);
        }

        #endregion

        #region PHẦN 4: CALCULATE PRE-CHECKOUT FEE (3 TEST CASES)

        // TC-15: Xem trước chi phí thành công, phân rã đầy đủ cấu trúc hóa đơn tạm tính
        [Fact]
        public async Task CalculatePreCheckOutFee_ValidSessionId_ReturnsCorrectBreakdown()
        {
            // Arrange
            var session = new ParkingSession { SessionId = "SESS-ABC", VehicleTypeId = 1, CheckInTime = DateTime.Now.AddHours(-3) };
            var policy = new PricingPolicy { BasePrice = 10000, HourlyRate = 5000 };

            _parkingRepositoryMock.Setup(r => r.GetActiveSessionByIdAsync("SESS-ABC")).ReturnsAsync(session);
            _parkingRepositoryMock.Setup(r => r.GetActivePricingPolicyByVehicleTypeAsync(session.VehicleTypeId)).ReturnsAsync(policy);

            // Act
            var result = await _parkingService.CalculatePreCheckOutFeeAsync("SESS-ABC");

            // Assert
            Assert.True(result.Success);
            Assert.Equal(10000, result.Data.FeeBreakdown.BasePrice);
            Assert.Equal(5000, result.Data.FeeBreakdown.HourlyRate);
            Assert.Equal(300, result.Data.GracePeriodRemainingSeconds);
        }

        // TC-16: Thất bại khi xem trước chi phí của SessionId không tồn tại hoặc đã kết thúc phiên trước đó
        [Fact]
        public async Task CalculatePreCheckOutFee_SessionNotFoundOrInactive_ThrowsInvalidOperationException()
        {
            // Arrange
            _parkingRepositoryMock.Setup(r => r.GetActiveSessionByIdAsync("CLOSED-ID")).ReturnsAsync((ParkingSession?)null);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _parkingService.CalculatePreCheckOutFeeAsync("CLOSED-ID"));
            Assert.Equal("INVALID_TICKET", ex.Message);
        }

        // TC-17: Thất bại khi tính tiền trước nhưng không tìm thấy cấu hình biểu giá cho loại xe
        [Fact]
        public async Task CalculatePreCheckOutFee_NoPolicyConfigured_ThrowsInvalidOperationException()
        {
            // Arrange
            var session = new ParkingSession { SessionId = "SESS-ABC", VehicleTypeId = 5, CheckInTime = DateTime.Now };
            _parkingRepositoryMock.Setup(r => r.GetActiveSessionByIdAsync("SESS-ABC")).ReturnsAsync(session);
            _parkingRepositoryMock.Setup(r => r.GetActivePricingPolicyByVehicleTypeAsync(session.VehicleTypeId)).ReturnsAsync((PricingPolicy?)null);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _parkingService.CalculatePreCheckOutFeeAsync("SESS-ABC"));
            Assert.Equal("PRICING_POLICY_NOT_CONFIGURED", ex.Message);
        }

        #endregion

        #region PHẦN 5: UPDATE SLOT STATUS (3 TEST CASES)

        // TC-18: Cập nhật trạng thái vị trí thành công sang MAINTENANCE 
        [Fact]
        public async Task UpdateSlotStatus_ValidPayload_UpdatesStatusAndLogsSuccessfully()
        {
            // Arrange
            var dto = new UpdateSlotStatusDto
            {
                SlotId = "SLOT-01",
                Status = "MAINTENANCE",
                Reason = "Hỏng cảm biến vòng từ",
                EstimatedDurationMinutes = 60
            };
            var slot = new ParkingSlot { SlotId = "SLOT-01", Status = "AVAILABLE", SlotName = "Slot 1" };

            _parkingRepositoryMock.Setup(r => r.GetSlotByIdAsync(dto.SlotId)).ReturnsAsync(slot);
            _parkingRepositoryMock.Setup(r => r.UpdateSlotStatusWithLogAsync(
                dto.SlotId,
                "MAINTENANCE",
                "STAFF-01",
                dto.Reason,
                dto.EstimatedDurationMinutes
            )).ReturnsAsync(true);

            // Act
            var result = await _parkingService.UpdateSlotStatusAsync(dto, "STAFF-01");

            // Assert
            Assert.True(result.Success);
            Assert.Equal("MAINTENANCE", result.Data.Status);
        }

        // TC-19: Thất bại khi truyền chuỗi tên trạng thái nằm ngoài danh sách quy định hệ thống
        [Fact]
        public async Task UpdateSlotStatus_InvalidStatusString_ThrowsArgumentException()
        {
            // Arrange
            var dto = new UpdateSlotStatusDto { SlotId = "SLOT-01", Status = "NOT_A_VALID_STATUS" };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
                _parkingService.UpdateSlotStatusAsync(dto, "STAFF-01"));
            Assert.Equal("INVALID_SLOT_STATUS", ex.Message);
        }

        // TC-20: Ràng buộc nghiệp vụ - Không cho phép chuyển đổi bảo trì một ô đỗ đang có xe (OCCUPIED)
        [Fact]
        public async Task UpdateSlotStatus_TryToMaintainOccupiedSlot_ThrowsInvalidOperationException()
        {
            // Arrange
            var dto = new UpdateSlotStatusDto { SlotId = "SLOT-01", Status = "MAINTENANCE" };
            var slot = new ParkingSlot { SlotId = "SLOT-01", Status = "OCCUPIED" };

            _parkingRepositoryMock.Setup(r => r.GetSlotByIdAsync(dto.SlotId)).ReturnsAsync(slot);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _parkingService.UpdateSlotStatusAsync(dto, "STAFF-01"));
            Assert.Equal("CANNOT_MAINTAIN_OCCUPIED_SLOT", ex.Message);
        }

        #endregion
    }
}