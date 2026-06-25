using Microsoft.Extensions.Options;
using ParkingManagement.Models;
using ParkingManagement.Data;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;

namespace ParkingManagement.Services.EmailServices;

public class EmailService : IEmailService
{
    private readonly MailSettings _mailSettings;
    private readonly ILogger<EmailService> _logger;
    private readonly IServiceScopeFactory _scopeFactory;

    public EmailService(IOptions<MailSettings> mailSettings, ILogger<EmailService> logger, IServiceScopeFactory scopeFactory)
    {
        _mailSettings = mailSettings.Value;
        _logger = logger;
        _scopeFactory = scopeFactory;
    }

    public async Task SendEmailAsync(string toEmail, string subject, string body)
    {
        try
        {
            var message = new MailMessage
            {
                From = new MailAddress(_mailSettings.Mail, _mailSettings.DisplayName),
                Subject = subject,
                Body = body,
                IsBodyHtml = true
            };
            message.To.Add(new MailAddress(toEmail));

            using var client = new SmtpClient(_mailSettings.Host, _mailSettings.Port)
            {
                Credentials = new NetworkCredential(_mailSettings.Mail, _mailSettings.Password),
                EnableSsl = true
            };

            await client.SendMailAsync(message);

            _logger.LogInformation($"[EmailService] Gửi OTP thành công tới: {toEmail}");
        }
        catch (SmtpException smtpEx)
        {
            _logger.LogError($"[EmailService] Lỗi SMTP: {smtpEx.Message}");
            await SaveLogToDatabaseAsync("Error", $"Lỗi gửi mail SMTP tới {toEmail}. Chi tiết: {smtpEx.Message}", "EmailService");
        }
        catch (Exception ex)
        {
            _logger.LogError($"[EmailService] Lỗi hệ thống: {ex.Message}");
            await SaveLogToDatabaseAsync("Critical", $"Lỗi hệ thống khi gửi mail tới {toEmail}. Chi tiết: {ex.Message}", "EmailService");
        }
    }

    private async Task SaveLogToDatabaseAsync(string logLevel, string message, string source)
    {
        using (var scope = _scopeFactory.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var logEntry = new SystemLog
            {
                LogLevel = logLevel,
                Message = message,
                Source = source,
                CreatedAt = DateTime.UtcNow 
            };

            context.SystemLogs.Add(logEntry);
            await context.SaveChangesAsync();
        }
    }
}

