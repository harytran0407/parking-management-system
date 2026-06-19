using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ParkingManagement.Data;
using ParkingManagement.Models;
using ParkingManagement.DTOs.Admin;

namespace ParkingManagement.Services
{
    public class SystemConfigService : ISystemConfigService
    {
        private readonly AppDbContext _context;

        public SystemConfigService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<SystemSetting>> GetAllSettingsAsync()
        {
            await SeedDefaultSettingsAsync();
            return await _context.SystemSettings.ToListAsync();
        }

        public async Task<bool> UpdateSettingAsync(string key, UpdateSystemSettingDto dto)
        {
            var setting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.SettingKey == key);
            if (setting == null)
            {
                return false;
            }

            setting.SettingValue = dto.SettingValue;
            if (dto.Description != null)
            {
                setting.Description = dto.Description;
            }
            setting.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            try
            {
                var systemLog = new SystemLog
                {
                    LogLevel = "INFO",
                    Message = $"System configuration setting '{key}' updated to '{dto.SettingValue}'.",
                    Source = "Settings",
                    CreatedAt = DateTime.UtcNow
                };
                await _context.SystemLogs.AddAsync(systemLog);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SystemConfigService Error]: Could not log settings update. Reason: {ex.Message}");
            }

            return true;
        }

        public async Task<(IEnumerable<SystemLog> logs, int totalItems, int totalPages)> GetSystemLogsAsync(string? level, int page, int pageSize)
        {
            var query = _context.SystemLogs.AsQueryable();

            if (!string.IsNullOrWhiteSpace(level) && level != "ALL")
            {
                query = query.Where(l => l.LogLevel == level);
            }

            query = query.OrderByDescending(l => l.CreatedAt);

            var totalItems = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

            var logs = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (logs, totalItems, totalPages);
        }

        public async Task LogActivityAsync(string logLevel, string message, string? source = null)
        {
            try
            {
                var log = new SystemLog
                {
                    LogLevel = logLevel,
                    Message = message,
                    Source = source ?? "System",
                    CreatedAt = DateTime.UtcNow
                };
                _context.SystemLogs.Add(log);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SystemConfigService Error]: Could not log activity. Reason: {ex.Message}");
            }
        }

        private async Task SeedDefaultSettingsAsync()
        {
            var defaults = new List<SystemSetting>
            {
                new() { SettingKey = "lostTicketFee", SettingValue = "50000", Description = "Lost Ticket Fee (VND)" },
                new() { SettingKey = "overtimePenaltyRate", SettingValue = "10000", Description = "Overtime Penalty Rate (VND per hour)" },
                new() { SettingKey = "maxSpeedLimit", SettingValue = "5", Description = "Max Speed Limit (km/h)" },
                new() { SettingKey = "is247", SettingValue = "true", Description = "Open 24/7" },
                new() { SettingKey = "holdWindow", SettingValue = "15", Description = "Hold Time (Minutes)" },
                new() { SettingKey = "minBookingDuration", SettingValue = "60", Description = "Min Booking Time (Minutes)" },
                new() { SettingKey = "advanceBookingLimitDays", SettingValue = "7", Description = "Book Ahead Limit (Days)" },
                new() { SettingKey = "autoLPR", SettingValue = "true", Description = "Scan License Plate Automatically" },
                new() { SettingKey = "autoBarrierOpen", SettingValue = "true", Description = "Open Gate Automatically" },
                new() { SettingKey = "ocrSensitivity", SettingValue = "HIGH", Description = "OCR Sensitivity" }
            };

            bool anyAdded = false;
            foreach (var def in defaults)
            {
                if (!await _context.SystemSettings.AnyAsync(s => s.SettingKey == def.SettingKey))
                {
                    _context.SystemSettings.Add(def);
                    anyAdded = true;
                }
            }

            if (anyAdded)
            {
                await _context.SaveChangesAsync();
            }
        }
    }
}
