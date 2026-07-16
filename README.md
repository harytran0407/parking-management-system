# eParking Management System
> **eParking Management System** - Hệ thống quản lý bãi gửi xe thông minh và tự động hóa.
>
> - Link live demo: https://eparking-v1.vercel.app/

---

##  Tính năng nổi bật (Features)

Hệ thống eParking hỗ trợ đầy đủ các nghiệp vụ quản lý bãi xe từ cấp độ hệ thống đến khách hàng vãng lai với các tính năng chính:

*   **Tự động nhận diện biển số xe (ANPR)**: Module AI tích hợp mô hình YOLOv8 và thư viện EasyOCR giúp phát hiện phương tiện, khoanh vùng biển số xe và trích xuất chữ viết thực tế thời gian thực tại các cổng barie vào/ra.
*   **Thanh toán nhanh (Quick Pay)**: Hỗ trợ khách hàng vãng lai tra cứu nhanh thông tin đỗ xe qua biển số xe và mã vé mà không cần đăng nhập. Cho phép thanh toán trực tuyến tức thì thông qua tích hợp cổng thanh toán VietQR (PayOS) hoặc Mock Payment thử nghiệm.
*   **Đặt chỗ trước (Booking)**: Khách hàng đăng ký tài khoản có thể tìm kiếm các ô đỗ còn trống, đặt chỗ trước thời gian đến, tùy chọn ô đỗ dành cho xe điện (EV Charging) hoặc xe khuyết tật, và nhận chỉ đường vị trí đỗ.
*   **Sơ đồ bãi đỗ trực quan (Floor Overview & Slot Layout)**: Giao diện sơ đồ phân khu (Zone) hiển thị trạng thái thời gian thực của từng ô đỗ xe:
    *   *Available (Còn trống)*: Màu xanh lá.
    *   *Occupied (Đang đỗ)*: Màu đỏ.
    *   *Reserved/Booked (Đã đặt)*: Màu cam.
    *   *Maintenance (Bảo trì)*: Màu xám.
*   **Kiểm soát cổng vào/ra (Staff Gate Control)**: Nhân viên cổng có giao diện giám sát so sánh ảnh chụp biển số xe lúc vào và lúc ra, kiểm tra trạng thái vé và phê duyệt cho xe qua cổng thủ công hoặc tự động.
*   **Quản lý sự cố (Incident Management)**: Quy trình gửi báo cáo sự cố (mất vé, hư hỏng xe, lỗi kỹ thuật) từ phía khách hàng hoặc nhân viên, cùng giao diện tiếp nhận và giải quyết đền bù của Quản lý bãi xe.
*   **Quản lý chính sách giá (Pricing Policy)**: Thiết lập cấu hình bảng giá đỗ xe động theo loại phương tiện (xe máy, ô tô, xe điện) và hình thức gửi (vãng lai theo block giờ hoặc đặt trước theo ngày).
*   **Bảo mật & Giám sát hệ thống**:
    *   Phân quyền người dùng chặt chẽ (RBAC) gồm: *SystemAdmin, ParkingManager, ParkingStaff, ParkingUser*.
    *   Kiểm soát truy cập an toàn bằng JWT Bearer token.
    *   Tích hợp bộ lọc IP (IP Filtering) và giới hạn tần suất yêu cầu (Rate Limiting) ngăn chặn Spam/DDoS.
    *   Hệ thống ghi nhật ký hoạt động (Audit Logs) lưu trữ vết thao tác của người dùng.

---

##  Công nghệ sử dụng (Tech Stack)

*   **Ngôn ngữ lập trình:** C# (.NET 8.0/9.0), JavaScript (React ES6+), Python 3.9+
*   **Backend:** ASP.NET Core Web API, Entity Framework Core, JWT Bearer Authentication, MailKit, PayOS SDK (VietQR Gateway)
*   **Frontend:** React (Vite), Tailwind CSS (Aesthetics UI), Lucide React (Icons), Axios, React Router DOM
*   **Module AI (ANPR):** OpenCV, YOLOv8 (Ultralytics), EasyOCR, PyTorch, SORT Tracker (Object tracking)
*   **Cơ sở dữ liệu:** MySQL Server 
*   **Công cụ phát triển & Triển khai:** Docker & Docker Compose, Swagger (OpenAPI Document), Git

---


