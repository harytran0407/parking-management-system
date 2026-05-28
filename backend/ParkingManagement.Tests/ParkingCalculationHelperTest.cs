using System;
using Xunit;
using FluentAssertions;
using ParkingManagement.Services.Helpers;

namespace ParkingManagement.Tests.Helpers
{
    public class ParkingCalculationHelperTests
    {
        // =========================================================================
        // CASE 1: XE ĐỖ TRONG THỜI GIAN ÂN HẠN (MỨC PHÍ PHẢI BẰNG 0đ)
        // =========================================================================
        [Fact]
        public void CASE_1_CalculateParkingFee_ShouldReturnZero_WhenWithinGracePeriod()
        {
            // Arrange (Thiết lập 2 phút đỗ - dưới hạn 3 phút)
            int minutes = 2;
            decimal basePrice = 15000;
            decimal hourlyRate = 10000;

            // Act
            decimal fee = ParkingCalculationHelper.CalculateParkingFee(minutes, basePrice, hourlyRate);

            // Assert
            fee.Should().Be(0); // Không tính tiền
        }

        // =========================================================================
        // CASE 2: XE ĐỖ VỪA QUÁ THỜI GIAN ÂN HẠN (TÍNH GIÁ GỐC GIỜ ĐẦU)
        // =========================================================================
        [Fact]
        public void CASE_2_CalculateParkingFee_ShouldChargeBasePrice_WhenJustOverGracePeriod()
        {
            // Arrange (Thiết lập 4 phút đỗ - đã lố mốc 3 phút)
            int minutes = 4;
            decimal basePrice = 15000;
            decimal hourlyRate = 10000;

            // Act
            decimal fee = ParkingCalculationHelper.CalculateParkingFee(minutes, basePrice, hourlyRate);

            // Assert
            fee.Should().Be(basePrice); // Thu đúng 15,000đ
        }

        // =========================================================================
        // CASE 3: XE ĐỖ LŨY TIẾN NHIỀU GIỜ (TÍNH GIÁ GỐC + GIÁ THEO GIỜ LÀM TRÒN)
        // =========================================================================
        [Fact]
        public void CASE_3_CalculateParkingFee_ShouldChargeProgressiveFee_WhenParkingMultipleHours()
        {
            // Arrange (Thiết lập đỗ 2 tiếng 5 phút = 125 phút -> làm tròn lên thành 3 block giờ)
            int minutes = 125;
            decimal basePrice = 15000;  // Tiếng 1: 15,000đ
            decimal hourlyRate = 10000; // Tiếng 2 + Tiếng 3 = 20,000đ

            // Act
            decimal fee = ParkingCalculationHelper.CalculateParkingFee(minutes, basePrice, hourlyRate);

            // Assert
            fee.Should().Be(35000); // Tổng thu phải là 35,000đ
        }
    }
}