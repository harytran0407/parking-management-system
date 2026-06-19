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

        public static DateTime ConvertToVnTime(DateTime dt)
        {
            if (dt.Kind == DateTimeKind.Utc)
            {
                return TimeZoneInfo.ConvertTimeFromUtc(dt, _vnTz);
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

        /// <summary>
        /// Hàm tính tiền nhận động chuỗi cấu hình giờ hoạt động áp dụng cho ngày hiện tại
        /// </summary>
        public static ParkingFeeResult CalculateParkingFee(DateTime checkInTime, DateTime checkOutTime, PricingPolicy? policy, string operatingHours, int gracePeriodMinutes = 5)
        {
            // 1. Tính tổng số phút thực tế
            TimeSpan duration = checkOutTime - checkInTime;
            int totalMinutes = (int)Math.Ceiling(duration.TotalMinutes);

            // Trách trường hợp thời gian máy tính bị lệch âm
            if (totalMinutes < 0) totalMinutes = 0;

            decimal actualParkingFee = 0;
            int billedHours = 0;
            decimal appliedOvernightFee = 0;

            decimal basePrice = policy?.BasePrice ?? 15000m;
            decimal hourlyRate = policy?.HourlyRate ?? 2000m;
            decimal overnightFee = policy?.OvernightFee ?? 0m;

            // Kiểm tra trạng thái phạt lố giờ hoạt động trước
            bool isOvernight = IsOvernightParking(checkInTime, checkOutTime, operatingHours);
            if (isOvernight)
            {
                appliedOvernightFee = overnightFee;
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
                    actualParkingFee = basePrice;

                    // Các tiếng tiếp theo tính lũy tiến theo HourlyRate
                    if (billedHours > 1)
                    {
                        actualParkingFee += (billedHours - 1) * hourlyRate;
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

        public static decimal CalculateBookingEstimatedFee(DateTime expectedArrival, DateTime expiredAt, PricingPolicy? policy)
        {
            decimal basePrice = policy?.BasePrice ?? 15000m;
            decimal hourlyRate = policy?.HourlyRate ?? 2000m;
            var duration = expiredAt - expectedArrival;
            var billedHours = (int)Math.Ceiling(duration.TotalMinutes / 60.0);
            decimal estimatedFee = basePrice + (billedHours > 1 ? (billedHours - 1) * hourlyRate : 0m);
            return estimatedFee;
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
                    decimal hourlyRate = policy?.HourlyRate ?? 2000m;
                    var overdueBlocks = (int)Math.Ceiling(overdueMinutes / 60.0);
                    return overdueBlocks * hourlyRate * 2;
                }
            }
            return 0;
        }

        public static decimal CalculatePrepaidOvertime(Booking booking, PricingPolicy? policy, int vehicleTypeId)
        {
            if (booking == null) return 0m;
            var totalPaid = booking.Payments?.Where(p => p.Status == "SUCCESS").Sum(p => p.AmountPaid) ?? 0m;
            var depositPayment = booking.Payments?.FirstOrDefault(p => p.PaymentType == "BOOKING" && p.Status == "SUCCESS");
            
            decimal basePrice = policy?.BasePrice ?? (vehicleTypeId == 1 ? 5000m : 15000m);
            decimal hourlyRate = policy?.HourlyRate ?? 2000m;
            var expectedArrival = booking.ExpectedArrival;
            var expiredAt = booking.ExpiredAt ?? expectedArrival.AddHours(2);
            var origDuration = expiredAt - expectedArrival;
            var origBilledHours = (int)Math.Ceiling(origDuration.TotalMinutes / 60.0);
            decimal originalEstimatedFee = basePrice + (origBilledHours > 1 ? (origBilledHours - 1) * hourlyRate : 0m);

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

            var expectedArrival = booking.ExpectedArrival;
            var expiredAt = booking.ExpiredAt ?? expectedArrival.AddHours(2);

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
                    decimal hourlyRate = policy?.HourlyRate ?? 2000m;
                    var overdueBlocks = (int)Math.Ceiling(overdueMinutes / 60.0);
                    result.LateCheckoutFee = overdueBlocks * hourlyRate * 2;
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