using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using ParkingManagement.Utils;

namespace ParkingManagement.Middlewares
{
    /// <summary>
    /// Runs after UseAuthentication(). If the currently authenticated user has been
    /// banned by an admin or manager, this rejects the request immediately with 401,
    /// even though their JWT is still technically valid and not expired.
    ///
    /// Any ban endpoint (AdminController for regular users, StaffController for
    /// ParkingStaff) must set/remove BanCacheKeys.For(userId) in IMemoryCache when
    /// a user's status is changed to/from BANNED. The frontend's global axios
    /// interceptor already treats any 401 as "log out and show message", so no
    /// frontend changes are needed to force the kick-out.
    /// </summary>
    public class UserBanCheckMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IMemoryCache _cache;

        public UserBanCheckMiddleware(RequestDelegate next, IMemoryCache cache)
        {
            _next = next;
            _cache = cache;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            if (context.User?.Identity?.IsAuthenticated == true)
            {
                var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                             ?? context.User.FindFirst("sub")?.Value;

                if (!string.IsNullOrEmpty(userId) && _cache.TryGetValue(BanCacheKeys.For(userId), out _))
                {
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    context.Response.ContentType = "application/json";
                    await context.Response.WriteAsync(
                        "{\"success\": false, \"error_code\": \"USER_BANNED\", \"message\": \"Your account has been banned. Please contact support.\"}");
                    return;
                }
            }

            await _next(context);
        }
    }
}