using System;
using ParkingManagement.Models; // Đảm bảo đã import đúng namespace chứa PricingPolicy

namespace ParkingManagement.Services.Helpers
{
    // Class phụ trợ định dạng dữ liệu trả về cho hàm tính toán
    public class ParkingFeeResult
    {
        public decimal CurrentFee { get; set; }
        public int Hours { get; set; }
        public decimal OvernightFee { get; set; }
        public int GracePeriodRemainingSeconds { get; set; }
    }

    public static class ParkingCalculationHelper
    {
        public static int CalculateDurationMinutes(DateTime? checkInTime, DateTime currentTime)
        {
            if (!checkInTime.HasValue) return 0;
            TimeSpan duration = currentTime - checkInTime.Value;
            int totalMinutes = (int)Math.Ceiling(duration.TotalMinutes);
            return totalMinutes > 0 ? totalMinutes : 0;
        }

        public static int ConvertMinutesToBillingHours(int minutes)
        {
            if (minutes <= 0) return 0;
            int hours = (minutes + 59) / 60;
            return hours <= 0 ? 1 : hours;
        }

        /// <summary>
        /// KIỂM TRA QUA ĐÊM DỰA VÀO CHUỖI CẤU HÌNH GIỜ TỪ DATABASE (Ví dụ: "06:00-22:00")
        /// </summary>
        public static bool IsOvernightParking(DateTime? checkInTime, DateTime currentTime, string operatingHours)
        {
            if (!checkInTime.HasValue) return false;

            // 1. Nếu thời gian đỗ thực tế đã bước sang ngày hôm sau -> Tính qua đêm
            if (currentTime.Date > checkInTime.Value.Date)
            {
                return true;
            }

            // 2. Nếu trong cùng một ngày nhưng vượt quá giờ đóng cửa của tòa nhà
            if (!string.IsNullOrEmpty(operatingHours) && operatingHours.Contains("-"))
            {
                try
                {
                    // Tách chuỗi "06:00-22:00" -> lấy phần đóng cửa "22:00"
                    string closingTimeStr = operatingHours.Split('-')[1].Trim(); // "22:00"

                    // Chuyển chuỗi "22:00" thành kiểu TimeSpan để so sánh thời gian trong ngày
                    if (TimeSpan.TryParse(closingTimeStr, out TimeSpan closingTime))
                    {
                        // So sánh giờ/phút của currentTime với giờ đóng cửa
                        if (currentTime.TimeOfDay >= closingTime)
                        {
                            return true;
                        }
                    }
                }
                catch
                {
                    // Phòng hờ nếu dữ liệu DB bị nhập sai định dạng, hệ thống mặc định không tính lỗi sập luồng
                    return false;
                }
            }

            return false;
        }

        /// <summary>
        /// Hàm tính tiền nhận động chuỗi cấu hình giờ hoạt động áp dụng cho ngày hiện tại
        /// </summary>
        public static ParkingFeeResult CalculateParkingFee(DateTime checkInTime, DateTime checkOutTime, PricingPolicy policy, string operatingHours, int gracePeriodMinutes = 5)
        {
            // 1. Tính tổng số phút thực tế
            TimeSpan duration = checkOutTime - checkInTime;
            int totalMinutes = (int)Math.Ceiling(duration.TotalMinutes);

            // Trách trường hợp thời gian máy tính bị lệch âm
            if (totalMinutes < 0) totalMinutes = 0;

            decimal actualParkingFee = 0;
            int billedHours = 0;
            decimal appliedOvernightFee = 0;

            // Kiểm tra trạng thái phạt lố giờ hoạt động trước
            bool isOvernight = IsOvernightParking(checkInTime, checkOutTime, operatingHours);
            if (isOvernight)
            {
                appliedOvernightFee = policy.OvernightFee;
            }

            // 2. KIỂM TRA ĐIỀU KIỆN ÂN HẠN (GRACE PERIOD)
            // Xe CHỈ được miễn phí hoàn toàn nếu đỗ trong thời gian ân hạn VÀ không vi phạm đỗ lố giờ đóng cửa
            if (totalMinutes <= gracePeriodMinutes && !isOvernight)
            {
                actualParkingFee = 0;
                billedHours = 0;
            }
            else
            {
                // 3. NẾU VƯỢT QUÁ THỜI GIAN ÂN HẠN HOẶC BỊ PHẠT QUA ĐÊM: TIẾN HÀNH TÍNH LŨY TIẾN THEO BLOCK GIỜ
                billedHours = (int)Math.Ceiling(totalMinutes / 60.0);

                if (billedHours > 0)
                {
                    // Tiếng đầu tiên tính BasePrice
                    actualParkingFee = policy.BasePrice;

                    // Các tiếng tiếp theo tính lũy tiến theo HourlyRate
                    if (billedHours > 1)
                    {
                        actualParkingFee += (billedHours - 1) * policy.HourlyRate;
                    }
                }

                // Cộng thêm phí qua đêm nếu có
                actualParkingFee += appliedOvernightFee;
            }

            // Tính toán số giây ân hạn còn lại (nếu có)
            int secondsElapsed = (int)duration.TotalSeconds;
            int totalGraceSeconds = gracePeriodMinutes * 60;
            int gracePeriodRemainingSeconds = Math.Max(0, totalGraceSeconds - secondsElapsed);

            // Nếu đã tính phí (hours > 0 hoặc tiền > 0) thì thời gian ân hạn còn lại phải bắt buộc về 0
            if (billedHours > 0 || actualParkingFee > 0)
            {
                gracePeriodRemainingSeconds = 0;
            }

            return new ParkingFeeResult
            {
                CurrentFee = actualParkingFee,
                Hours = billedHours,
                OvernightFee = appliedOvernightFee,
                GracePeriodRemainingSeconds = gracePeriodRemainingSeconds
            };
        }
    }
}