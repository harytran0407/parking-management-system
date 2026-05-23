# Parking Building Management System — API Documentation

> **Base URL:** `http://localhost:5000`  


---

## Role-Based Access Control (RBAC)

| Role | Mô tả |
|------|-------|
| `SystemAdmin` | Quản trị hệ thống |
| `ParkingManager` | Quản lý bãi xe |
| `ParkingStaff` | Nhân viên giữ xe |
| `ParkingUser` | Người dùng gửi xe |

> **DB ref:** Bảng `ROLE` — `ROLE_NAME ENUM('SystemAdmin','ParkingManager','ParkingStaff','ParkingUser')`

---

## API Modules

---

# 1. Authentication Module

## 1.1 User Login

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/auth/login` |
| **Authentication** | Không yêu cầu |
| **Roles** | Tất cả |

**Request Headers**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body**
```json
{
  "email": "staff@parking.com",
  "password": "123456"
}
```

**Validation Rules**

| Field | Rule |
|-------|------|
| `email` | Bắt buộc, định dạng email hợp lệ, tối đa 100 ký tự |
| `password` | Bắt buộc, tối thiểu 6 ký tự, tối đa 255 ký tự |

**Success Response (200 OK)**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "JWT_ACCESS_TOKEN",
    "expires_in": 3600,
    "token_type": "Bearer",
    "user": {
      "user_id": "usr_001",
      "full_name": "Nguyen Van A",
      "email": "staff@parking.com",
      "role": "ParkingStaff"
    }
  }
}
```

> **DB ref:** `USERS.USER_ID VARCHAR(20)`, `USERS.FULL_NAME`, `USERS.EMAIL`, `ROLE.ROLE_NAME`

**Error Responses**

```json
// 401 — Sai thông tin đăng nhập
{ "success": false, "error_code": "INVALID_CREDENTIALS", "message": "Invalid email or password" }

// 401 — Tài khoản bị khoá
{ "success": false, "error_code": "ACCOUNT_LOCKED", "message": "Account has been locked due to multiple failed login attempts" }

// 403 — Tài khoản không hoạt động
{ "success": false, "error_code": "ACCESS_DENIED", "message": "Account inactive or not verified" }

// 429 — Quá nhiều lần thử
{ "success": false, "error_code": "TOO_MANY_ATTEMPTS", "message": "Too many login attempts. Please try again later" }
```

**JWT Claims**
```json
{
  "sub": "usr_001",
  "email": "staff@parking.com",
  "role": "ParkingStaff",
  "session_id": "a8d9f7",
  "exp": 1749999999
}
```

> `sub` tương ứng `USERS.USER_ID VARCHAR(20)`

**DB Tables:** `USERS`, `ROLE`

---

## 1.2 Logout

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/auth/logout` |
| **Authentication** | Bắt buộc |

**Request Headers**
```
Authorization: Bearer JWT_ACCESS_TOKEN
```

**Success Response (200 OK)**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

# 2. User Management Module

## 2.1 Get All Users (Admin)

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Endpoint** | `/api/v1/admin/users` |
| **Authentication** | Bắt buộc |
| **Roles** | `SystemAdmin` |

**Query Parameters**

| Parameter | Type | Required | Default | Mô tả |
|-----------|------|----------|---------|-------|
| `page` | int | No | 1 | Số trang |
| `page_size` | int | No | 20 | Số bản ghi mỗi trang (tối đa 100) |
| `role` | string | No | — | Lọc theo role |
| `status` | string | No | — | `ACTIVE` / `INACTIVE` / `BANNED` |
| `search` | string | No | — | Tìm theo tên hoặc username |

> `status` tương ứng `USERS.STATUS ENUM('ACTIVE','INACTIVE','BANNED')`

**Success Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "user_id": "usr_001",
        "username": "staff_nguyenvanA",
        "full_name": "Nguyễn Văn A",
        "email": "nguyenvana@parking.com",
        "phone": "0901234567",
        "role": "ParkingStaff",
        "status": "ACTIVE",
        "last_login": "2024-01-15T08:30:00Z",
        "created_at": "2023-06-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total_items": 45,
      "total_pages": 3
    }
  }
}
```

**DB Tables:** `USERS`, `ROLE`

---

## 2.2 Create User

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/admin/users` |
| **Roles** | `SystemAdmin` |

**Request Body**
```json
{
  "user_id": "usr_002",
  "username": "staff_tranvanB",
  "password": "TempPass@123",
  "full_name": "Trần Văn B",
  "email": "tranvanb@parking.com",
  "phone": "0901234568",
  "role": "ParkingStaff"
}
```


**Success Response (201 Created)**
```json
{
  "success": true,
  "data": {
    "user_id": "usr_002",
    "username": "staff_tranvanB",
    "message": "User created successfully."
  }
}
```

---

## 2.3 Update User

| Property | Value |
|----------|-------|
| **Method** | `PUT` |
| **Endpoint** | `/api/v1/admin/users/{user_id}` |
| **Roles** | `SystemAdmin` |

**Request Body** 
```json
{
  "full_name": "Trần Văn B (Updated)",
  "phone": "0909999999",
  "status": "INACTIVE",
  "role": "ParkingManager"
}
```

**Success Response (200 OK)**
```json
{
  "success": true,
  "message": "User updated successfully."
}
```

---

## 2.4 Delete User (Soft Delete)

| Property | Value |
|----------|-------|
| **Method** | `DELETE` |
| **Endpoint** | `/api/v1/admin/users/{user_id}` |
| **Roles** | `SystemAdmin` |


**Success Response (204 No Content)**

---

## 2.5 Change Password

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/auth/change-password` |
| **Authentication** | Bắt buộc |

**Request Body**
```json
{
  "current_password": "OldPass@123",
  "new_password": "NewPass@456",
  "confirm_password": "NewPass@456"
}
```

**Validation Rules**
- Mật khẩu tối thiểu 8 ký tự
- Phải chứa chữ hoa, chữ thường, số, ký tự đặc biệt
- Không được trùng với 3 mật khẩu gần nhất

**Success Response (200 OK)**
```json
{
  "success": true,
  "message": "Password changed successfully."
}
```

---

# 3. Parking Management Module

## 3.1 Get Building Information

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Endpoint** | `/api/v1/parking/buildings/info` |
| **Authentication** | Không bắt buộc (thông tin công khai) |

**Success Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "building_id": "B01",
    "building_name": "Trung Hòa Parking Tower",
    "address": "Số 1 Trung Hòa, Cầu Giấy, Hà Nội",
    "total_floors": 8,
    "total_slots": 500,
    "operation_hours": {
      "weekday_hours": "06:00 - 22:00",
      "weekend_hours": "07:00 - 23:00",
      "is_24_7": false
    },
    "status": "ACTIVE",
    "current_occupancy": {
      "total_occupied": 320,
      "total_available": 180,
      "occupancy_rate": 64
    }
  }
}
```

> `status` tương ứng `PARKING_BUILDING.STATUS ENUM('ACTIVE','MAINTENANCE','CLOSED')`

**DB Tables:** `PARKING_BUILDING`, `PARKING_SLOT`, `FLOOR_ZONE`

---

## 3.2 Get Parking Slots with Real-time Status

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Endpoint** | `/api/v1/parking/slots` |
| **Authentication** | Bắt buộc |
| **Roles** | `ParkingStaff`, `ParkingManager`, `ParkingUser` |

**Query Parameters**

| Parameter | Type | Required | Mô tả |
|-----------|------|----------|-------|
| `floor` | int | No | Lọc theo tầng (`FLOOR_ZONE.FLOOR_NUMBER`) |
| `zone` | string | No | Lọc theo khu (`FLOOR_ZONE.ZONE_NAME`) |
| `vehicle_type_id` | int | No | Lọc theo loại phương tiện |
| `status` | string | No | `AVAILABLE` / `OCCUPIED` / `RESERVED` / `MAINTENANCE` |
| `page` | int | No | Số trang |
| `page_size` | int | No | Số bản ghi mỗi trang |

> `status` tương ứng `PARKING_SLOT.STATUS ENUM('AVAILABLE','OCCUPIED','RESERVED','MAINTENANCE')`

**Success Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_slots": 500,
      "available": 180,
      "occupied": 290,
      "reserved": 20,
      "maintenance": 10
    },
    "slots": [
      {
        "slot_id": "slt_001",
        "slot_name": "A101",
        "floor": 1,
        "zone": "A",
        "vehicle_type_id": 1,
        "status": "AVAILABLE",
        "is_handicap": false,
        "is_electric_charging": true,
        "current_session_id": null,
        "last_updated": "2026-05-17T09:00:00Z"
      },
      {
        "slot_id": "slt_002",
        "slot_name": "A102",
        "floor": 1,
        "zone": "A",
        "vehicle_type_id": 1,
        "status": "OCCUPIED",
        "is_handicap": false,
        "is_electric_charging": false,
        "current_session_id": "sess_12345",
        "occupied_by_plate": "51H-12345",
        "occupied_since": "2026-05-17T08:15:00Z",
        "last_updated": "2026-05-17T08:15:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total_items": 500,
      "total_pages": 25
    }
  }
}
```

> `slot_name` tương ứng `PARKING_SLOT.SLOT_NAME`
> `current_session_id` tương ứng `PARKING_SLOT.CURRENT_SESSION_ID VARCHAR(20)`

**DB Tables:** `PARKING_SLOT`, `FLOOR_ZONE`, `VEHICLE_TYPE`

---

## 3.3 Update Slot Status

| Property | Value |
|----------|-------|
| **Method** | `PUT` |
| **Endpoint** | `/api/v1/parking/slots/{slot_id}/status` |
| **Roles** | `ParkingStaff`, `ParkingManager` |

**Request Body**
```json
{
  "status": "MAINTENANCE",
  "reason": "Damaged barrier",
  "estimated_duration_minutes": 120
}
```

> `status`: `AVAILABLE`, `OCCUPIED`, `RESERVED`, `MAINTENANCE`

**Success Response (200 OK)**
```json
{
  "success": true,
  "message": "Slot status updated successfully.",
  "data": {
    "slot_id": "slt_001",
    "slot_name": "A101",
    "status": "MAINTENANCE",
    "last_updated": "2026-05-17T10:00:00Z"
  }
}
```

---

## 3.4 Configure Floor Zoning by Vehicle Type

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/parking/config/floor-zoning` |
| **Roles** | `ParkingManager` |

**Request Body**
```json
{
  "building_id": "B01",
  "zones": [
    {
      "zone_name": "A",
      "floor_number": 1,
      "vehicle_type_id": 1,
      "capacity": 100
    },
    {
      "zone_name": "B",
      "floor_number": 2,
      "vehicle_type_id": 2,
      "capacity": 50
    }
  ]
}
```

> `FLOOR_ZONE`: `ZONE_NAME`, `FLOOR_NUMBER`, `VEHICLE_TYPE_ID`, `CAPACITY`, `BUILDING_ID`

**Success Response (201 Created)**
```json
{
  "success": true,
  "message": "Floor zoning configured successfully.",
  "data": {
    "zones_created": 2
  }
}
```

**DB Tables:** `FLOOR_ZONE`, `VEHICLE_TYPE`, `PARKING_BUILDING`

---

## 3.5 AI-Powered Smart Slot Allocation *(Beta)*

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/parking/slot-recommendations` |
| **Authentication** | Bắt buộc |
| **Roles** | `ParkingStaff`, `ParkingUser` |


**Request Body**
```json
{
  "vehicle_type_id": 1,
  "license_plate": "29A-123.45",
  "preferences": {
    "prefer_near_elevator": true,
    "avoid_handicap": true,
    "preferred_floors": [1, 2]
  }
}
```

**Success Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "allocated_slot": {
      "slot_id": "slt_089",
      "slot_name": "C045",
      "floor": 3,
      "zone": "C",
      "distance_to_elevator_meters": 12,
      "estimated_walking_time_seconds": 18
    },
    "allocation_score": 94.5,
    "allocation_reason": "Optimal based on vehicle type, floor 3 has 40% occupancy, preferred distance to elevator",
    "alternative_slots": [
      { "slot_name": "C046", "floor": 3, "distance_to_elevator_meters": 15 },
      { "slot_name": "D012", "floor": 4, "distance_to_elevator_meters": 25 }
    ]
  }
}
```

**AI Scoring Weights**

| Tiêu chí | Trọng số |
|----------|----------|
| Vehicle type compatibility | 30% |
| Distance to exit/elevator | 25% |
| Floor occupancy rate (inverse) | 20% |
| Historical user preference | 15% |
| Estimated parking duration | 10% |

---

## 3.6 Floor Efficiency Report

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Endpoint** | `/api/v1/parking/analytics/floor-efficiency` |
| **Roles** | `ParkingManager`, `SystemAdmin` |

**Success Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "floor_efficiency": [
      {
        "floor": 1,
        "vehicle_type_id": 1,
        "total_slots": 100,
        "peak_occupancy_rate": 92,
        "avg_wait_time_seconds": 45,
        "utilization_score": 88.5,
        "recommendation": "Consider converting 10 slots to electric charging"
      }
    ],
    "overall_efficiency_score": 82.3,
    "peak_hours": [
      { "hour": 8, "occupancy_rate": 85 },
      { "hour": 9, "occupancy_rate": 78 },
      { "hour": 17, "occupancy_rate": 75 },
      { "hour": 18, "occupancy_rate": 82 }
    ]
  }
}
```

**DB Tables:** `PARKING_BUILDING`, `PARKING_SLOT`, `FLOOR_ZONE`, `PARKING_SESSION`

---

# 4. Vehicle Management Module

## 4.1 Register Vehicle

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/vehicles/register` |
| **Authentication** | Bắt buộc |
| **Roles** | `ParkingUser` |

> Thông tin chủ xe (tên, số điện thoại, email) được lấy từ `USERS` thông qua JWT — không cần gửi lại trong request body.

**Request Body**
```json
{
  "vehicle_plate_number": "29A-12345",
  "vehicle_type_id": 1,
  "brand": "Toyota",
  "model": "Vios",
  "color": "White",
  "vehicle_description": "Sedan màu trắng, xe gia đình"
}
```

> `VEHICLE`: `VEHICLE_PLATE_NUMBER`, `VEHICLE_TYPE_ID`, `BRAND`, `MODEL`, `COLOR`, `VEHICLE_DESCRIPTION`. `VEHICLE_USER_ID` 

**Validation Rules**
- `vehicle_plate_number` phải là duy nhất trong hệ thống (`UNIQUE` constraint)
- `vehicle_type_id` phải tồn tại trong bảng `VEHICLE_TYPE`

**Success Response (201 Created)**
```json
{
  "success": true,
  "data": {
    "vehicle_id": 1,
    "vehicle_plate_number": "29A-12345",
    "status": "pending_verification"
  }
}
```


**DB Tables:** `VEHICLE`, `VEHICLE_TYPE`, `USERS`

---

## 4.2 Get Vehicle by License Plate

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Endpoint** | `/api/v1/vehicles/{license_plate}` |
| **Authentication** | Bắt buộc |
| **Roles** | `ParkingStaff`, `ParkingUser` |

**Success Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "vehicle_id": 1,
    "vehicle_plate_number": "29A-12345",
    "vehicle_type_id": 1,
    "brand": "Toyota",
    "model": "Vios",
    "color": "White",
    "is_registered": true,
    "monthly_pass": {
      "monthly_pass_id": 1,
      "status": "ACTIVE",
      "end_date": "2024-12-31"
    },
    "last_parking_session": {
      "session_id": "sess_12345",
      "check_in_time": "2024-01-15T08:15:00Z",
      "check_out_time": null
    }
  }
}
```

**DB Tables:** `VEHICLE`, `MONTHLY_PASS`, `PARKING_SESSION`

---

# 5. Parking Session Module

## 5.1 Check-in

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/parking/check-in` |
| **Authentication** | Bắt buộc (API Key cho camera service) |
| **Roles** | `ParkingStaff`, CameraService (Python AI) |

**Request Body**
```json
{
  "license_plate_in": "51H-12345",
  "vehicle_type_id": 1,
  "camera_in": "cam_in_01",
  "gate_in": "gate_in_01",
  "image_url_in": "/uploads/plates/abc.jpg",
  "staff_in_id": "usr_001",
  "slot_id": "slt_089",
  "booking_id": null
}
```

> `PARKING_SESSION`: `LICENSE_PLATE_IN`, `VEHICLE_TYPE_ID`, `CAMERA_IN`, `GATE_IN`, `IMAGE_URL_IN`, `STAFF_IN_ID`, `SLOT_ID`, `BOOKING_ID`

**Validation Rules**

| Field | Rule |
|-------|------|
| `license_plate_in` | Bắt buộc |
| `vehicle_type_id` | Bắt buộc, phải tồn tại trong `VEHICLE_TYPE` |
| `camera_in` | Bắt buộc |
| `gate_in` | Bắt buộc |

**Success Response (201 Created)**
```json
{
  "success": true,
  "data": {
    "session_id": "sess_12345",
    "license_plate_in": "51H-12345",
    "slot_id": "slt_089",
    "slot_name": "C045",
    "floor": 3,
    "zone": "C",
    "check_in_time": "2026-05-17T10:00:00Z",
    "status": "ACTIVE",
    "payment_status": "PENDING"
  }
}
```

**Backend Processing**
1. Xác thực API key
2. Kiểm tra session đang active của biển số
3. Tìm slot khả dụng phù hợp loại xe
4. Tạo bản ghi `PARKING_SESSION` với `STATUS = 'ACTIVE'`
5. Cập nhật `PARKING_SLOT.STATUS = 'OCCUPIED'` và `CURRENT_SESSION_ID`
6. Lưu ảnh chụp
7. Trả về thông tin session

**DB Tables:** `PARKING_SESSION`, `PARKING_SLOT`, `VEHICLE`, `VEHICLE_TYPE`, `BOOKING`

---

## 5.2 Check-out

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/parking/check-out` |
| **Authentication** | Bắt buộc |
| **Roles** | `ParkingStaff`, CameraService (Python AI) |

**Request Body**
```json
{
  "license_plate_out": "51H-12345",
  "camera_out": "cam_out_01",
  "gate_out": "gate_out_01",
  "image_url_out": "/uploads/plates/out_abc.jpg",
  "staff_out_id": "usr_001"
}
```

> `PARKING_SESSION`: `LICENSE_PLATE_OUT`, `CAMERA_OUT`, `GATE_OUT`, `IMAGE_URL_OUT`, `STAFF_OUT_ID`

**Success Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "session_id": "sess_12345",
    "license_plate_in": "51H-12345",
    "check_in_time": "2026-05-17T10:00:00Z",
    "check_out_time": "2026-05-17T12:00:00Z",
    "duration_minutes": 120,
    "status": "COMPLETED",
    "total_fee": 20000,
    "payment_status": "PAID"
  }
}
```

**Session Status Values**

| Status | Ý nghĩa |
|--------|---------|
| `ACTIVE` | Xe đang đỗ |
| `COMPLETED` | Đã check-out |
| `CANCELLED` | Session bị huỷ |
| `LOST_TICKET` | Trường hợp mất vé |

> `PARKING_SESSION.STATUS ENUM('ACTIVE','COMPLETED','CANCELLED','LOST_TICKET')`

**Payment Status Values**

| Status | Ý nghĩa |
|--------|---------|
| `PENDING` | Chờ thanh toán |
| `PAID` | Đã thanh toán |
| `FAILED` | Thanh toán thất bại |

> `PARKING_SESSION.PAYMENT_STATUS ENUM('PENDING','PAID','FAILED')`

---

## 5.3 Get Active Session by License Plate

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Endpoint** | `/api/v1/parking/sessions/active/{license_plate}` |
| **Authentication** | Bắt buộc |

**Success Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "session_id": "sess_12345",
    "license_plate_in": "51H-12345",
    "check_in_time": "2026-05-17T08:15:23Z",
    "duration_minutes": 45,
    "slot_id": "slt_089",
    "slot_name": "C045",
    "floor": 3,
    "current_fee": 7500,
    "status": "ACTIVE",
    "payment_status": "PENDING"
  }
}
```

---

## 5.4 Pre-check-out — Calculate Fee

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Endpoint** | `/api/v1/parking/sessions/{session_id}/calculate-fee` |
| **Authentication** | Bắt buộc |

**Success Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "session_id": "sess_12345",
    "current_fee": 22000,
    "fee_breakdown": {
      "base_price": 15000,
      "hourly_rate": 10000,
      "hours": 2,
      "overnight_fee": 0,
      "total": 22000
    },
    "grace_period_remaining_seconds": 300
  }
}
```

> `base_price`, `hourly_rate`, `overnight_fee` lấy từ `PRICING_POLICY` theo `VEHICLE_TYPE_ID`

**Edge Cases**

| Tình huống | Xử lý |
|-----------|-------|
| Mất vé | 100% max daily rate + handling fee |
| Quá giờ | Thêm phí theo giờ sau giờ đóng cửa (`OVERNIGHT_FEE`) |
| Sai slot | Cảnh báo nhân viên |
| Check-in trùng | Từ chối nếu đã có session `ACTIVE` |

**DB Tables:** `PARKING_SESSION`, `PARKING_SLOT`, `PRICING_POLICY`, `MONTHLY_PASS`

---

# 6. Payment Module

## 6.1 Create Payment Request

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/payments/create` |
| **Authentication** | Bắt buộc |
| **Roles** | `ParkingUser`, `ParkingStaff` |

**Request Body**
```json
{
  "payment_type": "SESSION",
  "session_id": "sess_12345",
  "payment_method": "VNPAY",
  "return_url": "https://parking.com/payment/callback",
  "cancel_url": "https://parking.com/payment/cancel"
}
```

> `payment_type` tương ứng `PAYMENT.PAYMENT_TYPE ENUM('SESSION','MONTHLY_PASS','BOOKING','INCIDENT')`  
> `payment_method` tương ứng `PAYMENT.PAYMENT_METHOD ENUM('CASH','VNPAY','SUBSCRIPTION')`

**Supported Payment Methods**

| Giá trị DB | Mô tả |
|-----------|-------|
| `CASH` | Tiền mặt tại quầy (chỉ nhân viên) |
| `VNPAY` | VNPay QR Code / thẻ ngân hàng |
| `SUBSCRIPTION` | Trừ từ thẻ tháng |

**Success Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "payment_id": "pay_67890",
    "payment_url": "https://payment.vnpay.vn/v2/vpcpay.html?...",
    "qr_code": "data:image/png;base64,...",
    "expires_in_seconds": 900,
    "status": "PENDING"
  }
}
```

---

## 6.2 Payment Webhook (VNPay Callback)

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/payments/webhook/vnpay` |
| **Authentication** | IP Whitelist + Signature Verification |

**Request Body (VNPay)**
```json
{
  "vnp_Amount": "2200000",
  "vnp_BankCode": "NCB",
  "vnp_ResponseCode": "00",
  "vnp_TxnRef": "pay_67890",
  "vnp_SecureHash": "abc123..."
}
```

**Business Logic**
1. Xác minh chữ ký với public key của VNPay
2. Kiểm tra IP trong whitelist
3. Cập nhật `PAYMENT.STATUS = 'SUCCESS'` và `TRANSACTION_ID`
4. Nếu thành công: cập nhật `PARKING_SESSION.PAYMENT_STATUS = 'PAID'`
5. Gửi lệnh mở cổng
6. Gửi thông báo cho người dùng

**Success Response**
```json
{ "RspCode": "00", "RspMessage": "Success" }
```

---

## 6.3 Get Payment Status

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Endpoint** | `/api/v1/payments/{payment_id}/status` |
| **Authentication** | Bắt buộc |

**Success Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "payment_id": "pay_67890",
    "payment_type": "SESSION",
    "session_id": "sess_12345",
    "amount_due": 22000,
    "amount_paid": 22000,
    "change_due": 0,
    "payment_method": "VNPAY",
    "status": "SUCCESS",
    "transaction_id": "txn_VNP123456",
    "payment_time": "2024-01-15T10:28:30Z",
    "receipt_url": "https://api.parking.com/receipts/pay_67890.pdf"
  }
}
```

> `PAYMENT`: `PAYMENT_TYPE`, `AMOUNT_DUE`, `AMOUNT_PAID`, `CHANGE_DUE`, `PAYMENT_METHOD`, `STATUS ENUM('SUCCESS','FAILED')`, `TRANSACTION_ID`, `RECEIPT_URL`

---

## 6.4 Refund Payment

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/payments/{payment_id}/refund` |
| **Roles** | `SystemAdmin`, `ParkingManager` |

**Request Body**
```json
{
  "reason": "Duplicate payment",
  "amount": 22000,
  "staff_notes": "Customer paid twice"
}
```

**Success Response (200 OK)**
```json
{
  "success": true,
  "message": "Refund processed successfully.",
  "data": {
    "refund_payment_id": "pay_67892",
    "amount_refunded": 22000
  }
}
```

---

## 6.5 Cash Payment (Staff)

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/payments/cash` |
| **Roles** | `ParkingStaff` |

**Request Body**
```json
{
  "session_id": "sess_12345",
  "amount_paid": 50000,
  "staff_id": "usr_001"
}
```

> `staff_id` tương ứng `PAYMENT.USER_ID VARCHAR(20)` (FK đến `USERS`)

**Success Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "payment_id": "pay_67891",
    "amount_due": 22000,
    "amount_paid": 50000,
    "change_due": 28000,
    "receipt_url": "https://api.parking.com/receipts/pay_67891.pdf"
  }
}
```

**DB Tables:** `PAYMENT`, `PARKING_SESSION`

---

# 7. Staff Operations Module

## 7.1 Handle Lost Ticket

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/staff/lost-ticket` |
| **Roles** | `ParkingStaff` |

**Request Body**
```json
{
  "license_plate": "29A-123.45",
  "vehicle_type_id": 1,
  "check_in_time_estimated": "2024-01-15T07:30:00Z",
  "lost_reason": "Customer misplaced ticket",
  "staff_id": "usr_001"
}
```

**Business Logic**
1. Tính max daily rate theo loại xe từ `PRICING_POLICY`
2. Cộng thêm handling fee
3. Kiểm tra biển số không có session `ACTIVE`
4. Tạo bản ghi `INCIDENT_LOG` với `ISSUE_TYPE = 'LOST_TICKET'`
5. Tạo session mới với `STATUS = 'LOST_TICKET'`
6. Xử lý thanh toán

**Success Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "incident_log_id": 1,
    "session_id": "sess_lost_001",
    "calculated_fee": 200000,
    "breakdown": {
      "max_daily_rate": 150000,
      "handling_fee": 50000
    },
    "payment_required": true
  }
}
```

**DB Tables:** `INCIDENT_LOG`, `PARKING_SESSION`, `PRICING_POLICY`, `PAYMENT`

---

## 7.2 Handle Plate/Slot Mismatch

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/staff/correct-mismatch` |
| **Roles** | `ParkingStaff` |

**Request Body**
```json
{
  "session_id": "sess_12345",
  "issue_type": "WRONG_SLOT",
  "corrected_license_plate": "29A-123.45",
  "original_license_plate": "29A-123.46",
  "reason": "OCR misread",
  "staff_id": "usr_001"
}
```

> `issue_type` tương ứng `INCIDENT_LOG.ISSUE_TYPE ENUM('LOST_TICKET','WRONG_SLOT','SYSTEM_ERROR','OTHER')`

**Success Response (200 OK)**
```json
{
  "success": true,
  "message": "Mismatch corrected successfully.",
  "data": {
    "incident_log_id": 2,
    "session_id": "sess_12345",
    "status": "RESOLVED"
  }
}
```

---

## 7.3 Manual Gate Control

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/staff/gate-control` |
| **Roles** | `ParkingStaff` |

**Request Body**
```json
{
  "gate_id": "gate_in_01",
  "action": "open",
  "reason": "Emergency override",
  "staff_id": "usr_001"
}
```

**Success Response (200 OK)**
```json
{
  "success": true,
  "message": "Gate opened successfully.",
  "data": {
    "gate_id": "gate_in_01",
    "action": "open",
    "executed_at": "2026-05-17T10:05:00Z"
  }
}
```

---

## 7.4 Staff Real-time Dashboard

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Endpoint** | `/api/v1/staff/dashboard` |
| **Roles** | `ParkingStaff`, `ParkingManager` |

**Success Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "current_occupancy": {
      "total": 500,
      "occupied": 320,
      "available": 180,
      "trend": "increasing"
    },
    "today_stats": {
      "check_ins": 156,
      "check_outs": 98,
      "revenue_vnd": 2150000,
      "lost_tickets": 2,
      "open_incidents": 5
    },
    "active_sessions_count": 320,
    "pending_payments": 12,
    "alerts": [
      {
        "type": "full_floor",
        "floor": 1,
        "message": "Floor 1 at 95% capacity"
      }
    ]
  }
}
```

**DB Tables:** `PARKING_SESSION`, `PARKING_SLOT`, `PAYMENT`, `INCIDENT_LOG`

---

# 8. Admin Dashboard Module

## 8.1 Dashboard Analytics

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Endpoint** | `/api/v1/admin/dashboard/stats` |
| **Roles** | `SystemAdmin`, `ParkingManager` |

**Query Parameters**

| Parameter | Type | Mô tả |
|-----------|------|-------|
| `date_range` | string | `today` / `week` / `month` / `custom` |
| `building_id` | string | Lọc theo toà nhà |
| `start_date` | date | Nếu `date_range = custom` (YYYY-MM-DD) |
| `end_date` | date | Nếu `date_range = custom` (YYYY-MM-DD) |

**Success Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "revenue": {
      "today": 5250000,
      "this_week": 36750000,
      "this_month": 147000000,
      "growth_percent": 12.5
    },
    "occupancy": {
      "peak_occupancy_rate": 87,
      "average_occupancy_rate": 65,
      "peak_hour": "08:00-09:00",
      "lowest_hour": "02:00-03:00"
    },
    "vehicles": {
      "total_check_ins_today": 342,
      "total_check_outs_today": 298,
      "active_monthly_passes": 1250,
      "new_vehicles_this_month": 45
    },
    "slot_efficiency": {
      "most_used_floor": 1,
      "least_used_floor": 7,
      "recommendations": [
        "Convert 20 slots on floor 7 to electric charging"
      ]
    }
  }
}
```

**DB Tables:** `PAYMENT`, `PARKING_SESSION`, `MONTHLY_PASS`, `VEHICLE`, `PARKING_SLOT`

---

## 8.2 Configure Pricing Policy

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/admin/pricing` |
| **Roles** | `ParkingManager` |

**Request Body**
```json
{
  "vehicle_type_id": 1,
  "base_price": 15000,
  "hourly_rate": 10000,
  "overnight_fee": 30000,
  "effective_date": "2024-02-01"
}
```

> `PRICING_POLICY`: `VEHICLE_TYPE_ID`, `BASE_PRICE`, `HOURLY_RATE`, `OVERNIGHT_FEE`, `EFFECTIVE_DATE`

**Success Response (201 Created)**
```json
{
  "success": true,
  "data": {
    "policy_id": 3,
    "vehicle_type_id": 1,
    "base_price": 15000,
    "hourly_rate": 10000,
    "overnight_fee": 30000,
    "effective_date": "2024-02-01"
  }
}
```

**DB Tables:** `PRICING_POLICY`, `VEHICLE_TYPE`

---

# 9. Reports Module

## 9.1 Revenue Report

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Endpoint** | `/api/v1/reports/revenue` |
| **Roles** | `ParkingManager`, `SystemAdmin` |

**Query Parameters**

| Parameter | Type | Required | Mô tả |
|-----------|------|----------|-------|
| `start_date` | date | Yes | YYYY-MM-DD |
| `end_date` | date | Yes | YYYY-MM-DD |
| `group_by` | string | No | `day` / `week` / `month` |
| `vehicle_type_id` | int | No | Lọc theo loại xe |
| `format` | string | No | `json` / `csv` / `pdf` |

**Success Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "report_period": { "from": "2024-01-01", "to": "2024-01-31" },
    "summary": {
      "total_revenue": 147500000,
      "total_transactions": 8230,
      "average_ticket_value": 17922,
      "revenue_by_payment_method": {
        "VNPAY": 98500000,
        "CASH": 42000000,
        "SUBSCRIPTION": 7000000
      },
      "revenue_by_vehicle_type": {
        "1": 98500000,
        "2": 45000000,
        "3": 4000000
      }
    },
    "daily_breakdown": [
      {
        "date": "2024-01-01",
        "revenue": 4750000,
        "transactions": 245
      }
    ],
    "peak_hours_analysis": [
      { "hour": 8, "revenue": 12500000, "transactions": 850 },
      { "hour": 17, "revenue": 15800000, "transactions": 920 }
    ]
  }
}
```


**DB Tables:** `PAYMENT`, `PARKING_SESSION`, `VEHICLE_TYPE`

---

## 9.2 Occupancy Report

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Endpoint** | `/api/v1/reports/occupancy` |
| **Roles** | `ParkingManager`, `SystemAdmin` |

**Success Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "average_occupancy_rate": 68.5,
    "peak_occupancy": {
      "rate": 94,
      "datetime": "2024-01-15T08:45:00Z"
    },
    "occupancy_by_floor": [
      { "floor": 1, "avg_rate": 82, "peak_rate": 98 },
      { "floor": 2, "avg_rate": 75, "peak_rate": 91 }
    ],
    "hourly_pattern": [
      { "hour": 0, "avg_occupancy": 25 },
      { "hour": 8, "avg_occupancy": 85 }
    ]
  }
}
```

**DB Tables:** `PARKING_SESSION`, `PARKING_SLOT`, `FLOOR_ZONE`

---

## 9.3 Exception / Incident Report

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Endpoint** | `/api/v1/reports/exceptions` |
| **Roles** | `ParkingManager`, `SystemAdmin` |

**Success Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "total_exceptions": 342,
    "by_issue_type": {
      "LOST_TICKET": 45,
      "WRONG_SLOT": 123,
      "SYSTEM_ERROR": 65,
      "OTHER": 109
    },
    "by_status": {
      "OPEN": 58,
      "RESOLVED": 284
    },
    "by_staff": [
      {
        "staff_id": "usr_001",
        "staff_name": "Nguyễn Văn A",
        "handled_exceptions": 67,
        "avg_resolution_time_seconds": 45
      }
    ]
  }
}
```


**DB Tables:** `INCIDENT_LOG`, `USERS`

---

## 9.4 Export Report

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Endpoint** | `/api/v1/reports/export/{report_type}` |
| **Authentication** | Bắt buộc |
| **Roles** | `ParkingManager`, `SystemAdmin` |

**Path Parameters:** `report_type` = `revenue` / `occupancy` / `exceptions`

**Query Parameters**

| Parameter | Type | Required | Mô tả |
|-----------|------|----------|-------|
| `format` | string | Yes | `csv` / `pdf` |
| `start_date` | date | Yes | YYYY-MM-DD |
| `end_date` | date | Yes | YYYY-MM-DD |

**Response (File Download)**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="revenue_report_2024_01.pdf"
```

---

# 10. Monthly Pass Module

## 10.1 Create Subscription Plan

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/subscription/plans` |
| **Roles** | `ParkingManager` |

**Request Body**
```json
{
  "plan_id": "plan_monthly_car",
  "vehicle_type_id": 1,
  "duration_days": 30,
  "price": 1500000,
  "grace_period_days": 7
}
```

> `SUBSCRIPTION_PLAN`: `PLAN_ID VARCHAR(50)`, `VEHICLE_TYPE_ID`, `DURATION_DAYS`, `PRICE`, `GRACE_PERIOD_DAYS`

**Success Response (201 Created)**
```json
{
  "success": true,
  "data": {
    "plan_id": "plan_monthly_car",
    "vehicle_type_id": 1,
    "duration_days": 30,
    "price": 1500000,
    "grace_period_days": 7
  }
}
```

**DB Tables:** `SUBSCRIPTION_PLAN`, `VEHICLE_TYPE`

---

## 10.2 Register Monthly Pass

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/subscription/register` |
| **Authentication** | Bắt buộc |
| **Roles** | `ParkingUser` |

**Request Body**
```json
{
  "vehicle_id": 1,
  "plan_id": "plan_monthly_car",
  "start_date": "2024-02-01"
}
```

> `vehicle_id` là `INT` theo `MONTHLY_PASS.VEHICLE_ID`

**Success Response (201 Created)**
```json
{
  "success": true,
  "data": {
    "monthly_pass_id": 1,
    "vehicle_id": 1,
    "plan_id": "plan_monthly_car",
    "start_date": "2024-02-01",
    "end_date": "2024-03-02",
    "status": "ACTIVE",
    "payment_status": "PENDING"
  }
}
```


**DB Tables:** `MONTHLY_PASS`, `SUBSCRIPTION_PLAN`, `VEHICLE`

---

## 10.3 Get Subscription Status

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Endpoint** | `/api/v1/subscription/status/{vehicle_id}` |
| **Authentication** | Bắt buộc |


**Success Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "monthly_pass_id": 1,
    "vehicle_id": 1,
    "vehicle_plate_number": "29A-12345",
    "plan_id": "plan_monthly_car",
    "status": "ACTIVE",
    "start_date": "2024-02-01",
    "end_date": "2024-02-29",
    "payment_status": "PAID",
    "days_remaining": 15,
    "total_entries_this_month": 23
  }
}
```

**DB Tables:** `MONTHLY_PASS`, `VEHICLE`, `SUBSCRIPTION_PLAN`, `PARKING_SESSION`

---

# 11. Booking Module

## 11.1 Create Booking

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/bookings` |
| **Authentication** | Bắt buộc |
| **Roles** | `ParkingUser` |

**Request Body**
```json
{
  "vehicle_id": 1,
  "slot_id": "slt_089",
  "expected_arrival": "2026-05-17T10:00:00Z",
  "notes": "Cần gần thang máy"
}
```

> `BOOKING`: `VEHICLE_ID INT`, `SLOT_ID VARCHAR(20)`, `EXPECTED_ARRIVAL`, `NOTES`. `VEHICLE_USER_ID`.
> `EXPIRED_AT` được server tính tự động.

**Success Response (201 Created)**
```json
{
  "success": true,
  "data": {
    "booking_id": 1,
    "vehicle_user_id": "usr_001",
    "vehicle_id": 1,
    "slot_id": "slt_089",
    "expected_arrival": "2026-05-17T10:00:00Z",
    "expired_at": "2026-05-17T10:15:00Z",
    "booking_time": "2026-05-17T09:30:00Z",
    "status": "PENDING"
  }
}
```

> `status` tương ứng `BOOKING.STATUS ENUM('PENDING','CONFIRMED','CANCELLED','COMPLETED')`

---

## 11.2 Cancel Booking

| Property | Value |
|----------|-------|
| **Method** | `PUT` |
| **Endpoint** | `/api/v1/bookings/{booking_id}/cancel` |
| **Authentication** | Bắt buộc |
| **Roles** | `ParkingUser`, `ParkingStaff` |

**Success Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "booking_id": 1,
    "status": "CANCELLED"
  }
}
```

**DB Tables:** `BOOKING`, `PARKING_SLOT`, `VEHICLE`, `USERS`

---

# Phụ lục

## HTTP Status Codes

| Status | Mô tả | Khi nào dùng |
|--------|-------|-------------|
| 200 | OK | GET / PUT thành công |
| 201 | Created | POST tạo resource mới |
| 204 | No Content | DELETE thành công |
| 400 | Bad Request | Validation thất bại, request không hợp lệ |
| 401 | Unauthorized | JWT thiếu hoặc không hợp lệ |
| 403 | Forbidden | JWT hợp lệ nhưng không đủ quyền |
| 404 | Not Found | Resource không tồn tại |
| 409 | Conflict | Trùng lặp, xung đột trạng thái |
| 422 | Unprocessable Entity | Vi phạm business logic |
| 429 | Too Many Requests | Vượt rate limit |
| 500 | Internal Server Error | Lỗi phía server |
| 503 | Service Unavailable | AI service / DB không khả dụng |

---

## Business Error Codes

| Code | HTTP Status | Mô tả |
|------|-------------|-------|
| `ACTIVE_SESSION_EXISTS` | 409 | Xe đang trong bãi |
| `NO_AVAILABLE_SLOT` | 422 | Bãi đầy cho loại xe này |
| `INVALID_TICKET` | 404 | Vé không tồn tại hoặc đã hết hạn |
| `PAYMENT_FAILED` | 422 | Giao dịch bị từ chối |
| `SUBSCRIPTION_EXPIRED` | 422 | Thẻ tháng đã hết hạn |
| `GATE_OFFLINE` | 503 | Cổng ra không phản hồi |
| `AI_SERVICE_TIMEOUT` | 504 | Nhận diện biển số timeout |
| `INVALID_VEHICLE_TYPE` | 400 | `vehicle_type_id` không tồn tại |
| `BOOKING_EXPIRED` | 422 | Booking đã quá `EXPIRED_AT` |

---

## Rate Limits

| Nhóm Endpoint | Giới hạn | Đơn vị |
|--------------|----------|--------|
| Authentication | 5 requests | /phút |
| Check-in / Check-out | 10 requests | /giây |
| Payment | 3 requests | /giây |
| Reports | 20 requests | /phút |
| AI Recognition | 30 requests | /giây |
| Public endpoints | 60 requests | /phút |

**Rate Limit Response Headers**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642348800
Retry-After: 30
```

---

## Pagination Standard

**Request**
```
GET /api/v1/parking/slots?page=2&page_size=20
```

**Response (trong body)**
```json
{
  "pagination": {
    "page": 2,
    "page_size": 20,
    "total_items": 500,
    "total_pages": 25
  }
}
```

---

