using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using ParkingManagement.Services.SystemConfigServices;

namespace ParkingManagement.Middlewares
{
    public class IpFilterMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IIpFilterService _ipFilterService;
        private readonly ILogger<IpFilterMiddleware> _logger;

        public IpFilterMiddleware(RequestDelegate next, IIpFilterService ipFilterService, ILogger<IpFilterMiddleware> logger)
        {
            _next = next;
            _ipFilterService = ipFilterService;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";

            if (_ipFilterService.IsBlocked(ip))
            {
                _logger.LogWarning("Blocked request from IP {Ip}", ip);
                context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
                context.Response.ContentType = "application/json";
                var body = JsonSerializer.Serialize(new { success = false, message = "Forbidden: your IP is blocked." });
                await context.Response.WriteAsync(body);
                return;
            }

            await _next(context);
        }
    }
}
