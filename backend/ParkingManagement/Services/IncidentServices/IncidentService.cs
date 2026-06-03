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

        // ===================================================================================
        // CHỨC NĂNG 1: XỬ LÝ MẤT THẺ (LOST TICKET)
        // ===================================================================================
        public async Task<LostTicketResponseDto> HandleLostTicketAsync(LostTicketRequestDto dto, string staffId, DateTime? currentTime = null)
        {
            // Tìm phiên hoạt động ACTIVE dựa trên biển số xe từ DB
            var activeSession = await _parkingRepository.GetActiveSessionByPlateAsync(dto.LicensePlate);
            if (activeSession == null)
            {
                throw new KeyNotFoundException("ACTIVE_SESSION_NOT_FOUND");
            }

            string currentSessionId = activeSession.SessionId;

            DateTime checkOutTime = currentTime ?? DateTime.Now;

            // Lấy chính sách giá hiện hành cho loại phương tiện từ DB
            var policy = await _parkingRepository.GetActivePricingPolicyByVehicleTypeAsync(dto.VehicleTypeId)
                         ?? throw new InvalidOperationException("PRICING_POLICY_NOT_CONFIGURED");

            string operatingHours = await _parkingRepository.GetOperatingHoursForDayAsync(checkOutTime);


            int durationMinutes = ParkingCalculationHelper.CalculateDurationMinutes(activeSession.CheckInTime, checkOutTime);

            var feeResult = ParkingCalculationHelper.CalculateParkingFee(
                activeSession.CheckInTime ?? DateTime.Now,
                checkOutTime,
                policy,            
                operatingHours     
            );

            // Trích xuất số tiền đỗ xe thực tế từ đối tượng kết quả của Helper
            decimal actualParkingFee = feeResult.CurrentFee;

            decimal handlingFee = policy.HandlingFee;

            // Tổng số tiền khách phải trả = Phí đỗ thực tế (đã gồm lũy tiến/qua đêm nếu có) + Phí đền phôi thẻ
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

                await _parkingRepository.UpdateSessionAsync(activeSession);

                // Giải phóng vị trí ô đỗ (Slot) đưa về trạng thái AVAILABLE
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

                // Lưu log sự cố vào bảng INCIDENT_LOG
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
                    },
                    PaymentRequired = totalCalculatedFee > 0
                }
            };
        }

        // ===================================================================================
        // CHỨC NĂNG 2: SỬA SAI LỆCH BIỂN SỐ XE (CORRECT MISMATCH)
        // ===================================================================================
        public async Task<MismatchCorrectionResponseDto> CorrectMismatchAsync(MismatchCorrectionRequestDto dto, string staffId)
        {
            var currentSession = await _parkingRepository.GetActiveSessionByIdAsync(dto.SessionId);
            if (currentSession == null)
            {
                throw new KeyNotFoundException("SESSION_NOT_FOUND");
            }

            if (currentSession.LicensePlateIn != dto.OriginalLicensePlate)
            {
                throw new InvalidOperationException("CONCURRENCY_CONFLICT_PLATE_MISMATCH");
            }

            DateTime correctionTime = DateTime.Now;

            var conflictingSession = await _parkingRepository.GetActiveSessionByPlateAsync(dto.CorrectedLicensePlate);
            if (conflictingSession != null && conflictingSession.SessionId != dto.SessionId)
            {
                throw new InvalidOperationException("LICENSE_PLATE_ALREADY_ACTIVE_IN_ANOTHER_SLOT");
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
                currentSession.LicensePlateIn = dto.CorrectedLicensePlate;

                if (currentSession.Status == "COMPLETED" || string.IsNullOrEmpty(currentSession.LicensePlateOut))
                {
                    currentSession.LicensePlateOut = dto.CorrectedLicensePlate;
                }

                await _parkingRepository.UpdateSessionAsync(currentSession);
                await _incidentRepository.CreateIncidentLogAsync(incident);
            });

            return new MismatchCorrectionResponseDto
            {
                Success = true,
                Message = "Mismatch corrected successfully.",
                Data = new MismatchCorrectionDataDto
                {
                    IncidentLogId = incident.LogId,
                    SessionId = currentSession.SessionId,
                    Status = "RESOLVED"
                }
            };
        }

        // ===================================================================================
        // CHỨC NĂNG 3: GIẢI QUYẾT TRANH CHẤP CHIẾM Ô ĐỖ ĐẶT TRƯỚC (Dựa trên Booking mẫu)
        // ===================================================================================
        public async Task<SlotDisputeResponseDto> ResolveSlotDisputeAsync(SlotDisputeRequestDto dto, string staffId)
        {
            // Kiểm tra phiên hoạt động của chiếc xe vi phạm
            var currentSession = await _parkingRepository.GetActiveSessionByIdAsync(dto.SessionId);
            if (currentSession == null)
            {
                throw new KeyNotFoundException("SESSION_NOT_FOUND");
            }

            if (string.IsNullOrEmpty(currentSession.SlotId))
            {
                throw new InvalidOperationException("SESSION_HAS_NO_ASSIGNED_SLOT");
            }

            DateTime resolutionTime = DateTime.Now;
            string conflictedSlotId = currentSession.SlotId;

            // Kiểm tra xem ô đỗ này thực sự có lịch Đặt chỗ (Booking) nào bị ảnh hưởng không trước
            var activeBooking = await _bookingRepository.GetActiveBookingBySlotIdAsync(conflictedSlotId);
            if (activeBooking == null)
            {
                throw new InvalidOperationException("NO_BOOKING_DISPUTE_FOUND_ON_THIS_SLOT");
            }

            var conflictedSlot = await _parkingRepository.GetSlotByIdAsync(conflictedSlotId);
            if (conflictedSlot == null)
            {
                throw new KeyNotFoundException("SLOT_NOT_FOUND");
            }

            string originalBookingId = activeBooking.BookingId;

            
            var availableNewSlotForBooking = await _parkingRepository.FindFirstAvailableSlotAsync(currentSession.VehicleTypeId);
            if (availableNewSlotForBooking == null)
            {
                throw new InvalidOperationException("NO_AVAILABLE_SLOT_TO_REALLOCATE_FOR_BOOKING");
            }

            await _parkingRepository.SaveChangesWithTransactionAsync(async () =>
            {
                // Hợp thức hóa ô cũ dưới trạng thái bị chiếm đóng (OCCUPIED) bởi xe vi phạm
                conflictedSlot.Status = "OCCUPIED";
                conflictedSlot.CurrentSessionId = currentSession.SessionId;
                conflictedSlot.LastUpdated = resolutionTime;
                await _parkingRepository.UpdateSlotAsync(conflictedSlot);

                // Điều phối (Reallocate) lịch Booking của khách sang ô đỗ trống mới tìm được
                activeBooking.SlotId = availableNewSlotForBooking.SlotId;
                await _bookingRepository.UpdateBookingAsync(activeBooking);

                // Chuyển trạng thái ô đỗ mới thành RESERVED để bảo vệ quyền lợi giữ chỗ cho khách
                availableNewSlotForBooking.Status = "RESERVED";
                availableNewSlotForBooking.LastUpdated = resolutionTime;
                await _parkingRepository.UpdateSlotAsync(availableNewSlotForBooking);

                var disputeIncident = new IncidentLog
                {
                    SessionId = currentSession.SessionId,
                    ReportedBy = staffId,
                    IssueType = "WRONG_SLOT",
                    Description = dto.Reason ?? $"[TRANH CHẤP CHỖ ĐỖ] Xe {currentSession.LicensePlateIn} chiếm ô đỗ của Booking {originalBookingId}. Hệ thống điều phối Booking sang ô mới {availableNewSlotForBooking.SlotName}.",
                    ReportTime = resolutionTime,
                    Status = "RESOLVED"
                };
                await _incidentRepository.CreateIncidentLogAsync(disputeIncident);
            });

            return new SlotDisputeResponseDto
            {
                Success = true,
                Message = "Slot dispute resolved. Booking reallocated successfully.",
                Data = new SlotDisputeDataDto
                {
                    ConflictedSlotName = conflictedSlot.SlotName ?? "N/A",
                    ReallocatedSlotName = availableNewSlotForBooking.SlotName ?? "N/A",
                    MovedBookingId = originalBookingId
                }
            };
        }
    }
}