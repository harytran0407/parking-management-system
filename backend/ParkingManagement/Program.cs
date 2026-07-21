using Microsoft.EntityFrameworkCore;
using ParkingManagement.Data;
using ParkingManagement.Extensions;
using ParkingManagement.Repositories;
using ParkingManagement.Services;
using ParkingManagement.Services.BookingServices;
using ParkingManagement.Services.BuildingServices;
using ParkingManagement.Services.EmailServices;
using ParkingManagement.Services.FeedbackServices;
using ParkingManagement.Dtos;
using ParkingManagement.Models;
using ParkingManagement.Services.SystemConfigServices;
using ParkingManagement.Middlewares;

// ── Prevent inotify limit crash on container platforms like Render ─────────────
Environment.SetEnvironmentVariable("ASPNETCORE_hostBuilder__reloadConfigOnChange", "false");
Environment.SetEnvironmentVariable("DOTNET_USE_POLLING_FILE_WATCHER", "true");

// ── .ENV Reader ───────────────────────────────────────────────────────────────
DotNetEnv.Env.Load();

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddEnvironmentVariables();

// ── Database ──────────────────────────────────────────────────────────────────
var dbServer = Environment.GetEnvironmentVariable("DB_SERVER");
var dbPort = Environment.GetEnvironmentVariable("DB_PORT");
var dbName = Environment.GetEnvironmentVariable("DB_NAME");
var dbUser = Environment.GetEnvironmentVariable("DB_USER");
var dbPassword = Environment.GetEnvironmentVariable("DB_PASSWORD");

var connectionString = string.IsNullOrEmpty(dbServer)
    ? builder.Configuration.GetConnectionString("DefaultConnection")
    : $"Server={dbServer};Port={dbPort};Database={dbName};User={dbUser};Password={dbPassword};";

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString))
);

// ── Controllers + JSON snake_case ─────────────────────────────────────────────
builder.Services.AddControllers()
    .AddJsonOptions(opt =>
        opt.JsonSerializerOptions.PropertyNamingPolicy =
            System.Text.Json.JsonNamingPolicy.SnakeCaseLower);

// ── CORS Policy Definition ────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",            // Vite mặc định (HTTP)
                "https://localhost:5173",          // Vite bảo mật (HTTPS)
                "http://localhost:3000",          // Cổng phụ/NextJS nếu có
                "https://eparking-v1.vercel.app" // Vercel Production (Lưu ý: KHÔNG có dấu gạch chéo cuối /)
              )
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();        // Hỗ trợ truyền cookie/authen bảo mật nếu cần
    });
});

// ── Swagger ───────────────────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo { Title = "ParkingManagement API", Version = "v1" });

    // Cấu hình nút Authorize trên Swagger
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "Nhập chữ 'Bearer' [khoảng trắng] [chuỗi_token_của_bạn].\r\n\r\nVí dụ: Bearer eyJhbGciOiJIUzI1Ni...",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement()
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                },
                Scheme = "oauth2",
                Name = "Bearer",
                In = Microsoft.OpenApi.Models.ParameterLocation.Header,
            },
            new System.Collections.Generic.List<string>()
        }
    });
});

builder.Services.AddMemoryCache(); // Thêm bộ nhớ đệm (cache) dùng cho rate limiting.

// Register IP filter service and rate limiting options
builder.Services.AddSingleton<IIpFilterService, IpFilterService>();
builder.Services.Configure<RateLimitingOptions>(builder.Configuration.GetSection("RateLimiting"));

// ── Parking module ───────────────────────────────────────────────────────────────────────
builder.Services.AddScoped<IParkingRepository, ParkingRepository>();
builder.Services.AddScoped<IParkingService, ParkingService>();

// ── Booking module ───────────────────────────────────────────────────────────────────────
builder.Services.AddScoped<IBookingRepository, BookingRepository>();
builder.Services.AddScoped<IBookingServiceRepository, BookingServiceRepository>();
builder.Services.AddScoped<IBookingService, BookingService>();

// ── Payment module ───────────────────────────────────────────────────────────────────────
builder.Services.AddScoped<IPaymentRepository, PaymentRepository>();
builder.Services.AddScoped<IPaymentService, PaymentService>();

// Register PayOS singleton service
var payOsClientId = Environment.GetEnvironmentVariable("PAYOS_CLIENT_ID") ?? "";
var payOsApiKey = Environment.GetEnvironmentVariable("PAYOS_API_KEY") ?? "";
var payOsChecksumKey = Environment.GetEnvironmentVariable("PAYOS_CHECKSUM_KEY") ?? "";
builder.Services.AddSingleton(new PayOS.PayOSClient(payOsClientId, payOsApiKey, payOsChecksumKey));

// ── Incident module ───────────────────────────────────────────────────────────────────────
builder.Services.AddScoped<IIncidentRepository, IncidentRepository>();
builder.Services.AddScoped<IIncidentService, IncidentService>();

// ── Building module ───────────────────────────────────────────────────────────
builder.Services.AddScoped<IBuildingRepository, BuildingRepository>();
builder.Services.AddScoped<IBuildingService, BuildingService>();

// ── VehicleType module ────────────────────────────────────────────────────────
builder.Services.AddScoped<IVehicleTypeRepository, VehicleTypeRepository>();
builder.Services.AddScoped<IVehicleTypeService, VehicleTypeService>();

// ── VehicleFloor module ────────────────────────────────────────────────────────
builder.Services.AddScoped<IFloorAllocationRepository, FloorAllocationRepository>();
builder.Services.AddScoped<IFloorAllocationService, FloorAllocationService>();

// ── Auth & JWT ─────────────────────────────────────────-────────────────────────
builder.Services.AddJwtAuthentication(builder.Configuration);
builder.Services.AddDistributedMemoryCache();

// ── Email module ──────────────────────────────────────────────────────────────
builder.Services.Configure<MailSettings>(builder.Configuration.GetSection("MailSettings"));
builder.Services.AddTransient<IEmailService, EmailService>();

// ── Slot management module ────────────────────────────────────────────────────
builder.Services.AddScoped<ISlotManagementRepository, SlotManagementRepository>();
builder.Services.AddScoped<ISlotManagementService, SlotManagementService>();

// ── Pricing Policy module ─────────────────────────────────────────────────────
builder.Services.AddScoped<IPricingPolicyRepository, PricingPolicyRepository>();
builder.Services.AddScoped<IPricingPolicyService, PricingPolicyService>();

// ── Dashboard module ──────────────────────────────────────────────────────────
builder.Services.AddScoped<IDashboardRepository, DashboardRepository>();
builder.Services.AddScoped<IDashboardService, DashboardService>();

// ── SystemConfig module ───────────────────────────────────────────────────────
builder.Services.AddScoped<ISystemConfigService, SystemConfigService>();

// ── Feedback module ───────────────────────────────────────────────────────────
builder.Services.AddScoped<IFeedbackSerivce, FeedbackService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// ── Global exception handler ──────────────────────────────────────────────────
app.UseExceptionHandler(errApp => errApp.Run(async ctx =>
{
    var ex = ctx.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>()?.Error;

    if (ex != null)
    {
        Console.WriteLine("\n🚨 ======= [BACKEND CRASH DETECTED] =======");
        Console.WriteLine(ex.ToString()); // In trọn vẹn dấu vết lỗi, tên file, số dòng bị sập
        Console.WriteLine("============================================\n");
    }

    var (status, message) = ex switch
    {
        KeyNotFoundException => (404, ex.Message),
        InvalidOperationException => (422, ex.Message),
        ArgumentException => (400, ex.Message),
        _ => (500, ex != null ? $"An unexpected error occurred: {ex.Message}" : "An unexpected error occurred")
    };
    ctx.Response.StatusCode = status;
    ctx.Response.ContentType = "application/json";
    var body = System.Text.Json.JsonSerializer.Serialize(new { success = false, message });
    await ctx.Response.WriteAsync(body);
}));

//app.UseHttpsRedirection();

app.UseCors("AllowReactFrontend");

// Security: IP filtering runs before authentication/blacklist checks
app.UseMiddleware<ParkingManagement.Middlewares.IpFilterMiddleware>(); //block/allow by IP

// Security
app.UseMiddleware<ParkingManagement.Middlewares.TokenBlacklistMiddleware>(); // Check blacklist
app.UseAuthentication(); // Read JWT token
app.UseAuthorization(); // Check role/permission

app.UseMiddleware<ParkingManagement.Middlewares.RateLimitingMiddleware>(); //per-IP rate limiting

app.UseStaticFiles();
app.MapControllers();
app.Run();
