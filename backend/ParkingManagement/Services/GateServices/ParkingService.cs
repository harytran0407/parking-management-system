using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using ParkingManagement.DTOs;
using ParkingManagement.Models;
using ParkingManagement.Repositories;
using ParkingManagement.Services.Helpers;

namespace ParkingManagement.Services
{
    public class ParkingService : IParkingService
    {
        private readonly IParkingRepository _parkingRepository;
        private readonly PayOS.PayOSClient _payOS;

        private static readonly TimeZoneInfo _vnTz = TimeZoneInfo.FindSystemTimeZoneById(
            OperatingSystem.IsWindows() ? "SE Asia Standard Time" : "Asia/Ho_Chi_Minh");
        private static DateTime VnNow => TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, _vnTz);

        private static DateTime ConvertToVnTime(DateTime dt)
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

        private static decimal CalculatePrepaidOvertime(Booking booking, PricingPolicy policy, int vehicleTypeId)
        {
            return ParkingCalculationHelper.CalculatePrepaidOvertime(booking, policy, vehicleTypeId);
        }

        private static DateTime GetCalculationTimeForBooking(Booking booking, DateTime targetTime)
        {
            if (booking == null) return targetTime;
            var latestPayment = booking.Payments?
                .Where(p => p.Status == "SUCCESS")
                .OrderByDescending(p => p.PaymentTime)
                .FirstOrDefault();

            if (latestPayment != null && latestPayment.PaymentTime.HasValue)
            {
                var paymentTimeVn = ConvertToVnTime(latestPayment.PaymentTime.Value);
                var timeDiffMinutes = (targetTime - paymentTimeVn).TotalMinutes;
                if (timeDiffMinutes >= 0 && timeDiffMinutes <= 5)
                {
                    return paymentTimeVn;
                }
            }
            return targetTime;
        }

        public ParkingService(IParkingRepository parkingRepository, PayOS.PayOSClient payOS)
        {
            _parkingRepository = parkingRepository;
            _payOS = payOS;
        }

        /// HÀM XỬ LÝ ĐIỀU HƯỚNG CHECK-OUT
        public async Task<CheckInResponseDto> ProcessCheckInAsync(VehicleCheckInDto dto, string staffId)
        {
            if (await _parkingRepository.IsVehicleActiveInParkingAsync(dto.LicensePlateIn))
            {
                throw new InvalidOperationException("ACTIVE_SESSION_EXISTS");
            }

            bool hasBooking = await _parkingRepository.HasActiveBookingByLicensePlateAsync(dto.LicensePlateIn, VnNow);

            if (hasBooking)
            {
                return await ProcessBookingCheckInAsync(dto, staffId);
            }
            else
            {
                return await ProcessWalkInCheckInAsync(dto, staffId);
            }
        }

        public async Task<CheckInResponseDto> ProcessWalkInCheckInAsync(VehicleCheckInDto dto, string staffId)
        {
            if (await _parkingRepository.IsVehicleActiveInParkingAsync(dto.LicensePlateIn))
            {
                throw new InvalidOperationException("ACTIVE_SESSION_EXISTS");
            }

            var zone = await _parkingRepository.FindBestAvailableZoneAsync(dto.VehicleTypeId)
                       ?? throw new InvalidOperationException("NO_AVAILABLE_SLOT");

            string sessionId = GenerateSessionId();
            string ticketCode = GenerateTicketCode();
            DateTime checkInTime = VnNow;

            string? savedImageUrl = await SaveBase64ImageAsync(dto.ImageUrlIn, "checkin", sessionId) ?? "/uploads/plates/manual_entry.jpg";

            await _parkingRepository.SaveChangesWithTransactionAsync(async () =>
            {
                await _parkingRepository.DecrementZoneCapacityAsync(zone.ZoneId);

                var session = new ParkingSession
                {
                    SessionId = sessionId,
                    TicketCode = ticketCode,
                    CheckInTime = checkInTime,
                    LicensePlateIn = dto.LicensePlateIn,
                    VehicleTypeId = dto.VehicleTypeId,
                    CameraIn = dto.CameraIn,
                    GateIn = dto.GateIn,
                    ImageUrlIn = savedImageUrl,
                    StaffInId = staffId,
                    ZoneId = zone.ZoneId,
                    SlotId = null,
                    BookingId = dto.BookingId,
                    Status = "ACTIVE",
                    PaymentStatus = "PENDING"
                };
                await _parkingRepository.CreateSessionAsync(session);
            });

            return MapToCheckInResponseDto(sessionId, ticketCode, checkInTime, dto.LicensePlateIn, zone, dto.BookingId);
        }

        public async Task<CheckInResponseDto> ProcessBookingCheckInAsync(VehicleCheckInDto dto, string staffId)
        {
            if (await _parkingRepository.IsVehicleActiveInParkingAsync(dto.LicensePlateIn))
            {
                throw new InvalidOperationException("ACTIVE_SESSION_EXISTS");
            }
        
            var booking = await _parkingRepository.GetValidBookingByLicensePlateAsync(dto.LicensePlateIn, VnNow)
                          ?? throw new KeyNotFoundException("NO_VALID_BOOKING_FOUND_FOR_THIS_PLATE");
        
            var earlyMinutes = (booking.ExpectedArrival - VnNow).TotalMinutes;
            if (earlyMinutes > 15 && !dto.ConfirmEarlyIn)
            {
                throw new InvalidOperationException($"EARLY_CHECKIN_WARNING:{Math.Round(earlyMinutes)}");
            }
        
            FloorZone? zone = null;
            bool usingBookedZone = false;
            if (booking.ZoneId.HasValue)
            {
                var bookingZone = await _parkingRepository.GetZoneByIdAsync(booking.ZoneId.Value);
                if (bookingZone != null && bookingZone.VehicleTypeId == booking.VehicleTypeId && bookingZone.Status == "ACTIVE")
                {
                    // Allow check-in even if AvailableCapacity is 0 because the booking already reserved/decremented it
                    zone = bookingZone;
                    usingBookedZone = true;
                }
            }
            
            if (zone == null)
            {
                // Fallback for older bookings created before the ZoneId fix (where booking.ZoneId was null)
                // Retrieve the first active zone for this vehicle type without checking available capacity
                zone = await _parkingRepository.GetAnyActiveZoneByVehicleTypeAsync(booking.VehicleTypeId);
                if (zone != null)
                {
                    usingBookedZone = true; // Mark as using booked zone so we do NOT double-decrement capacity!
                }
            }
            
            if (zone == null)
            {
                throw new InvalidOperationException("NO_AVAILABLE_SLOT");
            }
        
            string sessionId = GenerateSessionId();
            DateTime checkInTime = VnNow;
        
            string? savedImageUrl = await SaveBase64ImageAsync(dto.ImageUrlIn, "checkin", sessionId) ?? "/uploads/plates/manual_entry.jpg";
        
            await _parkingRepository.SaveChangesWithTransactionAsync(async () =>
            {
                if (!usingBookedZone)
                {
                    // If they check into a different zone:
                    // 1. Decrement new zone capacity
                    await _parkingRepository.DecrementZoneCapacityAsync(zone.ZoneId);
                    
                    // 2. Increment old booked zone capacity to release reservation
                    if (booking.ZoneId.HasValue)
                    {
                        await _parkingRepository.IncrementZoneCapacityAsync(booking.ZoneId.Value);
                    }
                }
                // If usingBookedZone is true, we DO NOT decrement capacity again to avoid double-decrement!
        
                var session = new ParkingSession
                {
                    SessionId = sessionId,
                    TicketCode = null, 
                    CheckInTime = checkInTime,
                    LicensePlateIn = dto.LicensePlateIn,
                    VehicleTypeId = booking.VehicleTypeId,
                    CameraIn = dto.CameraIn,
                    GateIn = dto.GateIn,
                    ImageUrlIn = savedImageUrl,
                    StaffInId = staffId,
                    ZoneId = zone.ZoneId,
                    SlotId = null,
                    BookingId = booking.BookingId, 
                    Status = "ACTIVE",
                    PaymentStatus = "PENDING",
                    IsLocked = null
                };
                await _parkingRepository.CreateSessionAsync(session);
                await _parkingRepository.UpdateBookingStatusAsync(booking.BookingId, "COMPLETED", zone.ZoneId);
            });
        
            return MapToCheckInResponseDto(sessionId, null, checkInTime, dto.LicensePlateIn, zone, booking.BookingId);
        }

        /// HÀM XỬ LÝ ĐIỀU HƯỚNG CHECK-OUT
        public async Task<CheckOutResponseDto> ProcessCheckOutAsync(VehicleCheckOutDto checkOutDto, string staffId)
        {
            ParkingSession? session = null;

            if (!string.IsNullOrEmpty(checkOutDto.BookingId))
            {
                session = await _parkingRepository.GetActiveSessionByBookingIdAsync(checkOutDto.BookingId);
            }

            if (session == null && !string.IsNullOrWhiteSpace(checkOutDto.LicensePlateOut))
            {
                session = await _parkingRepository.GetActiveSessionByPlateAsync(checkOutDto.LicensePlateOut, exactMatch: true);
            }

            if (session == null && !string.IsNullOrEmpty(checkOutDto.TicketCode))
            {
                session = await _parkingRepository.GetActiveSessionByTicketCodeAsync(checkOutDto.TicketCode);
            }

            if (session == null)
            {
                throw new InvalidOperationException("VEHICLE_NOT_FOUND_IN_PARKING");
            }

            if (string.IsNullOrEmpty(checkOutDto.LicensePlateOut))
            {
                checkOutDto.LicensePlateOut = session.LicensePlateIn;
            }

            if (!string.IsNullOrEmpty(session.BookingId))
            {
                return await ProcessBookingCheckOutWithSessionAsync(session, checkOutDto, staffId);
            }
            else
            {
                return await ProcessWalkInCheckOutAsync(session, checkOutDto, staffId);
            }
        }

        public async Task<CheckOutResponseDto> ProcessWalkInCheckOutAsync(ParkingSession session, VehicleCheckOutDto checkOutDto, string staffId)
        {
            var checkOutTime = VnNow;
            int durationMinutes = ParkingCalculationHelper.CalculateDurationMinutes(session.CheckInTime, checkOutTime);

            var policy = await _parkingRepository.GetActivePricingPolicyByVehicleTypeAsync(session.VehicleTypeId)
                        ?? throw new Exception("PRICING_POLICY_NOT_CONFIGURED");

            string operatingHours = await _parkingRepository.GetOperatingHoursForDayAsync(checkOutTime);

            decimal finalFee = 0;

            if (session.PaymentStatus == "PAID")
            {
                // Session đã thanh toán qua QuickPay — kiểm tra thời gian còn lại của giờ đã thanh toán
                var latestPayment = session.Payments
                    .Where(p => p.PaymentType == "SESSION" && p.Status == "SUCCESS")
                    .OrderByDescending(p => p.PaymentTime)
                    .FirstOrDefault();

                if (latestPayment != null && latestPayment.PaymentTime.HasValue)
                {
                    var paidDurationMinutes = (latestPayment.PaymentTime.Value - (session.CheckInTime ?? latestPayment.PaymentTime.Value)).TotalMinutes;
                    if (paidDurationMinutes < 0) paidDurationMinutes = 0;
                    int billedHoursAtPayment = (int)Math.Ceiling(paidDurationMinutes / 60.0);
                    if (billedHoursAtPayment == 0) billedHoursAtPayment = 1;
                    var paidUntilTime = (session.CheckInTime ?? latestPayment.PaymentTime.Value).AddMinutes(billedHoursAtPayment * 60);

                    if (checkOutTime > paidUntilTime)
                    {
                        // Tính phí thêm cho thời gian vượt quá block giờ đã thanh toán
                        var extraFeeResult = ParkingCalculationHelper.CalculateParkingFee(
                            paidUntilTime,
                            checkOutTime,
                            policy,
                            operatingHours
                        );
                        finalFee = extraFeeResult.CurrentFee;
                    }
                    // else: nằm trong block giờ đã thanh toán → finalFee = 0
                }
            }
            else
            {
                var feeResult = ParkingCalculationHelper.CalculateParkingFee(
                    session.CheckInTime ?? VnNow,
                    checkOutTime,
                    policy,
                    operatingHours
                );
                finalFee = feeResult.CurrentFee;
            }

            string? savedImageUrl = await SaveBase64ImageAsync(checkOutDto.ImageUrlOut, "checkout", session.SessionId);
            checkOutDto.ImageUrlOut = savedImageUrl;

            await _parkingRepository.SaveChangesWithTransactionAsync(async () =>
            {
                UpdateSessionForCheckOut(session, checkOutDto, staffId, checkOutTime, durationMinutes, finalFee);
                session.TicketCode = null;
                await _parkingRepository.UpdateSessionAsync(session);

                if (session.ZoneId.HasValue)
                {
                    await _parkingRepository.IncrementZoneCapacityAsync(session.ZoneId.Value);
                }

                if (finalFee > 0)
                {
                    var payment = new Payment
                    {
                        PaymentId = "PAY-CO-" + Guid.NewGuid().ToString("N").Substring(0, 10).ToUpper(),
                        PaymentType = "SESSION",
                        SessionId = session.SessionId,
                        AmountDue = finalFee,
                        AmountPaid = finalFee,
                        ChangeDue = 0,
                        PaymentMethod = "CASH",
                        Status = "SUCCESS",
                        UserId = null,
                        PaymentTime = checkOutTime,
                        TransactionId = "CASH_" + Guid.NewGuid().ToString("N").Substring(0, 12).ToUpper()
                    };
                    await _parkingRepository.CreatePaymentAsync(payment);
                }
            });

            return MapToCheckOutResponseDto(session, finalFee, durationMinutes, checkOutTime);
        }


        private async Task<CheckOutResponseDto> ProcessBookingCheckOutWithSessionAsync(ParkingSession session, VehicleCheckOutDto checkOutDto, string staffId)
        {
            if (string.IsNullOrEmpty(session.BookingId))
            {
                throw new InvalidOperationException("NOT_A_BOOKING_VEHICLE_USE_WALKIN_FLOW_INSTEAD");
            }

            // Check Smart Lock status:
            // - If IsLocked is null (default), auto-unlock 5 minutes before ExpiredAt.
            // - If IsLocked is explicitly true, the user manually locked it. Respect it and keep it locked forever (until manual unlock).
            // - If IsLocked is false, it is unlocked.
            bool isLocked = session.IsLocked ?? true;
            if (session.IsLocked == null && isLocked && session.Booking != null && session.Booking.ExpiredAt.HasValue)
            {
                if (VnNow >= session.Booking.ExpiredAt.Value.AddMinutes(-5))
                {
                    isLocked = false;
                }
            }

            if (isLocked)
            {
                throw new InvalidOperationException("VEHICLE_IS_LOCKED");
            }

            var checkOutTime = VnNow;
            var calculationCheckOutTime = checkOutTime;
            if (session.Booking != null)
            {
                calculationCheckOutTime = GetCalculationTimeForBooking(session.Booking, checkOutTime);
            }

            int durationMinutes = ParkingCalculationHelper.CalculateDurationMinutes(session.CheckInTime, checkOutTime);
            var policy = await _parkingRepository.GetActivePricingPolicyByVehicleTypeAsync(session.VehicleTypeId)
                        ?? throw new Exception("PRICING_POLICY_NOT_CONFIGURED");
            string operatingHours = await _parkingRepository.GetOperatingHoursForDayAsync(checkOutTime);

            decimal totalExtraFee = 0;

            if (session.PaymentStatus == "PAID")
            {
                // Session đã thanh toán qua QuickPay — kiểm tra thời gian còn lại của giờ đã thanh toán
                var latestPayment = session.Payments
                    .Where(p => p.PaymentType == "SESSION" && p.Status == "SUCCESS")
                    .OrderByDescending(p => p.PaymentTime)
                    .FirstOrDefault();

                if (latestPayment != null && latestPayment.PaymentTime.HasValue)
                {
                    var paidDurationMinutes = (latestPayment.PaymentTime.Value - (session.CheckInTime ?? latestPayment.PaymentTime.Value)).TotalMinutes;
                    if (paidDurationMinutes < 0) paidDurationMinutes = 0;
                    int billedHoursAtPayment = (int)Math.Ceiling(paidDurationMinutes / 60.0);
                    if (billedHoursAtPayment == 0) billedHoursAtPayment = 1;
                    var paidUntilTime = (session.CheckInTime ?? latestPayment.PaymentTime.Value).AddMinutes(billedHoursAtPayment * 60);

                    if (checkOutTime > paidUntilTime)
                    {
                        var extraFeeResult = ParkingCalculationHelper.CalculateParkingFee(
                            paidUntilTime,
                            checkOutTime,
                            policy,
                            operatingHours
                        );
                        totalExtraFee = extraFeeResult.CurrentFee;
                    }
                }
            }
            else
            {
                if (session.Booking != null)
                {
                    totalExtraFee = ParkingCalculationHelper.CalculateBookingSessionFee(
                        session.CheckInTime,
                        calculationCheckOutTime,
                        session.Booking,
                        policy,
                        operatingHours
                    );
                }
            }

            string? savedImageUrl = await SaveBase64ImageAsync(checkOutDto.ImageUrlOut, "checkout", session.SessionId);
            checkOutDto.ImageUrlOut = savedImageUrl;

            await _parkingRepository.SaveChangesWithTransactionAsync(async () =>
            {
                session.LicensePlateOut = checkOutDto.LicensePlateOut;
                session.CameraOut = checkOutDto.CameraOut;
                session.GateOut = checkOutDto.GateOut;
                session.ImageUrlOut = checkOutDto.ImageUrlOut;
                session.StaffOutId = staffId;
                session.CheckOutTime = checkOutTime;
                session.DurationMinutes = durationMinutes;
                session.TotalFee = totalExtraFee;

                session.PaymentStatus = "PAID"; 
                session.Status = "COMPLETED";
                await _parkingRepository.UpdateSessionAsync(session);

                if (session.ZoneId.HasValue)
                {
                    await _parkingRepository.IncrementZoneCapacityAsync(session.ZoneId.Value);
                }

                if (totalExtraFee > 0)
                {
                    var payment = new Payment
                    {
                        PaymentId = "PAY-CO-" + Guid.NewGuid().ToString("N").Substring(0, 10).ToUpper(),
                        PaymentType = "SESSION",
                        SessionId = session.SessionId,
                        AmountDue = totalExtraFee,
                        AmountPaid = totalExtraFee,
                        ChangeDue = 0,
                        PaymentMethod = "CASH",
                        Status = "SUCCESS",
                        UserId = null,
                        PaymentTime = checkOutTime,
                        TransactionId = "CASH_" + Guid.NewGuid().ToString("N").Substring(0, 12).ToUpper()
                    };
                    await _parkingRepository.CreatePaymentAsync(payment);
                }
            });

            return MapToCheckOutResponseDto(session, totalExtraFee, durationMinutes, checkOutTime);
        }       

        private async Task<decimal> CalculateCurrentFeeForSessionAsync(ParkingSession session, DateTime currentTime)
        {
            decimal currentFee = 0;

            if (session.PaymentStatus == "PAID")
            {
                var latestPayment = session.Payments
                    .Where(p => p.PaymentType == "SESSION" && p.Status == "SUCCESS")
                    .OrderByDescending(p => p.PaymentTime)
                    .FirstOrDefault();

                if (latestPayment != null && latestPayment.PaymentTime.HasValue)
                {
                    var paidDurationMinutes = (latestPayment.PaymentTime.Value - (session.CheckInTime ?? latestPayment.PaymentTime.Value)).TotalMinutes;
                    if (paidDurationMinutes < 0) paidDurationMinutes = 0;
                    int billedHoursAtPayment = (int)Math.Ceiling(paidDurationMinutes / 60.0);
                    if (billedHoursAtPayment == 0) billedHoursAtPayment = 1;
                    var paidUntilTime = (session.CheckInTime ?? latestPayment.PaymentTime.Value).AddMinutes(billedHoursAtPayment * 60);

                    if (currentTime > paidUntilTime)
                    {
                        var policy = await _parkingRepository.GetActivePricingPolicyByVehicleTypeAsync(session.VehicleTypeId);
                        if (policy != null)
                        {
                            string operatingHours = await _parkingRepository.GetOperatingHoursForDayAsync(currentTime);
                            var extraFeeResult = ParkingCalculationHelper.CalculateParkingFee(
                                paidUntilTime,
                                currentTime,
                                policy,
                                operatingHours
                            );
                            currentFee = extraFeeResult.CurrentFee;
                        }
                    }
                }
            }
            else
            {
                var policy = await _parkingRepository.GetActivePricingPolicyByVehicleTypeAsync(session.VehicleTypeId);
                if (policy != null)
                {
                    string operatingHours = await _parkingRepository.GetOperatingHoursForDayAsync(currentTime);

                    if (!string.IsNullOrEmpty(session.BookingId) && session.Booking != null)
                    {
                        var currentVnTime = ConvertToVnTime(currentTime);
                        var calculationTime = GetCalculationTimeForBooking(session.Booking, currentVnTime);
                        currentFee = ParkingCalculationHelper.CalculateBookingSessionFee(
                            session.CheckInTime,
                            calculationTime,
                            session.Booking,
                            policy,
                            operatingHours
                        );
                    }
                    else
                    {
                        var feeResult = ParkingCalculationHelper.CalculateParkingFee(
                            session.CheckInTime ?? VnNow,
                            currentTime,
                            policy,
                            operatingHours
                        );
                        currentFee = feeResult.CurrentFee;
                    }
                }
            }
            return currentFee;
        }

        public async Task<ActiveSessionResponseDto> GetActiveSessionByLicensePlateAsync(string licensePlate, string? ticketCode = null, bool exactMatch = false)
        {
            var session = await _parkingRepository.GetActiveSessionByPlateAsync(licensePlate, exactMatch)
                          ?? throw new InvalidOperationException("INVALID_TICKET");

            if (ticketCode != null)
            {
                // Must be walk-in (no BookingId)
                if (!string.IsNullOrEmpty(session.BookingId))
                {
                    throw new InvalidOperationException("QUICK_PAY_ONLY_FOR_WALKIN");
                }

                // Check ticket code (exact match)
                if (string.IsNullOrEmpty(session.TicketCode) || 
                    !session.TicketCode.Equals(ticketCode.Trim(), StringComparison.OrdinalIgnoreCase))
                {
                    throw new InvalidOperationException("WRONG_TICKET_CODE");
                }
            }

            if (session.PaymentStatus != "PAID")
            {
                var pendingPayOsPayment = session.Payments
                    .Where(p => p.PaymentMethod == "PAYOS" && p.Status == "PENDING")
                    .OrderByDescending(p => p.PaymentTime)
                    .FirstOrDefault();

                if (pendingPayOsPayment != null)
                {
                    try
                    {
                        string paymentId = pendingPayOsPayment.PaymentId;
                        string hexPart = paymentId.Replace("pay_", "");
                        long orderCode = Convert.ToInt64(hexPart, 16);

                        var payOsInfo = await _payOS.PaymentRequests.GetAsync(orderCode);
                        if (payOsInfo != null && payOsInfo.Status.ToString().Equals("PAID", StringComparison.OrdinalIgnoreCase))
                        {
                            pendingPayOsPayment.Status = "SUCCESS";
                            pendingPayOsPayment.TransactionId = "payos_" + Guid.NewGuid().ToString().Substring(0, 8).ToUpper();
                            pendingPayOsPayment.PaymentTime = VnNow;
                            pendingPayOsPayment.AmountPaid = payOsInfo.Amount;

                            session.PaymentStatus = "PAID";
                            session.TotalFee = payOsInfo.Amount;

                            await _parkingRepository.UpdateSessionAsync(session);
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Error checking PayOS status: {ex.Message}");
                    }
                }
            }

            var currentTime = VnNow;
            int durationMinutes = ParkingCalculationHelper.CalculateDurationMinutes(session.CheckInTime, currentTime);
            decimal currentFee = await CalculateCurrentFeeForSessionAsync(session, currentTime);
            var policy = await _parkingRepository.GetActivePricingPolicyByVehicleTypeAsync(session.VehicleTypeId);

            return MapToActiveSessionResponseDto(session, durationMinutes, currentFee, policy);
        }

        public async Task<ActiveSessionResponseDto> GetActiveSessionByTicketCodeAsync(string ticketCode)
        {
            var session = await _parkingRepository.GetActiveSessionByTicketCodeAsync(ticketCode)
                          ?? throw new InvalidOperationException("INVALID_TICKET");

            if (session.PaymentStatus != "PAID")
            {
                var pendingPayOsPayment = session.Payments
                    .Where(p => p.PaymentMethod == "PAYOS" && p.Status == "PENDING")
                    .OrderByDescending(p => p.PaymentTime)
                    .FirstOrDefault();

                if (pendingPayOsPayment != null)
                {
                    try
                    {
                        string paymentId = pendingPayOsPayment.PaymentId;
                        string hexPart = paymentId.Replace("pay_", "");
                        long orderCode = Convert.ToInt64(hexPart, 16);

                        var payOsInfo = await _payOS.PaymentRequests.GetAsync(orderCode);
                        if (payOsInfo != null && payOsInfo.Status.ToString().Equals("PAID", StringComparison.OrdinalIgnoreCase))
                        {
                            pendingPayOsPayment.Status = "SUCCESS";
                            pendingPayOsPayment.TransactionId = "payos_" + Guid.NewGuid().ToString().Substring(0, 8).ToUpper();
                            pendingPayOsPayment.PaymentTime = VnNow;
                            pendingPayOsPayment.AmountPaid = payOsInfo.Amount;

                            session.PaymentStatus = "PAID";
                            session.TotalFee = payOsInfo.Amount;

                            await _parkingRepository.UpdateSessionAsync(session);
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Error checking PayOS status: {ex.Message}");
                    }
                }
            }

            var currentTime = VnNow;
            int durationMinutes = ParkingCalculationHelper.CalculateDurationMinutes(session.CheckInTime, currentTime);
            decimal currentFee = await CalculateCurrentFeeForSessionAsync(session, currentTime);
            var policy = await _parkingRepository.GetActivePricingPolicyByVehicleTypeAsync(session.VehicleTypeId);

            return MapToActiveSessionResponseDto(session, durationMinutes, currentFee, policy);
        }

        public async Task<object> ProcessQuickPayPaymentAsync(string sessionId, QuickPayRequestDto dto, string? userId)
        {
            var session = await _parkingRepository.GetActiveSessionByIdAsync(sessionId);
            if (session == null) throw new InvalidOperationException("ACTIVE_SESSION_NOT_FOUND");

            var currentTime = VnNow;

            // Kiểm tra thời gian ân hạn
            int graceSeconds = 0;
            if (session.PaymentStatus == "PAID")
            {
                var latestPayment = session.Payments
                    .Where(p => p.PaymentType == "SESSION" && p.Status == "SUCCESS")
                    .OrderByDescending(p => p.PaymentTime)
                    .FirstOrDefault();

                if (latestPayment != null && latestPayment.PaymentTime.HasValue)
                {
                    var paidDurationMinutes = (latestPayment.PaymentTime.Value - (session.CheckInTime ?? latestPayment.PaymentTime.Value)).TotalMinutes;
                    if (paidDurationMinutes < 0) paidDurationMinutes = 0;
                    int billedHoursAtPayment = (int)Math.Ceiling(paidDurationMinutes / 60.0);
                    if (billedHoursAtPayment == 0) billedHoursAtPayment = 1;
                    var paidUntilTime = (session.CheckInTime ?? latestPayment.PaymentTime.Value).AddMinutes(billedHoursAtPayment * 60);

                    if (currentTime <= paidUntilTime)
                    {
                        graceSeconds = (int)(paidUntilTime - currentTime).TotalSeconds;
                    }
                }
            }
            else
            {
                var policy = await _parkingRepository.GetActivePricingPolicyByVehicleTypeAsync(session.VehicleTypeId);
                if (policy != null)
                {
                    string operatingHours = await _parkingRepository.GetOperatingHoursForDayAsync(currentTime);
                    var feeResult = ParkingCalculationHelper.CalculateParkingFee(
                        session.CheckInTime ?? VnNow,
                        currentTime,
                        policy,
                        operatingHours
                    );
                    graceSeconds = feeResult.GracePeriodRemainingSeconds;
                }
            }

            if (graceSeconds > 0)
            {
                throw new InvalidOperationException("Phiên đỗ xe đang trong thời gian ân hạn, không cần thanh toán.");
            }

            decimal currentFee = await CalculateCurrentFeeForSessionAsync(session, currentTime);

            if (dto.PaymentMethod?.ToUpper() == "PAYOS")
            {
                string hexPart = Guid.NewGuid().ToString().Substring(0, 8);
                string paymentId = "pay_" + hexPart;

                var payment = new Payment
                {
                    PaymentId = paymentId,
                    PaymentType = "SESSION",
                    SessionId = session.SessionId,
                    AmountDue = currentFee,
                    AmountPaid = 0,
                    ChangeDue = 0,
                    PaymentMethod = "PAYOS",
                    Status = "PENDING",
                    UserId = userId,
                    PaymentTime = null
                };

                await _parkingRepository.CreatePaymentAsync(payment);

                long orderCode = Convert.ToInt64(hexPart, 16);
                string returnUrl = (dto.ReturnUrl ?? "http://localhost:5173/user/quick-pay?status=success").Trim();
                string cancelUrl = (dto.CancelUrl ?? "http://localhost:5173/user/quick-pay?status=cancelled").Trim();

                var paymentRequestData = new PayOS.Models.V2.PaymentRequests.CreatePaymentLinkRequest
                {
                    OrderCode = orderCode,
                    Amount = (long)currentFee,
                    Description = "Thanh toan phi do xe",
                    ReturnUrl = returnUrl,
                    CancelUrl = cancelUrl
                };

                var createPaymentResult = await _payOS.PaymentRequests.CreateAsync(paymentRequestData);

                return new
                {
                    success = true,
                    payment_method = "PAYOS",
                    payment_url = createPaymentResult.CheckoutUrl
                };
            }
            else
            {
                await _parkingRepository.MarkSessionPaidAsync(session, currentFee);
                return new
                {
                    success = true,
                    payment_method = "MOCK",
                    message = "Thanh toán QuickPay thành công. Bạn có 15 phút để ra khỏi bãi xe."
                };
            }
        }

        public async Task<ActiveSessionResponseDto> GetActiveSessionBySlotNameAsync(string slotName)
        {
            var slot = await _parkingRepository.GetSlotByNameAsync(slotName);
            if (slot == null) throw new InvalidOperationException("SLOT_NOT_FOUND");
        
            var session = await _parkingRepository.GetActiveSessionBySlotIdAsync(slot.SlotId)
                          ?? throw new InvalidOperationException("ACTIVE_SESSION_NOT_FOUND");
        
            return await GetActiveSessionByLicensePlateAsync(session.LicensePlateIn);
        }

        public async Task<PreCheckOutResponseDto> CalculatePreCheckOutFeeAsync(string sessionId)
        {
            var session = await _parkingRepository.GetActiveSessionByIdAsync(sessionId)
                          ?? throw new InvalidOperationException("INVALID_TICKET");

            var currentTime = VnNow;

            var policy = await _parkingRepository.GetActivePricingPolicyByVehicleTypeAsync(session.VehicleTypeId)
                         ?? throw new InvalidOperationException("PRICING_POLICY_NOT_CONFIGURED");

            string operatingHours = await _parkingRepository.GetOperatingHoursForDayAsync(currentTime);

            decimal totalFee = 0;
            int hours = 0;
            decimal overnightFee = 0;
            int graceSeconds = 0;

            if (session.PaymentStatus == "PAID")
            {
                var latestPayment = session.Payments
                    .Where(p => p.PaymentType == "SESSION" && p.Status == "SUCCESS")
                    .OrderByDescending(p => p.PaymentTime)
                    .FirstOrDefault();

                if (latestPayment != null && latestPayment.PaymentTime.HasValue)
                {
                    var paidDurationMinutes = (latestPayment.PaymentTime.Value - (session.CheckInTime ?? latestPayment.PaymentTime.Value)).TotalMinutes;
                    if (paidDurationMinutes < 0) paidDurationMinutes = 0;
                    int billedHoursAtPayment = (int)Math.Ceiling(paidDurationMinutes / 60.0);
                    if (billedHoursAtPayment == 0) billedHoursAtPayment = 1;
                    var paidUntilTime = (session.CheckInTime ?? latestPayment.PaymentTime.Value).AddMinutes(billedHoursAtPayment * 60);

                    if (currentTime > paidUntilTime)
                    {
                        var extraFeeResult = ParkingCalculationHelper.CalculateParkingFee(
                            paidUntilTime,
                            currentTime,
                            policy,
                            operatingHours
                        );
                        totalFee = extraFeeResult.CurrentFee;
                        hours = extraFeeResult.Hours;
                        overnightFee = extraFeeResult.OvernightFee;
                        graceSeconds = 0;
                    }
                    else
                    {
                        totalFee = 0;
                        hours = 0;
                        overnightFee = 0;
                        graceSeconds = (int)(paidUntilTime - currentTime).TotalSeconds;
                    }
                }
            }
            else if (!string.IsNullOrEmpty(session.BookingId) && session.Booking != null)
            {
                var currentVnTime = ConvertToVnTime(currentTime);
                var calculationTime = GetCalculationTimeForBooking(session.Booking, currentVnTime);

                var details = ParkingCalculationHelper.CalculateBookingFeeDetails(
                    session.CheckInTime,
                    calculationTime,
                    session.Booking,
                    policy,
                    operatingHours
                );

                totalFee = details.TotalFee;
                hours = details.EarlyHours + details.LateHours;
                overnightFee = details.OvernightFee;
            }
            else
            {
                var feeResult = ParkingCalculationHelper.CalculateParkingFee(
                    session.CheckInTime ?? VnNow,
                    currentTime,
                    policy,
                    operatingHours
                );
                totalFee = feeResult.CurrentFee;
                hours = feeResult.Hours;
                overnightFee = feeResult.OvernightFee;
                graceSeconds = feeResult.GracePeriodRemainingSeconds;
            }

            var dummyFeeResult = new ParkingFeeResult
            {
                CurrentFee = totalFee,
                Hours = hours,
                OvernightFee = overnightFee,
                GracePeriodRemainingSeconds = graceSeconds
            };

            return MapToPreCheckOutResponseDto(session, policy, dummyFeeResult);
        }

        public async Task<SlotStatusResponseDto> UpdateSlotStatusAsync(UpdateSlotStatusDto dto, string staffId)
        {
            var validStatuses = new[] { "AVAILABLE", "OCCUPIED", "RESERVED", "MAINTENANCE" };
            string upperStatus = dto.Status.ToUpper();

            if (!validStatuses.Contains(upperStatus))
            {
                throw new ArgumentException("INVALID_SLOT_STATUS");
            }

            var slot = await _parkingRepository.GetSlotByIdAsync(dto.SlotId);
            if (slot == null)
            {
                throw new KeyNotFoundException("SLOT_NOT_AVAILABLE");
            }

            string oldStatus = (slot.Status ?? "AVAILABLE").ToUpper();

            if (slot.Status == "OCCUPIED" && (upperStatus == "AVAILABLE" || upperStatus == "RESERVED"))
            {
                if (string.IsNullOrWhiteSpace(dto.Reason))
                {
                    throw new ArgumentException("MANUAL_FREE_REQUIRES_A_VALID_REASON");
                }
            }

            if (upperStatus == "MAINTENANCE" && slot.Status == "OCCUPIED")
            {
                throw new InvalidOperationException("CANNOT_MAINTAIN_OCCUPIED_SLOT");
            }

            if (upperStatus == "MAINTENANCE" && slot.Status == "RESERVED")
            {
                throw new InvalidOperationException("CANNOT_MAINTAIN_RESERVED_SLOT");
            }

            bool isUpdated = false;

            await _parkingRepository.SaveChangesWithTransactionAsync(async () =>
            {
                isUpdated = await _parkingRepository.UpdateSlotStatusWithLogAsync(dto.SlotId, upperStatus, staffId, dto.Reason, dto.EstimatedDurationMinutes);
                
                if (isUpdated)
                {
                    if (upperStatus == "MAINTENANCE" && oldStatus == "AVAILABLE")
                    {
                        await _parkingRepository.DecrementZoneCapacityAsync(slot.ZoneId);
                    }
                    else if (upperStatus == "AVAILABLE" && oldStatus == "MAINTENANCE")
                    {
                        await _parkingRepository.IncrementZoneCapacityAsync(slot.ZoneId);
                    }
                }
            });

            if (!isUpdated)
            {
                throw new InvalidOperationException("DATABASE_UPDATE_FAILED");
            }

            return new SlotStatusResponseDto
            {
                Success = true,
                Message = "Slot status updated successfully.",
                Data = new SlotStatusResponseData
                {
                    SlotId = slot.SlotId,
                    SlotName = slot.SlotName ?? "Unknown",
                    Status = upperStatus,
                    LastUpdated = VnNow
                }
            };
        }

        public async Task<List<ZoneRealtimeStatsDto>> GetZoneRealtimeStatsAsync()
        {
            return await _parkingRepository.GetZoneRealtimeStatsAsync();
        }

        public async Task<BulkUpdateSlotStatusResponseDto> BulkUpdateSlotStatusAsync(BulkUpdateSlotStatusDto dto, string staffId)
        {
            var validStatuses = new[] { "AVAILABLE", "MAINTENANCE" };
            string upperStatus = dto.Status.ToUpper();

            if (!validStatuses.Contains(upperStatus))
            {
                throw new ArgumentException("INVALID_SLOT_STATUS_FOR_BULK_UPDATE");
            }

            if (dto.SlotIds == null || !dto.SlotIds.Any())
            {
                throw new ArgumentException("NO_SLOTS_SELECTED");
            }

            var updatedSlotIds = new List<string>();

            await _parkingRepository.SaveChangesWithTransactionAsync(async () =>
            {
                foreach (var slotId in dto.SlotIds)
                {
                    var slot = await _parkingRepository.GetSlotByIdAsync(slotId);
                    if (slot == null)
                    {
                        throw new KeyNotFoundException($"SLOT_NOT_AVAILABLE:{slotId}");
                    }

                    string oldStatus = (slot.Status ?? "AVAILABLE").ToUpper();

                    if (upperStatus == "MAINTENANCE")
                    {
                        if (oldStatus == "OCCUPIED")
                        {
                            throw new InvalidOperationException($"CANNOT_MAINTAIN_OCCUPIED_SLOT:{slot.SlotName}");
                        }
                        if (oldStatus == "RESERVED")
                        {
                            throw new InvalidOperationException($"CANNOT_MAINTAIN_RESERVED_SLOT:{slot.SlotName}");
                        }

                        if (oldStatus == "AVAILABLE")
                        {
                            bool isUpdated = await _parkingRepository.UpdateSlotStatusWithLogAsync(
                                slotId, 
                                "MAINTENANCE", 
                                staffId, 
                                dto.Reason, 
                                dto.EstimatedDurationMinutes
                            );
                            if (isUpdated)
                            {
                                await _parkingRepository.DecrementZoneCapacityAsync(slot.ZoneId);
                                updatedSlotIds.Add(slotId);
                            }
                        }
                        else if (oldStatus == "MAINTENANCE")
                        {
                            bool isUpdated = await _parkingRepository.UpdateSlotStatusWithLogAsync(
                                slotId, 
                                "MAINTENANCE", 
                                staffId, 
                                dto.Reason, 
                                dto.EstimatedDurationMinutes
                            );
                            if (isUpdated)
                            {
                                updatedSlotIds.Add(slotId);
                            }
                        }
                    }
                    else if (upperStatus == "AVAILABLE")
                    {
                        if (oldStatus == "OCCUPIED" || oldStatus == "RESERVED")
                        {
                            throw new InvalidOperationException($"CANNOT_BULK_FREE_OCCUPIED_OR_RESERVED_SLOT:{slot.SlotName}");
                        }

                        if (oldStatus == "MAINTENANCE")
                        {
                            bool isUpdated = await _parkingRepository.UpdateSlotStatusWithLogAsync(
                                slotId, 
                                "AVAILABLE", 
                                staffId, 
                                dto.Reason, 
                                0
                            );
                            if (isUpdated)
                            {
                                await _parkingRepository.IncrementZoneCapacityAsync(slot.ZoneId);
                                updatedSlotIds.Add(slotId);
                            }
                        }
                        else if (oldStatus == "AVAILABLE")
                        {
                            updatedSlotIds.Add(slotId);
                        }
                    }
                }
            });

            return new BulkUpdateSlotStatusResponseDto
            {
                Success = true,
                Message = $"Cập nhật thành công {updatedSlotIds.Count} ô đỗ sang trạng thái {upperStatus}.",
                UpdatedSlotIds = updatedSlotIds
            };
        }

        public async Task<ParkingSlotsResponseDto> GetRealtimeSlotsAsync(SlotQueryFilterDto filter)
        {
            var (slots, totalCount, statusCounts) = await _parkingRepository.GetPagedSlotsWithStatusAsync(filter);

            var response = new ParkingSlotsResponseDto();

            response.Data.Summary = new SlotSummaryDto
            {
                TotalSlots = statusCounts["TOTAL"],
                Available = statusCounts["AVAILABLE"],
                Occupied = statusCounts["OCCUPIED"],
                Reserved = statusCounts["RESERVED"],
                Maintenance = statusCounts["MAINTENANCE"]
            };

            int totalPages = (int)Math.Ceiling((double)totalCount / filter.PageSize);
            response.Data.Pagination = new PaginationDto
            {
                Page = filter.Page,
                PageSize = filter.PageSize,
                TotalItems = totalCount,
                TotalPages = totalPages == 0 ? 1 : totalPages
            };

            foreach (var slot in slots)
            {
                var activeSession = slot.ParkingSessions?
                    .FirstOrDefault(ps => ps.Status == "ACTIVE" || ps.SessionId == slot.CurrentSessionId);

                var slotDetail = new SlotDetailDto
                {
                    SlotId = slot.SlotId,
                    SlotName = slot.SlotName,
                    Floor = slot.Zone?.FloorNumber ?? 0,
                    Zone = slot.Zone?.ZoneName ?? "N/A",
                    VehicleTypeId = slot.Zone?.VehicleTypeId ?? 0,
                    Status = slot.Status ?? "AVAILABLE",
                    IsHandicap = slot.IsHandicap ?? false,
                    IsElectricCharging = slot.IsElectricCharging ?? false,
                    CurrentSessionId = slot.CurrentSessionId,
                    LastUpdated = slot.LastUpdated,
                    OccupiedByPlate = slot.Status == "OCCUPIED" ? activeSession?.LicensePlateIn : null,
                    OccupiedSince = slot.Status == "OCCUPIED" ? activeSession?.CheckInTime : null
                };

                response.Data.Slots.Add(slotDetail);
            }

            return response;
        }

        public async Task<PagedHistoryResponseDto> GetParkingHistoryAsync(ParkingHistoryFilterDto filter)
        {
            var (items, totalCount) = await _parkingRepository.GetParkingHistoryAsync(
        filter.LicensePlate,
        filter.FromDate,
        filter.ToDate,
        filter.VehicleType,
        filter.Status,
        filter.Page,
        filter.PageSize
            );
        
            var historyItems = items.Select(s => new ParkingHistoryItemDto
            {
                SessionId = s.SessionId,
                LicensePlate = s.LicensePlateIn ?? s.LicensePlateOut ?? "N/A",
                VehicleType = s.VehicleTypeId.ToString(),
                SlotNumber = s.Slot?.SlotName ?? "N/A",
                ZoneName = s.Zone?.ZoneName ?? s.Slot?.Zone?.ZoneName ?? "N/A",
                CheckInTime = s.CheckInTime ?? VnNow,
                CheckOutTime = s.CheckOutTime,
                TotalFee = s.TotalFee ?? 0,
                PaymentStatus = s.Status == "ACTIVE" ? "PARKING" : (s.PaymentStatus ?? "COMPLETED"),
                StaffCheckIn = s.StaffInId ?? "System",
                StaffCheckOut = s.StaffOutId,
                
                Status = s.Status?.ToUpper() ?? (s.CheckOutTime.HasValue ? "COMPLETED" : "ACTIVE"),
                ImageUrlIn = s.ImageUrlIn,
                ImageUrlOut = s.ImageUrlOut
            }).ToList();
        
            return new PagedHistoryResponseDto
            {
                Success = true,
                Data = historyItems,
                TotalRecords = totalCount,
                Page = filter.Page,
                PageSize = filter.PageSize
            };
        }

        #region Private Sub-Functions (Các hàm phụ trợ nội bộ giúp code gọn gàng)


        private string GenerateSessionId() => "sess_" + Guid.NewGuid().ToString("N").Substring(0, 10).ToLower();

        private void UpdateSessionForCheckOut(ParkingSession session, VehicleCheckOutDto dto, string staffId, DateTime checkOutTime, int duration, decimal fee)
        {
            session.LicensePlateOut = dto.LicensePlateOut;
            session.CameraOut = dto.CameraOut;
            session.GateOut = dto.GateOut;
            session.ImageUrlOut = dto.ImageUrlOut;
            session.StaffOutId = staffId;
            session.CheckOutTime = checkOutTime;
            session.DurationMinutes = duration;
            session.TotalFee = fee;
            session.Status = "COMPLETED";
            session.PaymentStatus = "PAID";
        }

        private string GenerateTicketCode()
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            var random = new Random();
            var randomString = new string(Enumerable.Repeat(chars, 5)
                                                    .Select(s => s[random.Next(s.Length)]).ToArray());
            return $"TICKET-{randomString}"; // Ví dụ: TICKET-X9R2A
        }

        private async Task<string?> SaveBase64ImageAsync(string? base64OrUrl, string prefix, string id)
        {
            if (string.IsNullOrEmpty(base64OrUrl)) return null;

            if (base64OrUrl.StartsWith("data:image"))
            {
                try
                {
                    var parts = base64OrUrl.Split(',');
                    var base64Data = parts.Length > 1 ? parts[1] : parts[0];
                    var imageBytes = Convert.FromBase64String(base64Data);

                    var uploadFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "plates");
                    if (!Directory.Exists(uploadFolder))
                    {
                        Directory.CreateDirectory(uploadFolder);
                    }

                    var fileName = $"{prefix}_{id}_{VnNow:yyyyMMddHHmmss}.jpg";
                    var filePath = Path.Combine(uploadFolder, fileName);
                    await File.WriteAllBytesAsync(filePath, imageBytes);

                    return $"/uploads/plates/{fileName}";
                }
                catch (Exception)
                {
                    return null;
                }
            }

            return base64OrUrl;
        }

        #endregion

        #region Data Mappers (Chuyển đổi DTO tách biệt luồng xử lý)

        private CheckInResponseDto MapToCheckInResponseDto(string sessId, string? ticketCode, DateTime time, string plate, FloorZone zone, string? bookingId = null)
        {
            return new CheckInResponseDto
            {
                Success = true,
                Data = new CheckInResultDataDto
                {
                    SessionId = sessId,
                    TicketCode = ticketCode,
                    LicensePlateIn = plate,
                    ZoneId = zone.ZoneId,
                    ZoneName = zone.ZoneName,
                    Floor = zone.FloorNumber,
                    AvailableCapacity = zone.AvailableCapacity,
                    CheckInTime = time,
                    Status = "ACTIVE",
                    PaymentStatus = "PENDING",
                    BookingId = bookingId
                }
            };
        }

        private CheckOutResponseDto MapToCheckOutResponseDto(ParkingSession session, decimal fee, int duration, DateTime checkOutTime)
        {
            return new CheckOutResponseDto
            {
                SessionId = session.SessionId,
                LicensePlateIn = session.LicensePlateIn ?? string.Empty,
                CheckInTime = session.CheckInTime ?? VnNow,
                CheckOutTime = checkOutTime,
                DurationMinutes = duration,
                Status = session.Status ?? "COMPLETED",
                TotalFee = fee,
                PaymentStatus = session.PaymentStatus ?? "PAID"
            };
        }

        private ActiveSessionResponseDto MapToActiveSessionResponseDto(ParkingSession session, int duration, decimal fee, PricingPolicy? policy = null)
        {
            string paymentStatus = session.PaymentStatus ?? "PENDING";
            int? gracePeriodRemainingSeconds = null;

            if (paymentStatus == "PAID")
            {
                var latestPayment = session.Payments
                    .Where(p => p.PaymentType == "SESSION" && p.Status == "SUCCESS")
                    .OrderByDescending(p => p.PaymentTime)
                    .FirstOrDefault();

                if (latestPayment != null && latestPayment.PaymentTime.HasValue)
                {
                    var paidDurationMinutes = (latestPayment.PaymentTime.Value - (session.CheckInTime ?? latestPayment.PaymentTime.Value)).TotalMinutes;
                    if (paidDurationMinutes < 0) paidDurationMinutes = 0;
                    int billedHoursAtPayment = (int)Math.Ceiling(paidDurationMinutes / 60.0);
                    if (billedHoursAtPayment == 0) billedHoursAtPayment = 1;
                    var paidUntilTime = (session.CheckInTime ?? latestPayment.PaymentTime.Value).AddMinutes(billedHoursAtPayment * 60);

                    var remainingSeconds = (paidUntilTime - VnNow).TotalSeconds;
                    if (remainingSeconds > 0)
                    {
                        gracePeriodRemainingSeconds = (int)remainingSeconds;
                    }
                    else
                    {
                        gracePeriodRemainingSeconds = 0;
                    }
                }
            }
            else
            {
                // Initial check-in grace period (default 5 minutes)
                var checkIn = session.CheckInTime ?? VnNow;
                var durationSec = (VnNow - checkIn).TotalSeconds;
                var gracePeriodMinutes = 5;
                var totalGraceSeconds = gracePeriodMinutes * 60;
                var remaining = (int)Math.Max(0, totalGraceSeconds - durationSec);
                if (fee > 0 || durationSec > totalGraceSeconds)
                {
                    remaining = 0;
                }
                if (remaining > 0)
                {
                    gracePeriodRemainingSeconds = remaining;
                }
            }

            DateTime? expectedArrival = null;
            DateTime? expiredAt = null;
            string? bookingStatus = null;
            bool isOverdue = false;
            int overdueMinutes = 0;
            decimal overdueFee = 0;

            string? customerName = null;
            string? customerEmail = null;
            string? customerPhone = null;

            if (session.Booking != null)
            {
                expectedArrival = session.Booking.ExpectedArrival;
                expiredAt = session.Booking.ExpiredAt;
                bookingStatus = session.Booking.Status;

                if (session.Booking.VehicleUser != null)
                {
                    customerName = session.Booking.VehicleUser.FullName;
                    customerEmail = session.Booking.VehicleUser.Email;
                    customerPhone = session.Booking.VehicleUser.Phone;
                }

                if (expiredAt.HasValue && VnNow > expiredAt.Value)
                {
                    isOverdue = true;
                    overdueMinutes = (int)Math.Max(0, (VnNow - expiredAt.Value).TotalMinutes);
                    overdueFee = ParkingCalculationHelper.CalculateOverdueFee(VnNow, expiredAt.Value, policy);
                }
            }

            return new ActiveSessionResponseDto
            {
                Success = true,
                Data = new ActiveSessionDataDto
                {
                    SessionId = session.SessionId,
                    LicensePlateIn = session.LicensePlateIn ?? string.Empty,
                    CheckInTime = session.CheckInTime ?? VnNow,
                    DurationMinutes = duration,
                    ZoneId = session.ZoneId ?? 0,
                    ZoneName = session.Zone?.ZoneName ?? session.Slot?.Zone?.ZoneName ?? "N/A",
                    Floor = session.Zone?.FloorNumber ?? session.Slot?.Zone?.FloorNumber ?? 1,
                    CurrentFee = fee,
                    Status = session.Status ?? "ACTIVE",
                    PaymentStatus = paymentStatus,
                    BookingId = session.BookingId ?? string.Empty,
                    GracePeriodRemainingSeconds = gracePeriodRemainingSeconds,
                    VehicleTypeName = session.VehicleType?.VehicleTypeName,

                    ExpectedArrival = expectedArrival,
                    ExpiredAt = expiredAt,
                    BookingStatus = bookingStatus,
                    IsOverdue = isOverdue,
                    OverdueMinutes = overdueMinutes,
                    OverdueFee = overdueFee,
                    ImageUrlIn = session.ImageUrlIn,
                    ImageUrlOut = session.ImageUrlOut,
                    CustomerName = customerName,
                    CustomerEmail = customerEmail,
                    CustomerPhone = customerPhone
                }
            };
        }

        private PreCheckOutResponseDto MapToPreCheckOutResponseDto(ParkingSession session, PricingPolicy policy, ParkingFeeResult feeResult)
        {
            return new PreCheckOutResponseDto
            {
                Success = true,
                Data = new PreCheckOutDataDto
                {
                    SessionId = session.SessionId,
                    CurrentFee = feeResult.CurrentFee,
                    FeeBreakdown = new FeeBreakdownDto
                    {
                        BasePrice = policy.BasePrice,
                        HourlyRate = policy.SubsequentRate,
                        Hours = feeResult.Hours,
                        OvernightFee = policy.DailyMaxPrice,
                        Total = feeResult.CurrentFee,
                        BaseHours = policy.BaseHours,
                        SubsequentRate = policy.SubsequentRate,
                        SubsequentHours = policy.SubsequentHours,
                        DailyMaxPrice = policy.DailyMaxPrice
                    },
                    GracePeriodRemainingSeconds = feeResult.GracePeriodRemainingSeconds
                }
            };
        }

        #endregion
    }
}
