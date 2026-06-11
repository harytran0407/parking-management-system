using System.Threading.Tasks;

namespace ParkingManagement.Services.EmailServices;

public interface IEmailService
{
    Task SendEmailAsync(string toEmail, string subject, string body);
}
