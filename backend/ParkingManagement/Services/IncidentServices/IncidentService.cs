using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ParkingManagement.DTOs;
using ParkingManagement.Models;
using ParkingManagement.Repositories;
using ParkingManagement.Services.Helpers;

namespace ParkingManagement.Services
{
    public class IncidentService : IIncidentService
    {
        private readonly IIncidentRepository _incidentRepository;
        private readonly IParkingRepository _parkingRepository;
        private readonly IBookingRepository _bookingRepository;

        public IncidentService(
            IIncidentRepository incidentRepository,
            IParkingRepository parkingRepository,
            IBookingRepository bookingRepository)
        {
            _incidentRepository = incidentRepository;
            _parkingRepository = parkingRepository;
            _bookingRepository = bookingRepository;
        }

        // XỬ LÝ MẤT THẺ 
        public async Task<LostTicketResponseDto> HandleLostTicketAsync(LostTicketRequestDto dto, string staffId, DateTime? currentTime = null)
        {
            Console.WriteLine($"[DEBUG HandleLostTicketAsync] LicensePlate={dto.LicensePlate}, ProofImageUrl='{dto.ProofImageUrl}'");
            var activeSession = await _parkingRepository.GetActiveSessionByPlateAsync(dto.LicensePlate);
            if (activeSession == null)
            {
                throw new KeyNotFoundException("ACTIVE_SESSION_NOT_FOUND");
            }

            string currentSessionId = activeSession.SessionId;
            DateTime checkOutTime = currentTime ?? ParkingCalculationHelper.VnNow;
            int resolvedVehicleTypeId = dto.VehicleTypeId ?? activeSession.VehicleTypeId;

            var policy = await _parkingRepository.GetActivePricingPolicyByVehicleTypeAsync(resolvedVehicleTypeId)
                         ?? throw new InvalidOperationException("PRICING_POLICY_NOT_CONFIGURED");

            string operatingHours = await _parkingRepository.GetOperatingHoursForDayAsync(checkOutTime);
            int durationMinutes = ParkingCalculationHelper.CalculateDurationMinutes(activeSession.CheckInTime, checkOutTime);

            var feeResult = ParkingCalculationHelper.CalculateParkingFee(
                activeSession.CheckInTime ?? ParkingCalculationHelper.VnNow,
                checkOutTime,
                policy,            
                operatingHours     
            );

            decimal actualParkingFee = feeResult.CurrentFee;
            decimal handlingFee = policy.HandlingFee;
            decimal totalCalculatedFee = actualParkingFee + handlingFee;

            var incident = new IncidentLog
            {
                SessionId = currentSessionId,
                ReportedBy = staffId,
                IssueType = "LOST_TICKET",
                Description = dto.LostReason ?? $"Khách hàng báo mất thẻ cho phương tiện {dto.LicensePlate}. Tổng thời gian đỗ: {durationMinutes} phút.",
                ReportTime = checkOutTime,
                Status = "RESOLVED", 
                CustomerPhone = dto.CustomerPhone
            };

            await _parkingRepository.SaveChangesWithTransactionAsync(async () =>
            {
                activeSession.Status = "LOST_TICKET";
                activeSession.PaymentStatus = "PENDING";
                activeSession.TotalFee = totalCalculatedFee;
                activeSession.CheckOutTime = checkOutTime;
                activeSession.DurationMinutes = durationMinutes;

                if (!string.IsNullOrEmpty(dto.ProofImageUrl))
                {
                    activeSession.ImageUrlOut = dto.ProofImageUrl;
                }

                await _parkingRepository.UpdateSessionAsync(activeSession);

                if (!string.IsNullOrEmpty(activeSession.SlotId))
                {
                    var slot = await _parkingRepository.GetSlotByIdAsync(activeSession.SlotId);
                    if (slot != null)
                    {
                        slot.Status = "AVAILABLE"; 
                        slot.CurrentSessionId = null;
                        slot.LastUpdated = checkOutTime;
                        await _parkingRepository.UpdateSlotAsync(slot);
                    }
                }

                await _incidentRepository.CreateIncidentLogAsync(incident);
            });

            return new LostTicketResponseDto
            {
                Success = true,
                Data = new LostTicketDataDto
                {
                    IncidentLogId = incident.LogId,
                    SessionId = currentSessionId,
                    CheckInTime = activeSession.CheckInTime,
                    CheckOutTime = checkOutTime,
                    CalculatedFee = totalCalculatedFee,
                    Breakdown = new FeeBreakdownLostTicket
                    {
                        ActualParkingFee = actualParkingFee,
                        HandlingFee = handlingFee
                    }
                }
            };
        }

        // SỬA SAI LỆCH THÔNG TIN XE 
        public async Task<MismatchCorrectionResponseDto> CorrectMismatchAsync(MismatchCorrectionRequestDto dto, string staffId)
        {
            if (string.IsNullOrWhiteSpace(dto.OriginalLicensePlate))
            {
                throw new ArgumentException("ORIGINAL_PLATE_REQUIRED");
            }
            var currentSession = await _parkingRepository.GetActiveSessionByPlateAsync(dto.OriginalLicensePlate.Trim().ToUpper());
            if (currentSession == null)
            {
                throw new KeyNotFoundException("SESSION_NOT_FOUND_FOR_THIS_PLATE");
            }
            DateTime correctionTime = ParkingCalculationHelper.VnNow;
            var conflictingSession = await _parkingRepository.GetActiveSessionByPlateAsync(dto.CorrectedLicensePlate.Trim().ToUpper());
            if (conflictingSession != null && conflictingSession.SessionId != currentSession.SessionId)
            {
                throw new InvalidOperationException("LICENSE_PLATE_ALREADY_ACTIVE_IN_ANOTHER_SESSION");
            }
            var incident = new IncidentLog
            {
                SessionId = currentSession.SessionId,
                ReportedBy = staffId,
                IssueType = "WRONG_SLOT",
                Description = dto.Reason ?? $"Sửa đổi biển số từ {dto.OriginalLicensePlate} thành {dto.CorrectedLicensePlate}.",
                ReportTime = correctionTime,
                Status = "RESOLVED"
            };

            await _parkingRepository.SaveChangesWithTransactionAsync(async () =>
            {
                currentSession.LicensePlateIn = dto.CorrectedLicensePlate.Trim().ToUpper();     
                if (currentSession.Status == "COMPLETED" || string.IsNullOrEmpty(currentSession.LicensePlateOut))
                {
                    currentSession.LicensePlateOut = dto.CorrectedLicensePlate.Trim().ToUpper();
                }
                await _parkingRepository.UpdateSessionAsync(currentSession);
                await _incidentRepository.CreateIncidentLogAsync(incident);
            });
            return new MismatchCorrectionResponseDto
            {
                Success = true,
                Message = $"Nhận diện sai lệch biển số {dto.OriginalLicensePlate} đã được sửa đổi thành công thành {dto.CorrectedLicensePlate}.",
                Data = new MismatchCorrectionDataDto
                {
                    IncidentLogId = incident.LogId,
                    SessionId = currentSession.SessionId,
                    Status = "RESOLVED"
                }
            };
        }   
    }
}