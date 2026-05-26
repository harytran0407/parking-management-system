using System;
using System.Threading.Tasks;
using ParkingManagement.Models;

namespace ParkingManagement.Repositories
{
    /// <summary>
    /// Interface định nghĩa các phương thức giao tiếp dữ liệu thô với Database liên quan đến bãi xe.
    /// </summary>
    public interface IParkingRepository
    {
        Task<bool> IsVehicleActiveInParkingAsync(string licensePlate);
        Task<dynamic?> FindFirstAvailableSlotAsync(int vehicleTypeId);
        Task CreateSessionAsync(ParkingSession session);
        Task SaveChangesWithTransactionAsync(Func<Task> action);
        Task<ParkingSlot?> GetSlotByIdAsync(string slotId); 

        Task<ParkingSession?> GetActiveSessionByPlateAsync(string licensePlate);
        Task<PricingPolicy?> GetActivePricingPolicyAsync();
        Task<bool> UpdateSessionAndSlotAsync(ParkingSession session, string slotId);
    }
}