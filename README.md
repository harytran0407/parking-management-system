# eParking Management System
> **eParking Management System** - Hệ thống quản lý bãi gửi xe thông minh và tự động hóa.

---

## 🚀 Tính năng nổi bật (Features)

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

## 🛠️ Công nghệ sử dụng (Tech Stack)

*   **Ngôn ngữ lập trình:** C# (.NET 8.0/9.0), JavaScript (React ES6+), Python 3.9+
*   **Backend:** ASP.NET Core Web API, Entity Framework Core, JWT Bearer Authentication, MailKit, PayOS SDK (VietQR Gateway)
*   **Frontend:** React (Vite), Tailwind CSS (Aesthetics UI), Lucide React (Icons), Axios, React Router DOM
*   **Module AI (ANPR):** OpenCV, YOLOv8 (Ultralytics), EasyOCR, PyTorch, SORT Tracker (Object tracking)
*   **Cơ sở dữ liệu:** MySQL Server (hoặc MariaDB)
*   **Công cụ phát triển & Triển khai:** Docker & Docker Compose, Swagger (OpenAPI Document), Git

---

## 📁 Cấu trúc thư mục (Project Structure)

Dưới đây là cấu trúc thư mục rút gọn của dự án:

```
parking-management-system/
├── backend/                   # Source code Backend (ASP.NET Core Web API)
│   ├── README.md              # Tài liệu hướng dẫn riêng của backend
│   └── ParkingManagement/     # Project ASP.NET Core chính
│       ├── Controllers/       # APIs xử lý nghiệp vụ (Auth, Parking, Booking, Incidents,...)
│       ├── DTOs/              # Data Transfer Objects trao đổi dữ liệu
│       ├── Data/              # Lớp AppDbContext kết nối cơ sở dữ liệu MySQL
│       ├── Extensions/        # Phương thức mở rộng cấu hình JWT, DI Service
│       ├── Middlewares/       # Bộ lọc IP (IpFilter), Xử lý lỗi tập trung (Global Exception)
│       ├── Models/            # Lớp thực thực Entity Framework (User, Slot, Payment, Booking,...)
│       ├── Repositories/      # Lớp tương tác CSDL trực tiếp (Data Access Layer)
│       ├── Services/          # Lớp logic nghiệp vụ chính (Business Logic Layer)
│       ├── Program.cs         # Cấu hình khởi tạo và định tuyến của Server Web API
│       └── appsettings.json   # Cấu hình môi trường mặc định của ứng dụng
├── frontend/                  # Source code Frontend (React + Vite + Tailwind CSS)
│   ├── public/                # Tài nguyên tĩnh công khai (Ảnh, Icons, Logo)
│   └── src/                   # Source code React chính
│       ├── assets/            # CSS và hình ảnh dùng chung
│       ├── components/        # Components tái sử dụng (Header, Sidebar, Modals,...)
│       ├── context/           # React Context (Quản lý Auth, Language, Theme,...)
│       ├── layouts/           # Giao diện khung định tuyến (Admin, Manager, Staff, User Layout)
│       ├── pages/             # Trang giao diện theo phân quyền của user
│       │   ├── admin/         # Quản trị viên (Users, Logs, Dashboard,...)
│       │   ├── manager/       # Quản lý (Slots, Pricing, IncidentManager,...)
│       │   ├── staff/         # Nhân viên (Gate In/Out, Reconciliation, Incidents,...)
│       │   └── user/          # Khách hàng (Dashboard, Bookings, QuickPay, Issues,...)
│       ├── utils/             # Trình gọi API Axios cấu hình sẵn, định dạng dữ liệu
│       └── App.jsx            # Điều phối định tuyến ứng dụng chính
├── python-ai/                 # Module AI Nhận diện biển số xe tự động (ANPR)
│   ├── main.py                # Script chạy phát hiện, theo vết và đọc biển số từ luồng video
│   ├── util.py                # Hàm phụ trợ (xử lý EasyOCR, lọc nhiễu văn bản biển số)
│   ├── models/                # Thư mục lưu trữ file weights của YOLOv8 (.pt)
│   └── requirements.txt       # Danh sách thư viện Python cần cài đặt
├── docker-compose.yml         # File Docker Compose khởi chạy toàn bộ dịch vụ
├── Dockerfile                 # Cấu hình đóng gói Docker cho backend
└── README.md                  # Tài liệu tổng quan dự án (File này)
```

---

## ⚙️ Cài đặt & Chạy thử (Installation & Setup)

### Yêu cầu hệ thống (Prerequisites)

*   **Hệ điều hành:** Windows 10/11, macOS, hoặc Linux
*   **Công cụ bắt buộc:**
    *   [.NET SDK 8.0+](https://dotnet.microsoft.com/download/dotnet/8.0)
    *   [Node.js v18.0+](https://nodejs.org/) (khuyên dùng bản LTS)
    *   [MySQL Server 8.0+](https://dev.mysql.com/downloads/installer/) hoặc Docker Desktop
    *   [Python 3.9+](https://www.python.org/downloads/) (cho module AI)

---

### Các bước cài đặt

#### 1. Clone repository
```bash
git clone <repository-url>
cd parking-management-system
```

#### 2. Cấu hình CSDL & Khởi chạy Backend
1. Di chuyển vào thư mục backend:
   ```bash
   cd backend/ParkingManagement
   ```
2. Tạo tệp `.env` dựa trên `.env.example` và cấu hình các biến môi trường phù hợp (địa chỉ DB, thông tin xác thực Mail, khóa bảo mật PayOS, JWT Secret).
3. Chạy cập nhật database bằng EF Migrations:
   ```bash
   dotnet ef database update
   ```
4. Khởi chạy dự án:
   ```bash
   dotnet run
   ```
   *Mặc định, Swagger API sẽ mở tại địa chỉ `http://localhost:5292/swagger/index.html` hoặc `https://localhost:7292/swagger/index.html`.*

#### 3. Khởi chạy Frontend (React Web App)
1. Di chuyển vào thư mục frontend:
   ```bash
   cd ../../frontend
   ```
2. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```
3. Tạo tệp `.env` và cấu hình URL API Backend (ví dụ: `VITE_API_BASE_URL=http://localhost:5292/api/v1`).
4. Khởi chạy ứng dụng trong môi trường phát triển:
   ```bash
   npm run dev
   ```
   *Ứng dụng web sẽ được chạy tại cổng mặc định `http://localhost:5173`.*

#### 4. Khởi chạy Module AI (ANPR) (Tùy chọn)
1. Di chuyển vào thư mục AI:
   ```bash
   cd ../python-ai
   ```
2. Cài đặt các thư viện cần thiết:
   ```bash
   pip install -r requirements.txt
   ```
3. Đảm bảo bạn đã đặt tệp mô hình YOLOv8 phát hiện phương tiện và biển số vào thư mục `models/`.
4. Chạy script để thử nghiệm xử lý nhận diện:
   ```bash
   python main.py
   ```
