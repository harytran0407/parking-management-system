using Microsoft.EntityFrameworkCore;
using ParkingManagement.Data;
using ParkingManagement.DTOs.Admin;

namespace ParkingManagement.Services
{
    public interface ISystemConfigService
    {
        Task<IEnumerable<SystemSettingDto>> GetAllSettingsAsync();
        Task<bool> UpdateSettingAsync(string key, UpdateSystemSettingDto request);
        Task<(IEnumerable<SystemLogDto> Logs, int TotalItems, int TotalPages)> GetSystemLogsAsync(string? level, int page, int pageSize);
    }

    public class SystemConfigService : ISystemConfigService
    {
        private readonly AppDbContext _context;

        public SystemConfigService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<SystemSettingDto>> GetAllSettingsAsync()
        {
            return await _context.SystemSettings
                .Select(s => new SystemSettingDto
                {
                    SettingKey = s.SettingKey,
                    SettingValue = s.SettingValue,
                    Description = s.Description,
                    UpdatedAt = s.UpdatedAt
                }).ToListAsync();
        }

        public async Task<bool> UpdateSettingAsync(string key, UpdateSystemSettingDto request)
        {
            var setting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.SettingKey == key);
            if (setting == null) return false;

            setting.SettingValue = request.SettingValue;

            if (request.Description != null)
            {
                setting.Description = request.Description;
            }

            setting.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<(IEnumerable<SystemLogDto> Logs, int TotalItems, int TotalPages)> GetSystemLogsAsync(string? level, int page, int pageSize)
        {
            var query = _context.SystemLogs.AsQueryable();

            // Filter theo Log Level (info, warning, error)
            if (!string.IsNullOrEmpty(level))
            {
                query = query.Where(l => l.LogLevel.ToLower() == level.ToLower());
            }

            var totalItems = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

            var logs = await query
                .OrderByDescending(l => l.CreatedAt) 
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(l => new SystemLogDto
                {
                    LogId = l.LogId,
                    LogLevel = l.LogLevel,
                    Message = l.Message,
                    Source = l.Source,
                    CreatedAt = l.CreatedAt
                }).ToListAsync();

            return (logs, totalItems, totalPages);
        }
    }
}