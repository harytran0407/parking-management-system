using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ParkingManagement.Models;
using ParkingManagement.Data;
using ParkingManagement.Services.Helpers; 

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
                .Include(b => b.VehicleType)
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
                        payment.PaymentTime = ParkingCalculationHelper.VnNow;
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

        public async Task<bool> ProcessMockPaymentConfirmationAsync(string bookingId, string paymentMethod, string userId, decimal amount)
        {
            using (var transaction = await _context.Database.BeginTransactionAsync())
            {
                try
                {
                    var payment = await _context.Payments
                        .FirstOrDefaultAsync(p => p.BookingId == bookingId);

                    if (payment == null)
                    {
                        payment = new Payment
                        {
                            PaymentId = "pay_" + Guid.NewGuid().ToString("N").Substring(0, 10).ToUpper(),
                            PaymentType = "BOOKING",
                            BookingId = bookingId,
                            AmountDue = amount,
                            AmountPaid = amount,
                            ChangeDue = 0,
                            PaymentMethod = paymentMethod.ToUpper(),
                            Status = "SUCCESS",
                            UserId = userId,
                            PaymentTime = ParkingCalculationHelper.VnNow,
                            TransactionId = "MOCK_" + paymentMethod.ToUpper() + "_" + Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper()
                        };
                        await _context.Payments.AddAsync(payment);
                    }
                    else
                    {
                        payment.Status = "SUCCESS";
                        payment.PaymentMethod = paymentMethod.ToUpper();
                        payment.AmountPaid = amount;
                        payment.PaymentTime = ParkingCalculationHelper.VnNow;
                        payment.TransactionId = "MOCK_" + paymentMethod.ToUpper() + "_" + Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper();
                        _context.Payments.Update(payment);
                    }

                    var booking = await _context.Bookings.FirstOrDefaultAsync(b => b.BookingId == bookingId);
                    if (booking != null)
                    {
                        booking.Status = "CONFIRMED";
                        _context.Bookings.Update(booking);
                    }

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();
                    return true;
                }
                catch (Exception)
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }
        }

        public async Task<PricingPolicy?> GetActivePricingPolicyByVehicleTypeAsync(int vehicleTypeId)
        {
            var today = DateOnly.FromDateTime(DateTime.Today);
            return await _context.PricingPolicies
                .Where(p => p.VehicleTypeId == vehicleTypeId && p.EffectiveDate <= today)
                .OrderByDescending(p => p.EffectiveDate)
                .FirstOrDefaultAsync();
        }
    }
}
