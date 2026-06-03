using Microsoft.EntityFrameworkCore;
using ParkingManagement.Data;
using ParkingManagement.Repositories;
using ParkingManagement.Services.BuildingServices;
using ParkingManagement.Services;
using ParkingManagement.Extensions;

var builder = WebApplication.CreateBuilder(args);

// ── Database ──────────────────────────────────────────────────────────────────
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString))
);

// ── Controllers + JSON snake_case ─────────────────────────────────────────────
builder.Services.AddControllers()
    .AddJsonOptions(opt =>
        opt.JsonSerializerOptions.PropertyNamingPolicy =
            System.Text.Json.JsonNamingPolicy.SnakeCaseLower);

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
}); builder.Services.AddMemoryCache(); // Thêm bộ nhớ đệm (cache) dùng cho rate limiting.

// ── Parking module ───────────────────────────────────────────────────────────────────────
builder.Services.AddScoped<IParkingRepository, ParkingRepository>();
builder.Services.AddScoped<IParkingService, ParkingService>();

// ── Booking module ───────────────────────────────────────────────────────────────────────
builder.Services.AddScoped<IBookingRepository, BookingRepository>();

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

// ── Slot management module ────────────────────────────────────────────────────
builder.Services.AddScoped<ISlotManagementRepository, SlotManagementRepository>();
builder.Services.AddScoped<ISlotManagementService, SlotManagementService>();

// ── Pricing Policy module ─────────────────────────────────────────────────────
builder.Services.AddScoped<IPricingPolicyRepository, PricingPolicyRepository>();
builder.Services.AddScoped<IPricingPolicyService, PricingPolicyService>();

// ── Dashboard module ──────────────────────────────────────────────────────────
builder.Services.AddScoped<IDashboardRepository, DashboardRepository>();
builder.Services.AddScoped<IDashboardService, DashboardService>();

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
        _ => (500, "An unexpected error occurred")
    };
    ctx.Response.StatusCode = status;
    ctx.Response.ContentType = "application/json";
    var body = System.Text.Json.JsonSerializer.Serialize(new { success = false, message });
    await ctx.Response.WriteAsync(body);
}));

app.UseHttpsRedirection();
app.UseCors(policy => policy
    .WithOrigins("http://localhost:5173") // Cho phép duy nhất cổng React Frontend 
    .AllowAnyMethod()                     // Cho phép mọi phương thức GET, POST, PUT, DELETE
    .AllowAnyHeader());                   // Cho phép mọi Header truyền lên (Content-Type, Authorization)
// Security
app.UseMiddleware<ParkingManagement.Middlewares.TokenBlacklistMiddleware>(); // Check blacklist
app.UseStaticFiles(); 
app.UseAuthentication(); // Read JWT token
app.UseAuthorization(); // Check role/permission

app.MapControllers();
app.Run();
