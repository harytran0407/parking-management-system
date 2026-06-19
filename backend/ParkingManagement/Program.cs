using Microsoft.EntityFrameworkCore;
using ParkingManagement.Data;
<<<<<<< HEAD
using ParkingManagement.Repositories;
using ParkingManagement.Services.BuildingServices;
using ParkingManagement.Services;
using ParkingManagement.Services.BookingServices;
using ParkingManagement.Extensions;
using ParkingManagement.Models;
using ParkingManagement.Services.EmailServices;


var builder = WebApplication.CreateBuilder(args);
=======
using ParkingManagement.Dtos;
using ParkingManagement.Extensions;
using ParkingManagement.Repositories;
using ParkingManagement.Services;
using ParkingManagement.Services.BookingServices;
using ParkingManagement.Services.BuildingServices;
using ParkingManagement.Services.FeedbackServices;


var builder = WebApplication.CreateBuilder(args);

>>>>>>> origin/main
// ── .ENV Reader ───────────────────────────────────────────────────────────────
DotNetEnv.Env.Load();

// ── Database ──────────────────────────────────────────────────────────────────
<<<<<<< HEAD
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
=======
var dbServer = Environment.GetEnvironmentVariable("DB_SERVER");
var dbPort = Environment.GetEnvironmentVariable("DB_PORT");
var dbName = Environment.GetEnvironmentVariable("DB_NAME");
var dbUser = Environment.GetEnvironmentVariable("DB_USER");
var dbPassword = Environment.GetEnvironmentVariable("DB_PASSWORD");

var connectionString = string.IsNullOrEmpty(dbServer)
    ? builder.Configuration.GetConnectionString("DefaultConnection")
    : $"Server={dbServer};Port={dbPort};Database={dbName};User={dbUser};Password={dbPassword};";

>>>>>>> origin/main
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString))
);

// ── Controllers + JSON snake_case ─────────────────────────────────────────────
builder.Services.AddControllers()
    .AddJsonOptions(opt =>
        opt.JsonSerializerOptions.PropertyNamingPolicy =
            System.Text.Json.JsonNamingPolicy.SnakeCaseLower);

<<<<<<< HEAD
=======
// ── CORS Policy Definition ────────────────────────────────────────────────────
// Định nghĩa tường minh cấu hình CORS từ tầng Service của WebApplication
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",  // Vite mặc định (HTTP)
                "https://localhost:5173", // Vite bảo mật (HTTPS)
                "http://localhost:3000"   // Cổng phụ/NextJS nếu có
              )
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();        // Hỗ trợ truyền cookie/authen bảo mật nếu cần
    });
});

>>>>>>> origin/main
// ── Swagger ───────────────────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo { Title = "ParkingManagement API", Version = "v1" });

<<<<<<< HEAD
    // Cấu hình nút Authorize trên Swagger
=======
>>>>>>> origin/main
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
<<<<<<< HEAD
}); builder.Services.AddMemoryCache(); // Thêm bộ nhớ đệm (cache) dùng cho rate limiting.

// ── Parking module ───────────────────────────────────────────────────────────────────────
builder.Services.AddScoped<IParkingRepository, ParkingRepository>();
builder.Services.AddScoped<IParkingService, ParkingService>();

// ── Booking module ───────────────────────────────────────────────────────────────────────
builder.Services.AddScoped<IBookingRepository, BookingRepository>();
builder.Services.AddScoped<IBookingService, BookingService>(); /* ADDED BY ANTIGRAVITY */

// ── Payment module ───────────────────────────────────────────────────────────────────────
builder.Services.AddScoped<IPaymentRepository, PaymentRepository>();
builder.Services.AddScoped<IPaymentService, PaymentService>();

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

var app = builder.Build();
=======
});

builder.Services.AddMemoryCache();

// ── Dependency Injection Modules ──────────────────────────────────────────────
builder.Services.AddScoped<IParkingRepository, ParkingRepository>();
builder.Services.AddScoped<IParkingService, ParkingService>();

builder.Services.AddScoped<IBookingRepository, BookingRepository>();

builder.Services.AddScoped<IIncidentRepository, IncidentRepository>();
builder.Services.AddScoped<IIncidentService, IncidentService>();

builder.Services.AddScoped<IBuildingRepository, BuildingRepository>();
builder.Services.AddScoped<IBuildingService, BuildingService>();

builder.Services.AddScoped<IVehicleTypeRepository, VehicleTypeRepository>();
builder.Services.AddScoped<IVehicleTypeService, VehicleTypeService>();

builder.Services.AddScoped<IFloorAllocationRepository, FloorAllocationRepository>();
builder.Services.AddScoped<IFloorAllocationService, FloorAllocationService>();

builder.Services.AddJwtAuthentication(builder.Configuration);

builder.Services.AddScoped<ISlotManagementRepository, SlotManagementRepository>();
builder.Services.AddScoped<ISlotManagementService, SlotManagementService>();

builder.Services.AddScoped<IPricingPolicyRepository, PricingPolicyRepository>();
builder.Services.AddScoped<IPricingPolicyService, PricingPolicyService>();

builder.Services.AddScoped<IDashboardRepository, DashboardRepository>();
builder.Services.AddScoped<IDashboardService, DashboardService>();

builder.Services.AddScoped<IBookingServiceRepository, BookingServiceRepository>();
builder.Services.AddScoped<IBookingService, BookingService>();

builder.Services.AddScoped<IPaymentRepository, PaymentRepository>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<ISystemConfigService, SystemConfigService>();
builder.Services.AddScoped<IFeedbackSerivce, FeedbackService>();

var app = builder.Build();

>>>>>>> origin/main
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
<<<<<<< HEAD
        Console.WriteLine(ex.ToString()); // In trọn vẹn dấu vết lỗi, tên file, số dòng bị sập
        Console.WriteLine("============================================\n");
    }
    
=======
        Console.WriteLine(ex.ToString());
        Console.WriteLine("============================================\n");
    }

>>>>>>> origin/main
    var (status, message) = ex switch
    {
        KeyNotFoundException => (404, ex.Message),
        InvalidOperationException => (422, ex.Message),
        ArgumentException => (400, ex.Message),
        _ => (500, "An unexpected error occurred")
    };
    ctx.Response.StatusCode = status;
    ctx.Response.ContentType = "application/json";
    var body = System.Text.Json.JsonSerializer.Serialize(new { success = false, message });
    await ctx.Response.WriteAsync(body);
}));

app.UseHttpsRedirection();
<<<<<<< HEAD
app.UseCors(policy => policy
    .WithOrigins("http://localhost:5173") // Cho phép duy nhất cổng React Frontend 
    .AllowAnyMethod()                     // Cho phép mọi phương thức GET, POST, PUT, DELETE
    .AllowAnyHeader());                   // Cho phép mọi Header truyền lên (Content-Type, Authorization)
// Security
app.UseMiddleware<ParkingManagement.Middlewares.TokenBlacklistMiddleware>(); // Check blacklist
app.UseAuthentication(); // Read JWT token
app.UseAuthorization(); // Check role/permission
app.UseStaticFiles();
app.MapControllers();
app.Run();
=======

app.UseCors("AllowReactFrontend");

app.UseAuthentication(); 
app.UseMiddleware<ParkingManagement.Middlewares.TokenBlacklistMiddleware>(); 
app.UseAuthorization(); 

app.MapControllers();

app.Run();
>>>>>>> origin/main
