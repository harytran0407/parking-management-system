using System;

namespace ParkingManagement.Services.Helpers
{
    public static class ParkingCalculationHelper
    {
        /// <summary>
        /// Tính toán tổng số phút đỗ xe thực tế dựa vào thời điểm check-in
        /// </summary>
        public static int CalculateDurationMinutes(DateTime? checkInTime, DateTime currentTime)
        {
            if (!checkInTime.HasValue) return 0;

            // Đảm bảo đưa về UTC
            DateTime checkInUtc = (checkInTime.Value.Kind == DateTimeKind.Unspecified)
                                  ? DateTime.SpecifyKind(checkInTime.Value, DateTimeKind.Utc)
                                  : checkInTime.Value.ToUniversalTime();

            DateTime currentUtc = currentTime.ToUniversalTime();

            var duration = currentUtc - checkInUtc;

            // Nếu duration là số âm (do lỗi dữ liệu), trả về 0 hoặc 1 phút
            return (int)Math.Max(0, duration.TotalMinutes);
        }

        /// <summary>
        /// Quy đổi số phút ra số block giờ (Làm tròn lên - Ceiling)
        /// </summary>
        public static int ConvertMinutesToBillingHours(int minutes)
        {
            if (minutes <= 0) return 0;
            int hours = (int)Math.Ceiling(minutes / 60.0);
            return hours <= 0 ? 1 : hours;
        }

        /// <summary>
        /// Tính toán số tiền dựa trên thời gian (phút) và chính sách giá
        /// </summary>
        public static decimal CalculateParkingFee(int minutes, decimal basePrice, decimal hourlyRate)
        {
            // Cấu hình thời gian ân hạn là 3 phút 
            const int gracePeriodMinutes = 3;

            // Nếu số phút gửi nhỏ hơn hoặc bằng thời gian ân hạn -> Miễn phí hoàn toàn
            if (minutes <= gracePeriodMinutes)
            {
                return 0;
            }

            int hours = ConvertMinutesToBillingHours(minutes);

            // Giờ đầu tiên tính giá gốc (BasePrice)
            if (hours <= 1)
            {
                return basePrice;
            }

            // Các giờ tiếp theo cộng thêm HourlyRate
            return basePrice + ((hours - 1) * hourlyRate);
        }
    }
}