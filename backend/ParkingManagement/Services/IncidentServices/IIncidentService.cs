using System;
using System.Threading.Tasks;
using ParkingManagement.DTOs;

namespace ParkingManagement.Services
{
    /// <summary>
    /// Dịch vụ xử lý các sự cố và ngoại lệ trong bãi xe (Mất thẻ, sai biển số, tranh chấp ô đỗ).
    /// </summary>
    public interface IIncidentService
    {
        /// <summary>
        /// Xử lý nghiệp vụ khách hàng báo mất thẻ/vé xe (Lost Ticket).
        /// </summary>
        Task<LostTicketResponseDto> HandleLostTicketAsync(LostTicketRequestDto dto, string staffId, DateTime? currentTime = null);
        /// <summary>
        /// Sửa đổi sai lệch biển số do hệ thống/OCR nhận diện nhầm lúc vào (Correct Mismatch).
        /// </summary>
        Task<MismatchCorrectionResponseDto> CorrectMismatchAsync(MismatchCorrectionRequestDto dto, string staffId);       
    }
}