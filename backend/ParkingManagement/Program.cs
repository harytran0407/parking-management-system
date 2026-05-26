using Microsoft.EntityFrameworkCore;
using ParkingManagement.Data;
using ParkingManagement.Repositories;
using ParkingManagement.Services;

var builder = WebApplication.CreateBuilder(args);

// Nạp các biến môi trường từ file .env - sử dụng thư viện DotNetEnv
DotNetEnv.Env.Load();
var dbServer = Environment.GetEnvironmentVariable("DB_SERVER");
var dbPort = Environment.GetEnvironmentVariable("DB_PORT");
var dbName = Environment.GetEnvironmentVariable("DB_NAME");
var dbUser = Environment.GetEnvironmentVariable("DB_USER");
var dbPassword = Environment.GetEnvironmentVariable("DB_PASSWORD");

// 1. Cấu hình kết nối MySQL tự động nhận diện phiên bản (AutoDetect)
var connectionString = $"server={dbServer};port={dbPort};database={dbName};user={dbUser};password={dbPassword};";
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString))
);

// 2. Đăng ký các dịch vụ Controller và Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 3. Đăng ký các Repository & Service (đảm bảo namespace trùng khớp với project của bạn)
builder.Services.AddScoped<IParkingRepository, ParkingRepository>();
builder.Services.AddScoped<IParkingService, ParkingService>();

var app = builder.Build();

// 4. Bật Swagger hoạt động
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Parking Management API V1");
    c.RoutePrefix = "swagger"; // Truy cập trực tiếp tại: localhost:port/swagger
});

app.UseAuthorization();
app.MapControllers();

Console.WriteLine("=== ỨNG DỤNG PARKING ĐANG CHẠY ===");
app.Run();