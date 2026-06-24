# 1. Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy file csproj và restore dependencies trước để tận dụng cache của Docker
COPY ["backend/ParkingManagement/ParkingManagement.csproj", "backend/ParkingManagement/"]
RUN dotnet restore "backend/ParkingManagement/ParkingManagement.csproj"

# Copy toàn bộ source code của backend
COPY backend/ParkingManagement/ backend/ParkingManagement/

# Chuyển thư mục làm việc đến thư mục chứa dự án và build
WORKDIR "/src/backend/ParkingManagement"
RUN dotnet build "ParkingManagement.csproj" -c Release -o /app/build

# 2. Publish stage
FROM build AS publish
RUN dotnet publish "ParkingManagement.csproj" -c Release -o /app/publish /p:UseAppHost=false

# 3. Final stage để chạy ứng dụng
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Expose cổng 8080 (Cổng mặc định cho ASP.NET Core 8.0 trong Docker)
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "ParkingManagement.dll"]