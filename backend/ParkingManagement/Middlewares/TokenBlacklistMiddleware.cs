using Microsoft.Extensions.Caching.Memory;

namespace ParkingManagement.Middlewares
{
    public class TokenBlacklistMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IMemoryCache _cache;

        public TokenBlacklistMiddleware(RequestDelegate next, IMemoryCache cache)
        {
            _next = next;
            _cache = cache;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Kiểm tra token trong header Authorization
            var CheckToken = context.Request.Headers["Authorization"].FirstOrDefault();

            if(!string.IsNullOrEmpty(CheckToken) && CheckToken.StartsWith("Bearer "))
            {
                // Cắt bỏ "Bearer " để lấy token thực sự
                var token = CheckToken.Substring("Bearer ".Length).Trim();
                // Kiểm tra token có trong blacklist hay không
                if (_cache.TryGetValue($"Blacklist_{token}", out _))
                {
                    // Nếu token bị blacklist, trả về 401 Unauthorized -> chặn truy cập và yêu cầu đăng nhập lại
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    context.Response.ContentType = "application/json";
                    await context.Response.WriteAsync("{\"success\": false, \"error_code\": \"TOKEN_REVOKED\", \"message\": \"Session end. Please log in again.\"}"); return;
                    
                }
            }

            // Nếu token không bị blacklist, tiếp tục xử lý request
            await _next(context);
        }
    }
}
