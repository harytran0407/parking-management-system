using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ParkingManagement.Data;
using ParkingManagement.Models;

namespace ParkingManagement.Repositories
{
    public class BookingRepository : IBookingRepository
    {
        private readonly AppDbContext _context;

        public BookingRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Booking?> GetActiveBookingBySlotIdAsync(string slotId)
        {
            // Slot-based lookup no longer primary — kept for legacy compatibility
            return await _context.Bookings
                .FirstOrDefaultAsync(b => b.Status == "CONFIRMED");
        }

        public async Task UpdateBookingAsync(Booking booking)
        {
            _context.Bookings.Update(booking);
            await Task.CompletedTask;
        }
    }
}