using System;
using Xunit;
using FluentAssertions;
using ParkingManagement.Services.Helpers;
using ParkingManagement.Models; // Import namespace chứa thực thể PricingPolicy

namespace ParkingManagement.Tests
{
    public class ParkingCalculationHelperTest
    {
        // Khởi tạo bảng giá cấu hình giả lập dùng chung cho các test case
        private readonly PricingPolicy _mockPolicy = new PricingPolicy
        {
            PolicyId = 1,
            VehicleTypeId = 1, // Giả định: Xe máy
            BasePrice = 10000m,
            HourlyRate = 5000m,
            OvernightFee = 20000m
        };

        // Giả lập khung giờ hoạt động tiêu chuẩn bao quát để không bị tính phí qua đêm
        private const string StandardOperatingHours = "00:00-23:59";

        [Fact]
        public void CalculateParkingFee_WithinFirstHour_ReturnsBasePrice()
        {
            // Arrange
            var checkIn = new DateTime(2026, 6, 2, 8, 0, 0);
            var checkOut = new DateTime(2026, 6, 2, 8, 45, 0); // Đỗ 45 phút

            // Act
            var result = ParkingCalculationHelper.CalculateParkingFee(checkIn, checkOut, _mockPolicy, StandardOperatingHours);

            // Assert
            Assert.Equal(10000m, result.CurrentFee); // Tiếng đầu bằng BasePrice
            Assert.Equal(1, result.Hours);            // Làm tròn thành 1 tiếng đỗ
        }

        [Fact]
        public void CalculateParkingFee_MultipleHours_CalculatesProgressiveFee()
        {
            // Arrange
            var checkIn = new DateTime(2026, 6, 2, 8, 0, 0);
            var checkOut = new DateTime(2026, 6, 2, 11, 15, 0); // Đỗ 3 tiếng 15 phút -> tính thành 4 tiếng

            // Act
            var result = ParkingCalculationHelper.CalculateParkingFee(checkIn, checkOut, _mockPolicy, StandardOperatingHours);

            // Assert
            // 1 tiếng đầu (10k) + 3 tiếng tiếp theo (3 * 5k = 15k) = 25k
            Assert.Equal(25000m, result.CurrentFee);
            Assert.Equal(4, result.Hours);
        }

        [Fact]
        public void CalculateParkingFee_WithinGracePeriod_ReturnsZero()
        {
            // Arrange
            var checkIn = new DateTime(2026, 6, 2, 8, 0, 0);
            var checkOut = new DateTime(2026, 6, 2, 8, 2, 30); // Đỗ 2 phút 30 giây (Trong thời gian ân hạn 5 phút)

            // Act
            var result = ParkingCalculationHelper.CalculateParkingFee(checkIn, checkOut, _mockPolicy, StandardOperatingHours, gracePeriodMinutes: 5);

            // Assert
            Assert.Equal(0m, result.CurrentFee);
            Assert.Equal(0, result.Hours);
            // Kiểm tra số giây ân hạn còn lại: (5 phút * 60) - 150 giây = 150 giây còn lại
            Assert.Equal(150, result.GracePeriodRemainingSeconds);
        }
    }
}