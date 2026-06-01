using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Moq;
using ParkingManagement.DTOs;
using ParkingManagement.Models;
using ParkingManagement.Repositories;
using ParkingManagement.Services;
using Xunit;

namespace ParkingManagement.Tests.Services
{
    public class IncidentServiceTests
    {
        private readonly Mock<IParkingRepository> _mockParkingRepo;
        private readonly Mock<IIncidentRepository> _mockIncidentRepo;
        private readonly Mock<IBookingRepository> _mockBookingRepo;
        private readonly IncidentService _incidentService;

        // Cấu hình bảng giá giả lập (Mock Policy) dùng chung cho các test case
        private readonly PricingPolicy _mockPolicy = new PricingPolicy
        {
            PolicyId = 1,
            VehicleTypeId = 1,    // Giả định: Xe máy
            BasePrice = 10000,    // Giá mở cửa / Giờ đầu tiên: 10.000đ
            HourlyRate = 5000,    // Giá mỗi giờ tiếp theo: 5.000đ
            OvernightFee = 20000, // Phí gửi xe xuyên đêm: 20.000đ
            HandlingFee = 50000   // Phí phạt đền phôi thẻ bị mất: 50.000đ
        };

        public IncidentServiceTests()
        {
            _mockParkingRepo = new Mock<IParkingRepository>();
            _mockIncidentRepo = new Mock<IIncidentRepository>();
            _mockBookingRepo = new Mock<IBookingRepository>();

            _incidentService = new IncidentService(
                _mockIncidentRepo.Object,
                _mockParkingRepo.Object,
                _mockBookingRepo.Object
            );

            _mockParkingRepo
                .Setup(repo => repo.SaveChangesWithTransactionAsync(It.IsAny<Func<Task>>()))
                .Returns<Func<Task>>(async (action) => await action());
        }

        #region Nhóm 1: Happy Path Cases (Các trường hợp luồng nghiệp vụ chạy thành công)

        /// <summary>
        /// TEST CASE 1: Xe gửi ngày thường trong giờ hoạt động dưới 1 tiếng + Báo mất thẻ
        /// </summary>
        [Fact]
        public async Task HandleLostTicket_WithinOneHour_Weekday_ReturnsCorrectFeeAndBreakdown()
        {
            // Arrange
            var licensePlate = "29A-12345";
            var staffId = "staff_01";
            var mockCurrentTime = new DateTime(2026, 6, 2, 15, 0, 0);

            var activeSession = new ParkingSession
            {
                SessionId = "sess_001",
                LicensePlateIn = licensePlate,
                VehicleTypeId = 1,
                CheckInTime = mockCurrentTime.AddMinutes(-45),
                SlotId = "SLOT-A1",
                Status = "ACTIVE"
            };

            var dto = new LostTicketRequestDto { LicensePlate = licensePlate, VehicleTypeId = 1 };

            _mockParkingRepo.Setup(r => r.GetActiveSessionByPlateAsync(licensePlate)).ReturnsAsync(activeSession);
            _mockParkingRepo.Setup(r => r.GetActivePricingPolicyByVehicleTypeAsync(1)).ReturnsAsync(_mockPolicy);
            _mockParkingRepo.Setup(r => r.GetSlotByIdAsync("SLOT-A1")).ReturnsAsync(new ParkingSlot { SlotId = "SLOT-A1", SlotName = "A1" });
            _mockParkingRepo.Setup(r => r.GetOperatingHoursForDayAsync(It.IsAny<DateTime>())).ReturnsAsync("00:00-23:59");

            // Act
            var result = await _incidentService.HandleLostTicketAsync(dto, staffId, mockCurrentTime);

            // Assert
            Assert.True(result.Success);
            Assert.NotNull(result.Data);
            Assert.NotNull(result.Data.Breakdown);
            Assert.Equal(10000, result.Data.Breakdown.ActualParkingFee);
            Assert.Equal(50000, result.Data.Breakdown.HandlingFee);
            Assert.Equal(60000, result.Data.CalculatedFee);
        }

        /// <summary>
        /// TEST CASE 2: Xe gửi trong ngày nhiều tiếng (Lũy tiến) + Báo mất thẻ
        /// </summary>
        [Fact]
        public async Task HandleLostTicket_MultipleHoursProgressive_CalculatesHourlyRateCorrectly()
        {
            // Arrange
            var licensePlate = "29A-12345";
            var mockCurrentTime = DateTime.Now;

            var activeSession = new ParkingSession
            {
                SessionId = "sess_002",
                LicensePlateIn = licensePlate,
                VehicleTypeId = 1,
                CheckInTime = mockCurrentTime.AddHours(-4).AddMinutes(-15),
                SlotId = "SLOT-A1",
                Status = "ACTIVE"
            };

            var dto = new LostTicketRequestDto { LicensePlate = licensePlate, VehicleTypeId = 1 };

            _mockParkingRepo.Setup(r => r.GetActiveSessionByPlateAsync(licensePlate)).ReturnsAsync(activeSession);
            _mockParkingRepo.Setup(r => r.GetActivePricingPolicyByVehicleTypeAsync(1)).ReturnsAsync(_mockPolicy);
            _mockParkingRepo.Setup(r => r.GetOperatingHoursForDayAsync(It.IsAny<DateTime>())).ReturnsAsync("00:00-23:59");

            // Act
            var result = await _incidentService.HandleLostTicketAsync(dto, "staff_01");

            // Assert
            Assert.NotNull(result.Data);
            Assert.NotNull(result.Data.Breakdown);
            Assert.Equal(30000, result.Data.Breakdown.ActualParkingFee);
            Assert.Equal(80000, result.Data.CalculatedFee);
        }

        /// <summary>
        /// TEST CASE 3: Xe lấy muộn sau giờ đóng cửa tiêu chuẩn của tòa nhà -> Bị tính phí qua đêm (Dù cùng ngày)
        /// </summary>
        [Fact]
        public async Task HandleLostTicket_SameDay_ButAfterClosingHour_AppendsOvernightFee()
        {
            // Arrange
            var licensePlate = "29A-12345";
            var mockCurrentTime = new DateTime(2026, 6, 2, 22, 30, 0);
            var closingTarget = mockCurrentTime.AddHours(-1);
            string mockOperatingHours = $"00:00-{closingTarget:HH:mm}";

            var activeSession = new ParkingSession
            {
                SessionId = "sess_003",
                LicensePlateIn = licensePlate,
                VehicleTypeId = 1,
                CheckInTime = mockCurrentTime.AddHours(-2),
                SlotId = "SLOT-A1",
                Status = "ACTIVE"
            };

            var dto = new LostTicketRequestDto { LicensePlate = licensePlate, VehicleTypeId = 1 };

            _mockParkingRepo.Setup(r => r.GetActiveSessionByPlateAsync(licensePlate)).ReturnsAsync(activeSession);
            _mockParkingRepo.Setup(r => r.GetActivePricingPolicyByVehicleTypeAsync(1)).ReturnsAsync(_mockPolicy);
            _mockParkingRepo.Setup(r => r.GetOperatingHoursForDayAsync(It.IsAny<DateTime>())).ReturnsAsync(mockOperatingHours);

            // Act
            var result = await _incidentService.HandleLostTicketAsync(dto, "staff_01", mockCurrentTime);

            // Assert
            Assert.NotNull(result.Data);
            Assert.NotNull(result.Data.Breakdown);
            Assert.Equal(35000, result.Data.Breakdown.ActualParkingFee);
            Assert.Equal(85000, result.Data.CalculatedFee);
        }

        /// <summary>
        /// TEST CASE 4: Xe vào bãi dưới thời gian ân hạn (Grace Period) + Báo mất thẻ ngay
        /// </summary>
        [Fact]
        public async Task HandleLostTicket_WithinGracePeriod_ParkingFeeIsZeroButHandlingFeeApplied()
        {
            // Arrange
            var licensePlate = "29A-12345";
            var mockCurrentTime = DateTime.Now;

            var activeSession = new ParkingSession
            {
                SessionId = "sess_004",
                LicensePlateIn = licensePlate,
                VehicleTypeId = 1,
                CheckInTime = mockCurrentTime.AddMinutes(-1),
                SlotId = "SLOT-A1",
                Status = "ACTIVE"
            };

            var dto = new LostTicketRequestDto { LicensePlate = licensePlate, VehicleTypeId = 1 };

            _mockParkingRepo.Setup(r => r.GetActiveSessionByPlateAsync(licensePlate)).ReturnsAsync(activeSession);
            _mockParkingRepo.Setup(r => r.GetActivePricingPolicyByVehicleTypeAsync(1)).ReturnsAsync(_mockPolicy);
            _mockParkingRepo.Setup(r => r.GetOperatingHoursForDayAsync(It.IsAny<DateTime>())).ReturnsAsync("00:00-23:59");

            // Act
            var result = await _incidentService.HandleLostTicketAsync(dto, "staff_01");

            // Assert
            Assert.NotNull(result.Data);
            Assert.NotNull(result.Data.Breakdown);
            Assert.Equal(0, result.Data.Breakdown.ActualParkingFee);
            Assert.Equal(50000, result.Data.Breakdown.HandlingFee);
            Assert.Equal(50000, result.Data.CalculatedFee);
        }

        #endregion

        #region Nhóm 2: Edge Cases (Các trường hợp dữ liệu biên và tùy chỉnh nâng cao)

        /// <summary>
        /// TEST CASE 5: Báo mất thẻ với lý do tùy chỉnh (Custom Reason) và lưu kèm Số điện thoại khách hàng
        /// </summary>
        [Fact]
        public async Task HandleLostTicket_WithCustomReasonAndPhone_SavesDataCorrectly()
        {
            // Arrange
            var licensePlate = "29A-12345";
            var mockCurrentTime = DateTime.Now;

            var activeSession = new ParkingSession
            {
                SessionId = "sess_005",
                LicensePlateIn = licensePlate,
                VehicleTypeId = 1,
                CheckInTime = mockCurrentTime.AddMinutes(-20),
                Status = "ACTIVE"
            };

            var dto = new LostTicketRequestDto
            {
                LicensePlate = licensePlate,
                VehicleTypeId = 1,
                LostReason = "Rơi ví tại sảnh TTTM",
                CustomerPhone = "0901234567"
            };

            _mockParkingRepo.Setup(r => r.GetActiveSessionByPlateAsync(licensePlate)).ReturnsAsync(activeSession);
            _mockParkingRepo.Setup(r => r.GetActivePricingPolicyByVehicleTypeAsync(1)).ReturnsAsync(_mockPolicy);
            _mockParkingRepo.Setup(r => r.GetOperatingHoursForDayAsync(It.IsAny<DateTime>())).ReturnsAsync("00:00-23:59");

            // Act
            await _incidentService.HandleLostTicketAsync(dto, "staff_01");

            // Assert
            _mockIncidentRepo.Verify(r => r.CreateIncidentLogAsync(It.Is<IncidentLog>(log =>
                log.CustomerPhone == "0901234567" &&
                log.Description != null && log.Description.Contains("Rơi ví tại sảnh TTTM")
            )), Times.Once);
        }

        /// <summary>
        /// TEST CASE 6: Trường hợp biên làm tròn thời gian vừa vượt quá mốc block giờ đỗ xe
        /// </summary>
        [Fact]
        public async Task HandleLostTicket_ExactlyOnHourBoundary_CeilsToNextBillingHour()
        {
            // Arrange
            var licensePlate = "29A-12345";
            var mockCurrentTime = DateTime.Now;

            var activeSession = new ParkingSession
            {
                SessionId = "sess_006",
                LicensePlateIn = licensePlate,
                VehicleTypeId = 1,
                CheckInTime = mockCurrentTime.AddHours(-1).AddSeconds(-15),
                Status = "ACTIVE"
            };

            var dto = new LostTicketRequestDto { LicensePlate = licensePlate, VehicleTypeId = 1 };

            _mockParkingRepo.Setup(r => r.GetActiveSessionByPlateAsync(licensePlate)).ReturnsAsync(activeSession);
            _mockParkingRepo.Setup(r => r.GetActivePricingPolicyByVehicleTypeAsync(1)).ReturnsAsync(_mockPolicy);
            _mockParkingRepo.Setup(r => r.GetOperatingHoursForDayAsync(It.IsAny<DateTime>())).ReturnsAsync("00:00-23:59");

            // Act
            var result = await _incidentService.HandleLostTicketAsync(dto, "staff_01");

            // Assert
            Assert.NotNull(result.Data);
            Assert.NotNull(result.Data.Breakdown);
            Assert.Equal(15000, result.Data.Breakdown.ActualParkingFee);
            Assert.Equal(65000, result.Data.CalculatedFee);
        }

        #endregion

        #region Nhóm 3: Negative Cases (Các trường hợp lỗi hệ thống và xử lý ngoại lệ)

        /// <summary>
        /// TEST CASE 7: Báo mất thẻ cho xe không có phiên hoạt động trong bãi
        /// </summary>
        [Fact]
        public async Task HandleLostTicket_NoActiveSession_ThrowsKeyNotFoundException()
        {
            // Arrange
            var fakePlate = "99A-99999";
            var dto = new LostTicketRequestDto { LicensePlate = fakePlate, VehicleTypeId = 1 };

            _mockParkingRepo.Setup(r => r.GetActiveSessionByPlateAsync(fakePlate)).ReturnsAsync((ParkingSession?)null);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _incidentService.HandleLostTicketAsync(dto, "staff_01")
            );

            Assert.Equal("ACTIVE_SESSION_NOT_FOUND", exception.Message);
        }

        /// <summary>
        /// TEST CASE 8: Loại phương tiện chưa được người quản trị cấu hình bảng giá trong Database
        /// </summary>
        [Fact]
        public async Task HandleLostTicket_PolicyNotConfigured_ThrowsInvalidOperationException()
        {
            // Arrange
            var licensePlate = "29A-12345";
            var activeSession = new ParkingSession { LicensePlateIn = licensePlate, VehicleTypeId = 99, Status = "ACTIVE" };
            var dto = new LostTicketRequestDto { LicensePlate = licensePlate, VehicleTypeId = 99 };

            _mockParkingRepo.Setup(r => r.GetActiveSessionByPlateAsync(licensePlate)).ReturnsAsync(activeSession);
            _mockParkingRepo.Setup(r => r.GetActivePricingPolicyByVehicleTypeAsync(99)).ReturnsAsync((PricingPolicy?)null);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _incidentService.HandleLostTicketAsync(dto, "staff_01")
            );

            Assert.Equal("PRICING_POLICY_NOT_CONFIGURED", exception.Message);
        }

        #endregion

        #region Nhóm 4: Concurrency & Transaction Integrity (Kiểm thử kiểm soát đồng thời)

        /// <summary>
        /// TEST CASE 9: Kiểm tra tính toàn vẹn (Atomicity) của Transaction khi xảy ra sự cố sập kết nối DB giữa chừng
        /// </summary>
        [Fact]
        public async Task HandleLostTicket_DatabaseExceptionOnStep5_RollbacksEverything()
        {
            // Arrange
            var licensePlate = "29A-12345";
            var activeSession = new ParkingSession { SessionId = "sess_009", LicensePlateIn = licensePlate, VehicleTypeId = 1, Status = "ACTIVE" };
            var dto = new LostTicketRequestDto { LicensePlate = licensePlate, VehicleTypeId = 1 };

            _mockParkingRepo.Setup(r => r.GetActiveSessionByPlateAsync(licensePlate)).ReturnsAsync(activeSession);
            _mockParkingRepo.Setup(r => r.GetActivePricingPolicyByVehicleTypeAsync(1)).ReturnsAsync(_mockPolicy);
            _mockParkingRepo.Setup(r => r.GetOperatingHoursForDayAsync(It.IsAny<DateTime>())).ReturnsAsync("00:00-23:59");

            _mockIncidentRepo
                .Setup(r => r.CreateIncidentLogAsync(It.IsAny<IncidentLog>()))
                .ThrowsAsync(new Exception("DATABASE_CRASHED"));

            // Act & Assert
            await Assert.ThrowsAsync<Exception>(() => _incidentService.HandleLostTicketAsync(dto, "staff_01"));
        }

        /// <summary>
        /// TEST CASE 10: Kiểm soát xung đột đồng thời khi nhân viên Double Click gửi yêu cầu xử lý mất thẻ liên tục
        /// </summary>
        [Fact]
        public async Task HandleLostTicket_ConcurrentRequests_FirstWinsOthersFail()
        {
            // Arrange
            var licensePlate = "29A-12345";
            var activeSession = new ParkingSession { SessionId = "sess_010", LicensePlateIn = licensePlate, VehicleTypeId = 1, Status = "ACTIVE" };
            var dto = new LostTicketRequestDto { LicensePlate = licensePlate, VehicleTypeId = 1 };

            _mockParkingRepo.Setup(r => r.GetActiveSessionByPlateAsync(licensePlate)).ReturnsAsync(activeSession);
            _mockParkingRepo.Setup(r => r.GetActivePricingPolicyByVehicleTypeAsync(1)).ReturnsAsync(_mockPolicy);
            _mockParkingRepo.Setup(r => r.GetOperatingHoursForDayAsync(It.IsAny<DateTime>())).ReturnsAsync("00:00-23:59");

            // Lần bấm đầu tiên
            var response1 = await _incidentService.HandleLostTicketAsync(dto, "staff_01");
            Assert.True(response1.Success);

            // Giả lập sau lần 1 thành công
            _mockParkingRepo.Setup(r => r.GetActiveSessionByPlateAsync(licensePlate)).ReturnsAsync((ParkingSession?)null);

            // Lần bấm thứ hai
            var exc = await Assert.ThrowsAsync<KeyNotFoundException>(() => _incidentService.HandleLostTicketAsync(dto, "staff_01"));
            Assert.Equal("ACTIVE_SESSION_NOT_FOUND", exc.Message);
        }

        #endregion

        #region Nhóm 5: Test Cases cho Nghiệp vụ Correct Mismatch (Sửa sai lệch biển số)

        /// <summary>
        /// TEST CASE 11: Sửa đổi biển số thành công khi dữ liệu đầu vào chuẩn xác (Happy Path)
        /// </summary>
        [Fact]
        public async Task CorrectMismatch_ValidInput_UpdatesPlatesAndCreatesIncidentLog()
        {
            // Arrange
            var staffId = "staff_01";
            var dto = new MismatchCorrectionRequestDto
            {
                SessionId = "sess_12345",
                OriginalLicensePlate = "29A-123.46",
                CorrectedLicensePlate = "29A-123.45",
                Reason = "OCR misread 6 to 5"
            };

            var currentSession = new ParkingSession
            {
                SessionId = "sess_12345",
                LicensePlateIn = "29A-123.46",
                Status = "ACTIVE"
            };

            _mockParkingRepo.Setup(r => r.GetActiveSessionByIdAsync(dto.SessionId)).ReturnsAsync(currentSession);
            _mockParkingRepo.Setup(r => r.GetActiveSessionByPlateAsync(dto.CorrectedLicensePlate)).ReturnsAsync((ParkingSession?)null);

            // Act
            var result = await _incidentService.CorrectMismatchAsync(dto, staffId);

            // Assert
            Assert.True(result.Success);
            Assert.Equal("RESOLVED", result.Data.Status);
            Assert.Equal("29A-123.45", currentSession.LicensePlateIn);
            Assert.Equal("29A-123.45", currentSession.LicensePlateOut);

            _mockIncidentRepo.Verify(r => r.CreateIncidentLogAsync(It.Is<IncidentLog>(log =>
                log.SessionId == dto.SessionId &&
                log.ReportedBy == staffId &&
                log.IssueType == "WRONG_SLOT" &&
                log.Status == "RESOLVED"
            )), Times.Once);
        }

        /// <summary>
        /// TEST CASE 12: Không tìm thấy Session ID cần sửa đổi (Negative Path)
        /// </summary>
        [Fact]
        public async Task CorrectMismatch_SessionNotFound_ThrowsKeyNotFoundException()
        {
            // Arrange
            var dto = new MismatchCorrectionRequestDto { SessionId = "sess_invalid" };
            _mockParkingRepo.Setup(r => r.GetActiveSessionByIdAsync(dto.SessionId)).ReturnsAsync((ParkingSession?)null);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _incidentService.CorrectMismatchAsync(dto, "staff_01")
            );
            Assert.Equal("SESSION_NOT_FOUND", exception.Message);
        }

        /// <summary>
        /// TEST CASE 13: Xung đột đồng thời - Biển số cũ gửi lên từ Frontend không khớp với DB do đã có người sửa trước đó
        /// </summary>
        [Fact]
        public async Task CorrectMismatch_ConcurrencyPlateMismatch_ThrowsInvalidOperationException()
        {
            // Arrange
            var dto = new MismatchCorrectionRequestDto
            {
                SessionId = "sess_12345",
                OriginalLicensePlate = "29A-123.46"
            };

            var currentSession = new ParkingSession
            {
                SessionId = "sess_12345",
                LicensePlateIn = "29A-999.99"
            };

            _mockParkingRepo.Setup(r => r.GetActiveSessionByIdAsync(dto.SessionId)).ReturnsAsync(currentSession);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _incidentService.CorrectMismatchAsync(dto, "staff_01")
            );
            Assert.Equal("CONCURRENCY_CONFLICT_PLATE_MISMATCH", exception.Message);
        }

        /// <summary>
        /// TEST CASE 14: Biển số mới muốn cập nhật hiện đang có một xe khác sử dụng chạy trong bãi
        /// </summary>
        [Fact]
        public async Task CorrectMismatch_NewPlateAlreadyActiveElsewhere_ThrowsInvalidOperationException()
        {
            // Arrange
            var dto = new MismatchCorrectionRequestDto
            {
                SessionId = "sess_12345",
                OriginalLicensePlate = "29A-123.46",
                CorrectedLicensePlate = "29A-123.45"
            };

            var currentSession = new ParkingSession { SessionId = "sess_12345", LicensePlateIn = "29A-123.46" };
            var conflictingSession = new ParkingSession { SessionId = "sess_99999", LicensePlateIn = "29A-123.45" };

            _mockParkingRepo.Setup(r => r.GetActiveSessionByIdAsync(dto.SessionId)).ReturnsAsync(currentSession);
            _mockParkingRepo.Setup(r => r.GetActiveSessionByPlateAsync(dto.CorrectedLicensePlate)).ReturnsAsync(conflictingSession);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _incidentService.CorrectMismatchAsync(dto, "staff_01")
            );
            Assert.Equal("LICENSE_PLATE_ALREADY_ACTIVE_IN_ANOTHER_SLOT", exception.Message);
        }

        #endregion

        #region Nhóm 6: Test Cases cho Nghiệp vụ Resolve Slot Dispute (Giải quyết tranh chấp ô đỗ)

        /// <summary>
        /// TEST CASE 15: Điều phối ô đỗ thành công khi xe vãng lai chiếm chỗ của khách đặt trước (Happy Path)
        /// </summary>
        [Fact]
        public async Task ResolveSlotDispute_ValidDispute_ReallocatesBookingSuccessfully()
        {
            // Arrange
            var staffId = "staff_01";
            var dto = new SlotDisputeRequestDto { SessionId = "sess_vi_pham", Reason = "Xe đỗ nhầm ô A1" };

            var violatorSession = new ParkingSession
            {
                SessionId = "sess_vi_pham",
                SlotId = "SLOT-A1",
                VehicleTypeId = 1,
                Status = "ACTIVE"
            };

            var conflictedBooking = new Booking
            {
                BookingId = "bkg_001",
                SlotId = "SLOT-A1",
                Status = "CONFIRMED"
            };

            // 🔥 ĐÃ SỬA: Thêm SlotName cụ thể để khớp với logic DTO Mapping của Service
            var availableNewSlot = new ParkingSlot { SlotId = "SLOT-A2", SlotName = "A2", Status = "AVAILABLE" };

            _mockParkingRepo.Setup(r => r.GetActiveSessionByIdAsync(dto.SessionId)).ReturnsAsync(violatorSession);
            _mockBookingRepo.Setup(r => r.GetActiveBookingBySlotIdAsync("SLOT-A1")).ReturnsAsync(conflictedBooking);

            _mockParkingRepo.Setup(r => r.FindFirstAvailableSlotAsync(violatorSession.VehicleTypeId)).ReturnsAsync(availableNewSlot);
            _mockParkingRepo.Setup(r => r.GetSlotByIdAsync("SLOT-A1")).ReturnsAsync(new ParkingSlot { SlotId = "SLOT-A1", SlotName = "A1" });
            _mockParkingRepo.Setup(r => r.GetSlotByIdAsync("SLOT-A2")).ReturnsAsync(new ParkingSlot { SlotId = "SLOT-A2", SlotName = "A2" });

            // Act
            var result = await _incidentService.ResolveSlotDisputeAsync(dto, staffId);

            // Assert
            Assert.True(result.Success);
            Assert.Equal("A1", result.Data.ConflictedSlotName);
            Assert.Equal("A2", result.Data.ReallocatedSlotName);
            Assert.Equal("bkg_001", result.Data.MovedBookingId);
            Assert.Equal("SLOT-A2", conflictedBooking.SlotId);

            _mockIncidentRepo.Verify(r => r.CreateIncidentLogAsync(It.Is<IncidentLog>(log =>
                log.SessionId == dto.SessionId &&
                log.IssueType == "WRONG_SLOT"
            )), Times.Once);
        }

        /// <summary>
        /// TEST CASE 16: Ô đỗ bị chiếm dụng thực tế không hề có lịch đặt trước nào (Không có tranh chấp thực tế)
        /// </summary>
        [Fact]
        public async Task ResolveSlotDispute_NoBookingOnSlot_ThrowsInvalidOperationException()
        {
            // Arrange
            var dto = new SlotDisputeRequestDto { SessionId = "sess_001" };
            var violatorSession = new ParkingSession { SessionId = "sess_001", SlotId = "SLOT-A1", Status = "ACTIVE" };

            _mockParkingRepo.Setup(r => r.GetActiveSessionByIdAsync(dto.SessionId)).ReturnsAsync(violatorSession);
            _mockBookingRepo.Setup(r => r.GetActiveBookingBySlotIdAsync("SLOT-A1")).ReturnsAsync((Booking?)null);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _incidentService.ResolveSlotDisputeAsync(dto, "staff_01")
            );
            Assert.Equal("NO_BOOKING_DISPUTE_FOUND_ON_THIS_SLOT", exception.Message);
        }

        /// <summary>
        /// TEST CASE 17: Bãi xe đã hết sạch ô trống cùng loại để đền bù điều phối cho khách đặt trước
        /// </summary>
        [Fact]
        public async Task ResolveSlotDispute_NoAvailableSlotToReallocate_ThrowsInvalidOperationException()
        {
            // Arrange
            var dto = new SlotDisputeRequestDto { SessionId = "sess_001" };
            var violatorSession = new ParkingSession { SessionId = "sess_001", SlotId = "SLOT-A1", VehicleTypeId = 1, Status = "ACTIVE" };
            var conflictedBooking = new Booking { BookingId = "bkg_001", SlotId = "SLOT-A1", Status = "CONFIRMED" };

            _mockParkingRepo.Setup(r => r.GetActiveSessionByIdAsync(dto.SessionId)).ReturnsAsync(violatorSession);
            _mockBookingRepo.Setup(r => r.GetActiveBookingBySlotIdAsync("SLOT-A1")).ReturnsAsync(conflictedBooking);

            _mockParkingRepo.Setup(r => r.FindFirstAvailableSlotAsync(1)).ReturnsAsync((ParkingSlot?)null);

            _mockParkingRepo.Setup(r => r.GetSlotByIdAsync("SLOT-A1")).ReturnsAsync(new ParkingSlot { SlotId = "SLOT-A1", SlotName = "A1" });

            // Act & Assert
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _incidentService.ResolveSlotDisputeAsync(dto, "staff_01")
            );
            Assert.Equal("NO_AVAILABLE_SLOT_TO_REALLOCATE_FOR_BOOKING", exception.Message);
        }

        #endregion
    }
}