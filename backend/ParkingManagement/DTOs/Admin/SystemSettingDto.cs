namespace ParkingManagement.DTOs.Admin
{
    // Dùng để trả về thông tin cấu hình
    public class SystemSettingDto
    {
        public string SettingKey { get; set; } = string.Empty;
        public string SettingValue { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    // Dùng để nhận request cập nhật (ví dụ cập nhật API Key)
    public class UpdateSystemSettingDto
    {
        public string SettingValue { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    // Dùng để trả về danh sách Log
    public class SystemLogDto
    {
        public int LogId { get; set; }
        public string LogLevel { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string? Source { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
