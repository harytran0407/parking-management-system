using System;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ParkingManagement.Middlewares
{
    public class RateLimitingOptions
    {
        public int Limit { get; set; } = 100; // requests
        public int WindowSeconds { get; set; } = 60; // window in seconds
    }

    public class RateLimitingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IMemoryCache _cache;
        private readonly ILogger<RateLimitingMiddleware> _logger;
        private readonly RateLimitingOptions _options;

        public RateLimitingMiddleware(RequestDelegate next, IMemoryCache cache, IOptions<RateLimitingOptions> options, ILogger<RateLimitingMiddleware> logger)
        {
            _next = next;
            _cache = cache;
            _logger = logger;
            _options = options.Value ?? new RateLimitingOptions();
        }

        public async Task InvokeAsync(HttpContext context)
        {
            if (context.User.Identity?.IsAuthenticated == true)
            {
                if (context.User.IsInRole("SystemAdmin") ||
                    context.User.IsInRole("ParkingManager") ||
                    context.User.IsInRole("ParkingStaff"))
                {
                    await _next(context);
                    return;
                }
            }

            var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var key = $"rl_{ip}";

            var count = _cache.GetOrCreate<int>(key, entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(_options.WindowSeconds);
                return 0;
            });

            // increment and set back
            count++;
            _cache.Set(key, count, TimeSpan.FromSeconds(_options.WindowSeconds));

            if (count > _options.Limit)
            {
                _logger.LogWarning("Rate limit exceeded for IP {Ip}: {Count}/{Limit}", ip, count, _options.Limit);
                context.Response.StatusCode = 429;
                context.Response.ContentType = "application/json";
                context.Response.Headers["Retry-After"] = _options.WindowSeconds.ToString();
                var body = JsonSerializer.Serialize(new { success = false, message = "Too many requests" });
                await context.Response.WriteAsync(body);
                return;
            }

            await _next(context);
        }
    }
}
