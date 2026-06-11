using Microsoft.EntityFrameworkCore;
using ParkingManagement.Data;
using ParkingManagement.Extensions;
using ParkingManagement.Repositories;
using ParkingManagement.Services;
using ParkingManagement.Services.BookingServices;
using ParkingManagement.Services.BuildingServices;
using ParkingManagement.Dtos;


var builder = WebApplication.CreateBuilder(args);

// ── .ENV Reader ───────────────────────────────────────────────────────────────
DotNetEnv.Env.Load();

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

// ── Swagger ───────────────────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo { Title = "ParkingManagement API", Version = "v1" });

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
        Console.WriteLine(ex.ToString());
        Console.WriteLine("============================================\n");
    }

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

app.UseCors("AllowReactFrontend");

app.UseAuthentication(); 
app.UseMiddleware<ParkingManagement.Middlewares.TokenBlacklistMiddleware>(); 
app.UseAuthorization(); 

app.MapControllers();

app.Run();