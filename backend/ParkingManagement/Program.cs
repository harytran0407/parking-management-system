using Microsoft.EntityFrameworkCore;
using ParkingManagement.Data;
using ParkingManagement.Repositories;
using ParkingManagement.Services.BuildingServices;
using ParkingManagement.Services;

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
builder.Services.AddSwaggerGen();

// ── Parking module ───────────────────────────────────────────────────────────────────────
builder.Services.AddScoped<IParkingRepository, ParkingRepository>();
builder.Services.AddScoped<IParkingService, ParkingService>();

// ── Building module ───────────────────────────────────────────────────────────
builder.Services.AddScoped<IBuildingRepository, BuildingRepository>();
builder.Services.AddScoped<IBuildingService, BuildingService>();

// ── VehicleType module ────────────────────────────────────────────────────────
builder.Services.AddScoped<IVehicleTypeRepository, VehicleTypeRepository>();
builder.Services.AddScoped<IVehicleTypeService, VehicleTypeService>();

// ── VehicleFloor module ────────────────────────────────────────────────────────
builder.Services.AddScoped<IFloorAllocationRepository, FloorAllocationRepository>();
builder.Services.AddScoped<IFloorAllocationService, FloorAllocationService>();

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
app.MapControllers();
app.Run();
