using System.Collections.Generic;
using System.Threading.Tasks;
using ParkingManagement.DTOs.Booking;

namespace ParkingManagement.Services.BookingServices;

public interface IBookingService
{
    // ─── FRIEND'S DEFINED SERVICE METHODS ────────────────────────────────────────

    Task<BookingPriceResponse> GetPriceEstimateAsync(BookingPriceRequest request);

    Task<BookingResponse> CreateBookingAsync(string userId, CreateBookingRequest request);

    Task<List<BookingResponse>> GetMyBookingsAsync(string userId);

    Task<BookingResponse> CancelBookingAsync(string bookingId, string userId);


    // ─── ADDED BY ANTIGRAVITY (BACKWARD COMPATIBILITY FOR EXISTING APIs) ─────────

    Task<BookingDashboardStatsResponse> GetBookingStatsAsync(string userId);

    Task<List<BookingResponse>> GetActiveBookingsAsync(string userId);

    Task<List<BookingResponse>> GetBookingHistoryAsync(string userId);

    Task<BookingResponse> PayBookingAsync(string bookingId, string userId);

    Task<BookingResponse> GetBookingByIdAsync(string bookingId, string userId);

    Task<bool> UnlockBookingAsync(string bookingId, string userId, bool isStaff = false);

    Task<bool> LockBookingAsync(string bookingId, string userId, bool isStaff = false);

    Task<BookingCapacityStatusResponse> GetBookingCapacityStatusAsync(int vehicleTypeId);

    Task<List<StaffBookingResponse>> GetStaffBookingsAsync();
}