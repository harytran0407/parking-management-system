using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ParkingManagement.Data; // Thay bằng namespace DbContext thực tế của bạn
using ParkingManagement.Models;

namespace ParkingManagement.Repositories
{
    public class BookingRepository : IBookingRepository
    {
        private readonly AppDbContext _context; // Thay bằng tên DbContext thực tế của bạn

        public BookingRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Booking?> GetActiveBookingBySlotIdAsync(string slotId)
        {
            return await _context.Bookings
                .FirstOrDefaultAsync(b => b.SlotId == slotId && b.Status == "CONFIRMED");
        }

        public async Task UpdateBookingAsync(Booking booking)
        {
            _context.Bookings.Update(booking);
            await Task.CompletedTask; // Đồng bộ hóa lệnh để Transaction bên ngoài Service quản lý việc SaveChanges
        }
    }
}