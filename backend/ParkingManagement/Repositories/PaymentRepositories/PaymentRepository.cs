using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ParkingManagement.Models;
using ParkingManagement.Data; 

using System.Linq;

namespace ParkingManagement.Repositories
{
    public class PaymentRepository : IPaymentRepository
    {
        private readonly AppDbContext _context;

        public PaymentRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Booking?> GetBookingByIdAsync(string bookingId)
        {
            return await _context.Bookings
                .Include(b => b.Vehicle)
                .FirstOrDefaultAsync(b => b.BookingId == bookingId);
        }

        public async Task CreatePaymentAsync(Payment payment)
        {
            await _context.Payments.AddAsync(payment);
            await _context.SaveChangesAsync();
        }

        public async Task<decimal> GetBasePriceForVehicleTypeAsync(int vehicleTypeId)
        {
            var policy = await _context.PricingPolicies
                .Where(p => p.VehicleTypeId == vehicleTypeId)
                .OrderByDescending(p => p.EffectiveDate)
                .FirstOrDefaultAsync();
            return policy?.BasePrice ?? (vehicleTypeId == 1 ? 5000m : 15000m);
        }

        public async Task UpdateBookingAndPaymentSuccessAsync(string paymentId, string transactionId, decimal amountPaid)
        {
            using (var transaction = await _context.Database.BeginTransactionAsync())
            {
                try
                {
                    var payment = await _context.Payments.FirstOrDefaultAsync(p => p.PaymentId == paymentId);
                    if (payment != null)
                    {
                        payment.Status = "SUCCESS";
                        payment.TransactionId = transactionId;
                        payment.PaymentTime = DateTime.Now;
                        payment.AmountPaid = amountPaid;

                        if (!string.IsNullOrEmpty(payment.BookingId))
                        {
                            var booking = await _context.Bookings.FirstOrDefaultAsync(b => b.BookingId == payment.BookingId);
                            if (booking != null)
                            {
                                booking.Status = "CONFIRMED";
                            }
                        }

                        await _context.SaveChangesAsync();
                        await transaction.CommitAsync();
                    }
                }
                catch (Exception)
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }
        }
    }
}