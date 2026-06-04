using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ParkingManagement.Data;
using ParkingManagement.Models;

namespace ParkingManagement.Repositories
{
    public class IncidentRepository : IIncidentRepository
    {
        private readonly AppDbContext _context;

        public IncidentRepository(AppDbContext context)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
        }

        public async Task CreateIncidentLogAsync(IncidentLog incident)
        {
            await _context.IncidentLogs.AddAsync(incident);
            // Không gọi SaveChangesAsync() ở đây nếu muốn chạy chung Transaction của bãi xe bên Service
        }

        public async Task<IncidentLog?> GetIncidentByIdAsync(int logId)
        {
            return await _context.IncidentLogs.FindAsync(logId);
        }
    }
}