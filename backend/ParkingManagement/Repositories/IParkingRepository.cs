using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using ParkingManagement.Models;
using ParkingManagement.DTOs;

namespace ParkingManagement.Repositories
{
    /// <summary>
    /// Giao diện (Interface) định nghĩa các phương thức giao tiếp dữ liệu thô với Cơ sở dữ liệu liên quan đến nghiệp vụ bãi xe.
    /// </summary>
    public interface IParkingRepository
    {
        /// <summary>
        /// Kiểm tra xem một biển số xe có phiên gửi xe nào đang ở trạng thái hoạt động (ACTIVE) trong bãi hay không.
        /// </summary>
        /// <param name="licensePlate">Biển số xe cần kiểm tra hệ thống.</param>
        /// <returns>Trả về <see langword="true"/> nếu xe hiện đang nằm trong bãi; ngược lại trả về <see langword="false"/>.</returns>
        Task<bool> IsVehicleActiveInParkingAsync(string licensePlate);

        /// <summary>
        /// Tìm kiếm vị trí đỗ xe (Slot) còn trống đầu tiên phù hợp với loại phương tiện truyền vào.
        /// </summary>
        /// <param name="vehicleTypeId">Mã định danh duy nhất của loại xe (Ví dụ: 1: Xe máy, 2: Ô tô...).</param>
        /// <returns>Thực thể <see cref="ParkingSlot"/> đỗ xe tìm thấy hoặc <see langword="null"/> nếu hệ thống đã hết vị trí trống.</returns>
        Task<ParkingSlot?> FindFirstAvailableSlotAsync(int vehicleTypeId);

        /// <summary>
        /// Thêm mới một bản ghi phiên gửi xe (ParkingSession) vào cơ sở dữ liệu khi phương tiện vào bãi (Check-in).
        /// </summary>
        /// <param name="session">Thực thể chứa toàn bộ thông tin của phiên gửi xe mới cần khởi tạo.</param>
        /// <returns>Một Task đại diện cho hành động xử lý bất đồng bộ.</returns>
        Task CreateSessionAsync(ParkingSession session);

        /// <summary>
        /// Thực thi một chuỗi các hành động chỉnh sửa dữ liệu đồng thời trong một Cơ sở dữ liệu Transaction nhằm đảm bảo tính toàn vẹn (ACID).
        /// </summary>
        /// <param name="action">Hàm đại diện cho tập hợp các lệnh truy vấn dữ liệu cần chạy chung một phạm vi quản lý transaction.</param>
        /// <returns>Một Task đại diện cho hành động xử lý bất đồng bộ.</returns>
        Task SaveChangesWithTransactionAsync(Func<Task> action);

        /// <summary>
        /// Truy vấn thông tin chi tiết của một vị trí đỗ (ParkingSlot) kèm theo dữ liệu liên kết Khu vực (Zone).
        /// </summary>
        /// <param name="slotId">Mã định danh duy nhất của ô đỗ xe cần tìm kiếm.</param>
        /// <returns>Thực thể <see cref="ParkingSlot"/> tương ứng hoặc <see langword="null"/> nếu không tồn tại mã này trong hệ thống.</returns>
        Task<ParkingSlot?> GetSlotByIdAsync(string slotId);

        /// <summary>
        /// Tìm kiếm phiên gửi xe đang hoạt động (ACTIVE) trong bãi thông qua biển số xe lúc vào cổng.
        /// </summary>
        /// <param name="licensePlate">Chuỗi ký tự biển số xe cần thực hiện tra cứu.</param>
        /// <returns>Thực thể <see cref="ParkingSession"/> đang hoạt động kèm thông tin Slot/Zone liên kết, hoặc <see langword="null"/> nếu không tìm thấy xe trong bãi.</returns>
        Task<ParkingSession?> GetActiveSessionByPlateAsync(string licensePlate);

        /// <summary>
        /// Cập nhật thông tin Check-out của phiên gửi xe đồng thời giải phóng trạng thái ô đỗ về 'AVAILABLE' trong cùng một Transaction.
        /// </summary>
        /// <param name="session">Thực thể phiên gửi xe cần cập nhật dữ liệu ngày ra và tổng tiền thanh toán.</param>
        /// <param name="slotId">Mã định danh của ô đỗ xe cần được làm sạch trạng thái để đón xe tiếp theo.</param>
        /// <returns>Trả về <see langword="true"/> nếu quá trình cập nhật và hoàn tác cơ sở dữ liệu diễn ra an toàn; ngược lại trả về <see langword="false"/>.</returns>
        Task<bool> UpdateSessionAndSlotAsync(ParkingSession session, string slotId);

        /// <summary>
        /// Tìm kiếm phiên gửi xe đang hoạt động (ACTIVE) trong bãi dựa trên mã định danh duy nhất của phiên gửi (SessionId).
        /// </summary>
        /// <param name="sessionId">Chuỗi mã định danh duy nhất của phiên gửi xe cần truy vấn.</param>
        /// <returns>Thực thể <see cref="ParkingSession"/> tìm thấy kèm thông tin Slot/Zone liên kết, hoặc <see langword="null"/> nếu phiên không tồn tại hoặc đã kết thúc ra bãi.</returns>
        Task<ParkingSession?> GetActiveSessionByIdAsync(string sessionId);

        /// <summary>
        /// Cập nhật trạng thái ô đỗ và tự động ghi nhận lại lịch sử nhật ký (Log) thay đổi của hệ thống.
        /// </summary>
        /// <param name="slotId">Mã định danh duy nhất của ô đỗ xe cần cập nhật.</param>
        /// <param name="status">Trạng thái mới cần áp dụng (Ví dụ: AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE).</param>
        /// <param name="staffId">Mã định danh của nhân viên trực tiếp thực hiện thao tác thay đổi này.</param>
        /// <param name="reason">Lý do cụ thể hoặc nội dung giải trình cho việc thay đổi trạng thái.</param>
        /// <param name="estimatedDuration">Thời gian bảo trì hoặc đóng ô đỗ dự kiến (đơn vị: phút).</param>
        /// <returns>Trả về <see langword="true"/> nếu thao tác lưu cơ sở dữ liệu thành công; ngược lại trả về <see langword="false"/>.</returns>
        Task<bool> UpdateSlotStatusWithLogAsync(string slotId, string status, string staffId, string reason, int estimatedDuration);

        /// <summary>
        /// Cập nhật các thông tin thay đổi của một thực thể phiên gửi xe (ParkingSession) vào Cơ sở dữ liệu.
        /// </summary>
        /// <param name="session">Thực thể phiên gửi xe chứa các thông tin chỉnh sửa mới.</param>
        /// <returns>Một Task đại diện cho hành động xử lý bất đồng bộ.</returns>
        Task UpdateSessionAsync(ParkingSession session);

        /// <summary>
        /// Cập nhật các thông tin thay đổi của một thực thể ô đỗ xe (ParkingSlot) vào Cơ sở dữ liệu.
        /// </summary>
        /// <param name="slot">Thực thể ô đỗ xe chứa các thông tin chỉnh sửa mới.</param>
        /// <returns>Một Task đại diện cho hành động xử lý bất đồng bộ.</returns>
        Task UpdateSlotAsync(ParkingSlot slot);

        /// <summary>
        /// Truy vấn chính sách giá đang có hiệu lực (Active) áp dụng riêng cho một loại phương tiện cụ thể.
        /// </summary>
        /// <param name="vehicleTypeId">Mã định danh duy nhất của loại xe cần lấy biểu phí (Ví dụ: 1: Xe máy, 2: Ô tô...).</param>
        /// <returns>Thực thể <see cref="PricingPolicy"/> tương ứng cấu hình cho loại phương tiện đó, hoặc <see langword="null"/> nếu chưa được thiết lập chính sách giá.</returns>
        Task<PricingPolicy?> GetActivePricingPolicyByVehicleTypeAsync(int vehicleTypeId);

        /// <summary>
        /// Truy vấn danh sách các ô đỗ xe theo cơ chế phân trang, kết hợp bộ lọc tìm kiếm nâng cao và thống kê số lượng trạng thái thực tế.
        /// </summary>
        /// <param name="filter">Đối tượng chứa các tham số bộ lọc đầu vào như: Tầng, Khu vực, Loại xe, Trạng thái, Số trang và Kích thước trang.</param>
        /// <returns>
        /// Một Tuple chứa:
        /// <list type="bullet">
        /// <item><description><c>Slots</c>: Danh sách các thực thể vị trí đỗ xe thuộc trang hiện tại sau khi đã lọc.</description></item>
        /// <item><description><c>TotalCount</c>: Tổng số lượng bản ghi thỏa mãn điều kiện lọc (dùng để tính toán tổng số trang trên UI).</description></item>
        /// <item><description><c>StatusCounts</c>: Từ điển (Dictionary) chứa tổng số lượng ô đỗ phân bổ theo từng trạng thái cụ thể (AVAILABLE, OCCUPIED...).</description></item>
        /// </list>
        /// </returns>
        Task<(List<ParkingSlot> Slots, int TotalCount, Dictionary<string, int> StatusCounts)> GetPagedSlotsWithStatusAsync(SlotQueryFilterDto filter);

        Task<string> GetOperatingHoursForDayAsync(DateTime referenceTime);

        /// <summary>
        /// Lấy lịch sử gửi xe của một phương tiện dựa trên biển số xe, khoảng thời gian và loại phương tiện, đồng thời hỗ trợ phân trang kết quả trả về.
        /// </summary>
        Task<(List<ParkingSession> Items, int TotalCount)> GetParkingHistoryAsync(
            string? licensePlate,
            DateTime? fromDate,
            DateTime? toDate,
            string? vehicleType,
            int page,
            int pageSize);
    }
}