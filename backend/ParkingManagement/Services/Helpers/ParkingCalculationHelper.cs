using System;
using System.Linq;
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

    public class BookingFeeResult
    {
        public decimal TotalFee { get; set; }
        public decimal EarlyArrivalFee { get; set; }
        public int EarlyHours { get; set; }
        public decimal OvernightFee { get; set; }
        public decimal LateCheckoutFee { get; set; }
        public int LateHours { get; set; }
        public decimal PrepaidOvertime { get; set; }
    }

    public static class ParkingCalculationHelper
    {
        private static readonly TimeZoneInfo _vnTz = TimeZoneInfo.FindSystemTimeZoneById(
            OperatingSystem.IsWindows() ? "SE Asia Standard Time" : "Asia/Ho_Chi_Minh");

        public static DateTime VnNow => TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, _vnTz);

        public static DateTime ConvertToVnTime(DateTime dt)
        {
            if (dt.Kind == DateTimeKind.Utc)
            {
                return TimeZoneInfo.ConvertTimeFromUtc(dt, _vnTz);
            }
            if (dt.Kind == DateTimeKind.Local)
            {
                return TimeZoneInfo.ConvertTime(dt, _vnTz);
            }
            return DateTime.SpecifyKind(dt, DateTimeKind.Unspecified);
        }

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

        public static decimal CalculatePriceForMinutes(int totalMinutes, PricingPolicy? policy)
        {
            if (totalMinutes <= 0) return 0;

            decimal basePrice = policy?.BasePrice ?? (policy?.VehicleTypeId == 1 ? 5000m : 15000m);
            int baseHours = policy?.BaseHours ?? 4;
            decimal subsequentRate = policy?.SubsequentRate ?? 2000m;
            int subsequentHours = policy?.SubsequentHours ?? 1;
            decimal dailyMaxPrice = policy?.DailyMaxPrice ?? 50000m;

            int fullDays = totalMinutes / 1440;
            int remainingMinutes = totalMinutes % 1440;

            decimal remainingPrice = 0;
            if (remainingMinutes > 0)
            {
                if (remainingMinutes <= baseHours * 60)
                {
                    remainingPrice = basePrice;
                }
                else
                {
                    int subsequentMinutes = remainingMinutes - (baseHours * 60);
                    double subsequentBlockMinutes = subsequentHours * 60.0;
                    int subsequentBlocks = (int)Math.Ceiling(subsequentMinutes / subsequentBlockMinutes);
                    remainingPrice = basePrice + (subsequentBlocks * subsequentRate);
                }

                if (remainingPrice > dailyMaxPrice)
                {
                    remainingPrice = dailyMaxPrice;
                }
            }

            return (fullDays * dailyMaxPrice) + remainingPrice;
        }

        /// <summary>
        /// Hàm tính tiền nhận động chuỗi cấu hình giờ hoạt động áp dụng cho ngày hiện tại
        /// </summary>
        public static ParkingFeeResult CalculateParkingFee(DateTime checkInTime, DateTime checkOutTime, PricingPolicy? policy, string operatingHours, int gracePeriodMinutes = 5)
        {
            // 1. Tính tổng số phút thực tế
            TimeSpan duration = checkOutTime - checkInTime;
            int totalMinutes = (int)Math.Ceiling(duration.TotalMinutes);

            // Tránh trường hợp thời gian máy tính bị lệch âm
            if (totalMinutes < 0) totalMinutes = 0;

            decimal actualParkingFee = 0;
            int billedHours = 0;

            // 2. KIỂM TRA ĐIỀU KIỆN ÂN HẠN (GRACE PERIOD)
            if (totalMinutes <= gracePeriodMinutes)
            {
                actualParkingFee = 0;
                billedHours = 0;
            }
            else
            {
                actualParkingFee = CalculatePriceForMinutes(totalMinutes, policy);
                billedHours = (int)Math.Ceiling(totalMinutes / 60.0);
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
                OvernightFee = 0, // Overnight fee is deprecated/built into daily max price
                GracePeriodRemainingSeconds = gracePeriodRemainingSeconds
            };
        }

        public static decimal CalculateBookingEstimatedFee(DateTime expectedArrival, DateTime expiredAt, PricingPolicy? policy)
        {
            var duration = expiredAt - expectedArrival;
            int totalMinutes = (int)Math.Ceiling(duration.TotalMinutes);
            return CalculatePriceForMinutes(totalMinutes, policy);
        }

        public static decimal CalculateEarlyArrivalFee(DateTime checkInTime, DateTime expectedArrival, PricingPolicy? policy, string operatingHours)
        {
            var limit = expectedArrival.AddMinutes(-15);
            if (checkInTime < limit)
            {
                var result = CalculateParkingFee(checkInTime, limit, policy, operatingHours);
                return result.CurrentFee;
            }
            return 0;
        }

        public static decimal CalculateOverdueFee(DateTime checkOutTime, DateTime expiredAt, PricingPolicy? policy)
        {
            if (checkOutTime > expiredAt)
            {
                var overdueMinutes = (checkOutTime - expiredAt).TotalMinutes;
                if (overdueMinutes > 15) // 15-minute grace period
                {
                    decimal subsequentRate = policy?.SubsequentRate ?? 2000m;
                    int subsequentHours = policy?.SubsequentHours ?? 1;
                    var overdueBlocks = (int)Math.Ceiling(overdueMinutes / (subsequentHours * 60.0));
                    return overdueBlocks * subsequentRate * 2;
                }
            }
            return 0;
        }

        public static decimal CalculatePrepaidOvertime(Booking booking, PricingPolicy? policy, int vehicleTypeId)
        {
            if (booking == null) return 0m;
            var totalPaid = booking.Payments?.Where(p => p.Status == "SUCCESS").Sum(p => p.AmountPaid) ?? 0m;
            var depositPayment = booking.Payments?.FirstOrDefault(p => p.PaymentType == "BOOKING" && p.Status == "SUCCESS");
            
            var expectedArrival = ConvertToVnTime(booking.ExpectedArrival);
            var expiredAt = ConvertToVnTime(booking.ExpiredAt ?? expectedArrival.AddHours(2));
            decimal originalEstimatedFee = CalculateBookingEstimatedFee(expectedArrival, expiredAt, policy);

            decimal depositAmount = depositPayment?.AmountPaid ?? originalEstimatedFee;
            return Math.Max(0m, totalPaid - depositAmount);
        }

        public static BookingFeeResult CalculateBookingFeeDetails(
            DateTime? checkInTime,
            DateTime checkOutTime,
            Booking booking,
            PricingPolicy? policy,
            string operatingHours)
        {
            var result = new BookingFeeResult();
            if (booking == null) return result;

            var expectedArrival = ConvertToVnTime(booking.ExpectedArrival);
            var expiredAt = ConvertToVnTime(booking.ExpiredAt ?? expectedArrival.AddHours(2));

            if (checkInTime.HasValue)
            {
                var checkInVn = ConvertToVnTime(checkInTime.Value);
                if (checkInVn < expectedArrival.AddMinutes(-15))
                {
                    var earlyResult = CalculateParkingFee(
                        checkInVn,
                        expectedArrival.AddMinutes(-15),
                        policy,
                        operatingHours
                    );
                    result.EarlyArrivalFee = earlyResult.CurrentFee;
                    result.EarlyHours = earlyResult.Hours;
                    result.OvernightFee = earlyResult.OvernightFee;
                }
            }

            var checkOutVn = ConvertToVnTime(checkOutTime);
            if (checkOutVn > expiredAt)
            {
                var overdueMinutes = (checkOutVn - expiredAt).TotalMinutes;
                if (overdueMinutes > 15) // 15-minute grace period
                {
                    decimal subsequentRate = policy?.SubsequentRate ?? 2000m;
                    int subsequentHours = policy?.SubsequentHours ?? 1;
                    var overdueBlocks = (int)Math.Ceiling(overdueMinutes / (subsequentHours * 60.0));
                    result.LateCheckoutFee = overdueBlocks * subsequentRate * 2;
                    result.LateHours = overdueBlocks;
                }
            }

            result.PrepaidOvertime = CalculatePrepaidOvertime(booking, policy, booking.VehicleTypeId);
            result.TotalFee = Math.Max(0m, result.EarlyArrivalFee + result.LateCheckoutFee - result.PrepaidOvertime);

            return result;
        }

        public static decimal CalculateBookingSessionFee(
            DateTime? checkInTime,
            DateTime checkOutTime,
            Booking booking,
            PricingPolicy? policy,
            string operatingHours)
        {
            var details = CalculateBookingFeeDetails(checkInTime, checkOutTime, booking, policy, operatingHours);
            return details.TotalFee;
        }
    }
}
