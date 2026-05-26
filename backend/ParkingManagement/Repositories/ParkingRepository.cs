using Microsoft.EntityFrameworkCore;
using ParkingManagement.Data;
using ParkingManagement.Models;

namespace ParkingManagement.Repositories
{
    /// <summary>
    /// Lớp thực thi (Implementation) các truy vấn dữ liệu thực tế bằng Entity Framework Core.
    /// </summary>
    public class ParkingRepository : IParkingRepository
    {
        // Khai báo thực thể DbContext để làm việc với các bảng dữ liệu
        private readonly AppDbContext _context;

        /// <summary>
        /// Hàm khởi tạo nhận DbContext thông qua cơ chế Dependency Injection (DI) của hệ thống
        /// </summary>
        public ParkingRepository(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Kiểm tra xem một biển số xe có đang nằm trong bãi và ở trạng thái hoạt động hay không.
        /// </summary>
        /// <param name="licensePlate">Biển số xe cần kiểm tra</param>
        /// <returns>True nếu xe đang ở trong bãi, ngược lại trả về False</returns>
        public async Task<bool> IsVehicleActiveInParkingAsync(string licensePlate)
        {
            // Sử dụng AnyAsync để kiểm tra sự tồn tại bản ghi. 
            return await _context.ParkingSessions
                .AnyAsync(s => s.LicensePlateIn == licensePlate && s.Status == "ACTIVE");
        }

        /// <summary>
        /// Thuật toán tìm kiếm vị trí đỗ còn trống đầu tiên phù hợp với loại xe (Smart Allocation).
        /// Ưu tiên xếp xe vào tầng thấp nhất và tên ô đỗ theo thứ tự danh mục.
        /// </summary>
        /// <param name="vehicleTypeId">Mã loại xe (Ví dụ: 1 cho Xe máy, 2 cho Ô tô...)</param>
        /// <returns>Đối tượng kiểu dynamic chứa các thuộc tính ẩn danh, hoặc null nếu hết chỗ</returns>
        public async Task<dynamic?> FindFirstAvailableSlotAsync(int vehicleTypeId)
        {
            // Sử dụng cú pháp LINQ Query Syntax để thực hiện gộp (Join) dữ liệu từ 2 bảng khác nhau
            var query = from slot in _context.ParkingSlots // Đứng từ bảng vị trí đỗ (ParkingSlots)
                        join zone in _context.Set<FloorZone>() on slot.ZoneId equals zone.ZoneId // Liên kết sang bảng khu vực (FloorZone) dựa trên mã chung ZoneId

                        // Lọc điều kiện: Ô đỗ phải trống AND Khu vực đó phải khớp loại xe khách đi AND Khu vực đó đang mở cửa (ACTIVE)
                        where slot.Status == "AVAILABLE" && zone.VehicleTypeId == vehicleTypeId && zone.Status == "ACTIVE"

                        // Sắp xếp thứ tự: Ưu tiên tầng thấp trước (FloorNumber tăng dần), sau đó đến tên ô đỗ (SlotName từ A -> Z)
                        orderby zone.FloorNumber ascending, slot.SlotName ascending

                        // Trích xuất và đóng gói thành một đối tượng kiểu mới chứa các trường cần thiết
                        select new
                        {
                            SlotId = slot.SlotId,
                            SlotName = slot.SlotName,
                            FloorNumber = zone.FloorNumber,
                            ZoneName = zone.ZoneName
                        };

            // Thực thi truy vấn xuống DB và chỉ lấy ra bản ghi hợp lệ đầu tiên xuất hiện (nếu không có trả về null)
            return await query.FirstOrDefaultAsync();
        }

        /// <summary>
        /// Thêm một bản ghi phiên gửi xe mới vào bộ nhớ đệm Tracking của Entity Framework.
        /// </summary>
        /// <param name="session">Thực thể ParkingSession chứa dữ liệu xe vào</param>
        public async Task CreateSessionAsync(ParkingSession session)
        {
            // Lệnh này mới chỉ đưa bản ghi vào hàng chờ (State = Added), chưa ghi trực tiếp xuống Database vật lý
            await _context.ParkingSessions.AddAsync(session);
        }

        /// <summary>
        /// Tìm kiếm thông tin chi tiết của một vị trí đỗ dựa vào mã ID.
        /// </summary>
        /// <param name="slotId">Mã định danh của ô đỗ xe</param>
        /// <returns>Thực thể ParkingSlot nếu tìm thấy, ngược lại trả về null</returns>
        public async Task<ParkingSlot?> GetSlotByIdAsync(string slotId)
        {
            // FindAsync sẽ ưu tiên tìm trong bộ nhớ đệm (Cache) của EF trước để tối ưu, nếu không có mới truy vấn xuống Database
            return await _context.ParkingSlots.FindAsync(slotId);
        }

        /// <summary>
        /// Quản lý việc lưu trữ dữ liệu tập trung bọc trong một Database Transaction.
        /// </summary>
        /// <param name="action">Đoạn code logic thay đổi dữ liệu (Delegate/Func) truyền xuống từ tầng Service</param>
        public async Task SaveChangesWithTransactionAsync(Func<Task> action)
        {
            // Khởi tạo một Transaction bất đồng bộ từ Database của DbContext
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1. Thực thi đoạn code logic thay đổi dữ liệu được truyền từ Service xuống (Ví dụ: Thêm Session, Sửa Slot)
                await action();

                // 2. Gom tất cả các thay đổi trong hàng chờ và đẩy một loạt lệnh SQL xuống Database
                await _context.SaveChangesAsync();

                // 3. Nếu không phát sinh lỗi, chính thức chốt dữ liệu (Commit) ghi vĩnh viễn vào Database
                await transaction.CommitAsync();
            }
            catch
            {
                // 4. Nếu có bất kỳ lỗi nào xảy ra trong quá trình chạy
                // Lập tức kích hoạt lệnh hủy bỏ (Rollback), hoàn nguyên toàn bộ các lệnh SQL đã chạy trước đó về trạng thái ban đầu để tránh rác DB
                await transaction.RollbackAsync();

                // Tiếp tục quăng lỗi ra ngoài để tầng Service và Controller bắt lấy và hiển thị thông báo
                throw;
            }
        }
    }
}