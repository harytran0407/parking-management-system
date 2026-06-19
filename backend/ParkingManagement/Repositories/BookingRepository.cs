using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
<<<<<<< HEAD
using ParkingManagement.Data;
=======
using ParkingManagement.Data; // Thay bằng namespace DbContext thực tế của bạn
>>>>>>> origin/main
using ParkingManagement.Models;

namespace ParkingManagement.Repositories
{
    public class BookingRepository : IBookingRepository
    {
<<<<<<< HEAD
        private readonly AppDbContext _context;
=======
        private readonly AppDbContext _context; // Thay bằng tên DbContext thực tế của bạn
>>>>>>> origin/main

        public BookingRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Booking?> GetActiveBookingBySlotIdAsync(string slotId)
        {
<<<<<<< HEAD
            // Slot-based lookup no longer primary — kept for legacy compatibility
            return await _context.Bookings
                .FirstOrDefaultAsync(b => b.Status == "CONFIRMED");
=======
            return await _context.Bookings
                .FirstOrDefaultAsync(b => b.SlotId == slotId && b.Status == "CONFIRMED");
>>>>>>> origin/main
        }

        public async Task UpdateBookingAsync(Booking booking)
        {
            _context.Bookings.Update(booking);
<<<<<<< HEAD
            await Task.CompletedTask;
=======
            await Task.CompletedTask; // Đồng bộ hóa lệnh để Transaction bên ngoài Service quản lý việc SaveChanges
>>>>>>> origin/main
        }
    }
}