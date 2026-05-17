# Parking Building Management System - API Documentation

---

### Role-Based Access Control (RBAC)

| Role | Permission Level |
|------|-----------------|
| `ParkingManager` | Quản lý bãi xe |
| `ParkingStaff` | Nhân viên giữ xe |
| `ParkingUser/ Driver` | Người dùng gửi xe |
| `SystemAdmin` | Quản trị hệ thống |

---

## API Modules

---

# 🔐 Authentication Module API Documentation

## 1. Authentication Overview

Authentication module dùng để:

* Đăng nhập hệ thống
* Xác thực JWT
* Đăng xuất hệ thống
* Phân quyền theo role

### Supported Roles

| Role             | Description       |
| ---------------- | ----------------- |
| `SystemAdmin`    | Quản trị hệ thống |
| `ParkingManager` | Quản lý bãi xe    |
| `ParkingStaff`   | Nhân viên giữ xe  |
| `ParkingUser`    | Người dùng gửi xe |

---

# Base URL

```http id="zzszkg"
http://localhost:5000
```

---

# 🔑 1.1 User Login

| Property       | Value                |
| -------------- | -------------------- |
| Method         | `POST`               |
| Endpoint       | `/api/v1/auth/login` |
| Authentication | No                   |
| Roles          | All                  |

---

## Request Headers

```json id="p9v3e6"
{
  "Content-Type": "application/json"
}
```

---

## Request Body

```json id="xhjld5"
{
  "email": "staff@parking.com",
  "password": "123456"
}
```

---

## Validation Rules

| Field      | Rule                                 |
| ---------- | ------------------------------------ |
| `email`    | Required, valid email, max 100 chars |
| `password` | Required, min 6 chars, max 255 chars |

---

## Success Response (200 OK)

```json id="qq5jlwm"
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "JWT_ACCESS_TOKEN",
    "expires_in": 3600,
    "token_type": "Bearer",
    "user": {
      "id": 1,
      "full_name": "Nguyen Van A",
      "email": "staff@parking.com",
      "role": "ParkingStaff"
    }
  }
}
```

---

## Error Responses

### Invalid Credentials (401)

```json id="v9a4r2"
{
  "success": false,
  "error_code": "INVALID_CREDENTIALS",
  "message": "Invalid email or password"
}
```

---

### Account Locked (401)

```json id="l1cbyu"
{
  "success": false,
  "error_code": "ACCOUNT_LOCKED",
  "message": "Account has been locked due to multiple failed login attempts"
}
```

---

### Access Denied (403)

```json id="lzkh9m"
{
  "success": false,
  "error_code": "ACCESS_DENIED",
  "message": "Account inactive or not verified"
}
```

---

### Too Many Attempts (429)

```json id="h5o5p2"
{
  "success": false,
  "error_code": "TOO_MANY_ATTEMPTS",
  "message": "Too many login attempts. Please try again later"
}
```

---

---

## JWT Claims

```json id="wqf4lt"
{
  "sub": "1",
  "email": "staff@parking.com",
  "role": "ParkingStaff",
  "session_id": "a8d9f7",
  "exp": 1749999999
}
```

---

## Database Tables
* `USERS`
* `ROLE`

---

# 🚪 1.3 Logout

| Property       | Value                 |
| -------------- | --------------------- |
| Method         | `POST`                |
| Endpoint       | `/api/v1/auth/logout` |
| Authentication | Required              |

---

## Request Headers

```http id="8j2k6u"
Authorization: Bearer JWT_ACCESS_TOKEN
```

---

## Success Response (200 OK)

```json id="wn7kg4"
{
  "success": true,
  "message": "Logged out successfully"
}
```
---

## 👥 2. User Management Module

### 2.1 Get All Users (Admin)

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Endpoint** | `/api/v1/admin/users` |
| **Authentication** | Required |
| **Roles** | SystemAdmin |

**Query Parameters**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | int | No | 1 | Page number |
| `page_size` | int | No | 20 | Items per page (max 100) |
| `role` | string | No | - | Filter by role |
| `status` | string | No | - | active/inactive/locked |
| `search` | string | No | - | Search by name/username |

**Success Response** (200 OK)
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "user_id": "usr_12345",
        "username": "staff_nguyenvanA",
        "full_name": "Nguyễn Văn A",
        "email": "nguyenvana@parking.com",
        "phone": "0901234567",
        "role": "ParkingStaff",
        "status": "active",
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

### 2.2 Create User

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/admin/users` |
| **Roles** | SystemAdmin |

**Request Body**
```json
{
  "username": "staff_tranvanB",
  "password": "TempPass@123",
  "full_name": "Trần Văn B",
  "email": "tranvanb@parking.com",
  "phone": "0901234568",
  "role": "ParkingStaff",
  "force_password_change": true
}
```

**Success Response** (201 Created)
```json
{
  "success": true,
  "data": {
    "user_id": "usr_12346",
    "username": "staff_tranvanB",
    "message": "User created. Temporary password sent."
  }
}
```

### 2.3 Update User

| Property | Value |
|----------|-------|
| **Method** | `PUT` |
| **Endpoint** | `/api/v1/admin/users/{user_id}` |

### 2.4 Delete User (Soft Delete)

| Property | Value |
|----------|-------|
| **Method** | `DELETE` |
| **Endpoint** | `/api/v1/admin/users/{user_id}` |

### 2.5 Change Password

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/auth/change-password` |
| **Authentication** | Required |

**Request Body**
```json
{
  "current_password": "OldPass@123",
  "new_password": "NewPass@456",
  "confirm_password": "NewPass@456"
}
```

**Validation Rules**
- Password must be at least 8 characters
- Must contain uppercase, lowercase, number, special character
- Cannot reuse last 3 passwords

---

## 🅿️ 3. Parking Management Module

### 3.1 Get Building Information

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Endpoint** | `/api/v1/parking/buildings/info` |
| **Authentication** | Optional (public info) |

**Success Response** (200 OK)
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

    "supported_vehicle_types": [
      {
        "type": "car",
        "floors": [1,2,3,4]
      },
      {
        "type": "motorcycle",
        "floors": [5,6,7]
      },
      {
        "type": "electric_car",
        "floors": [8]
      }
    ],

    "current_occupancy": {
      "total_occupied": 320,
      "total_available": 180,
      "occupancy_rate": 64
    }
  }
}
```

### 3.2 Get Parking Slots with Real-time Status

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Endpoint** | `/api/v1/parking/slots` |
| **Authentication** | Required |
| **Roles** | ParkingStaff, ParkingManager, ParkingUser |

**Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `floor` | int | No | Filter by floor number |
| `vehicle_type` | string | No | car / motorcycle / electric |
| `status` | string | No | available/occupied/reserved/maintenance |
| `include_reserved` | bool | No | Include reserved slots (default: false) |
| `page` | int | No | Page number |
| `page_size` | int | No | Items per page |

**Success Response** (200 OK)
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
        "slot_number": "A101",
        "floor": 1,
        "zone": "A",

        "vehicle_type": "car",

        "status": "available",

        "is_handicap": false,
        "is_electric_charging": true,

        "current_session_id": null,

        "last_updated": "2026-05-17T09:00:00Z"
      },

      {
        "slot_id": "slt_002",
        "slot_number": "A102",
        "floor": 1,
        "zone": "A",

        "vehicle_type": "car",

        "status": "occupied",

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

### 3.3 Update Slot Status (Staff/Manager)

| Property | Value |
|----------|-------|
| **Method** | `PUT` |
| **Endpoint** | `/api/v1/parking/slots/{slot_id}/status` |
| **Roles** | ParkingStaff, ParkingManager |

**Request Body**
```json
{
  "status": "maintenance",
  "reason": "Damaged barrier",
  "estimated_duration_minutes": 120
}
```

### 3.4 Configure Floor Zoning by Vehicle Type

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/parking/config/floor-zoning` |
| **Roles** | ParkingManager |

**Request Body**
```json
{
  "zones": [
    {
      "floor": 1,
      "vehicle_type": "car",
      "slot_range_start": "A001",
      "slot_range_end": "A100",
      "total_slots": 100
    },
    {
      "floor": 2,
      "vehicle_type": "electric_car",
      "slot_range_start": "B001",
      "slot_range_end": "B050",
      "total_slots": 50
    }
  ]
}
```

### 3.5 AI-Powered Smart Slot Allocation (Còn đang chỉnh sửa)

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/parking/slot-recommendations` |
| **Authentication** | Required |
| **Roles** | ParkingStaff, ParkingUser |

**Description**: AI algorithm optimizes slot allocation based on:
- Vehicle type and floor compatibility
- Distance to elevator/exit
- Current occupancy rates by zone
- Peak hour balancing
- User preferences (if registered)

**Request Body**
```json
{
  "vehicle_type": "car",
  "license_plate": "29A-123.45",
  "preferences": {
    "prefer_near_elevator": true,
    "avoid_handicap": true,
    "preferred_floors": [1, 2]
  }
}
```

**Success Response** (200 OK)
```json
{
  "success": true,
  "data": {
    "allocated_slot": {
      "slot_id": "slt_089",
      "slot_number": "C045",
      "floor": 3,
      "zone": "C",
      "distance_to_elevator_meters": 12,
      "estimated_walking_time_seconds": 18
    },
    "allocation_score": 94.5,
    "allocation_reason": "Optimal based on vehicle type (car), floor 3 has 40% occupancy, preferred distance to elevator",
    "alternative_slots": [
      { "slot_number": "C046", "floor": 3, "distance": 15 },
      { "slot_number": "D012", "floor": 4, "distance": 25 }
    ]
  }
}
```

**AI Processing Flow for Slot Allocation**
```
1. Request received with vehicle type and preferences
2. Query current slot occupancy from Redis cache
3. Calculate floor load balance:
   - Target: maintain <70% occupancy on each floor during peak
4. Apply weighted scoring algorithm:
   - Vehicle compatibility: 30%
   - Distance to exit/elevator: 25%
   - Floor occupancy rate (inverse): 20%
   - Historical preference: 15%
   - Parking duration estimate: 10%
5. Return top slot recommendation
6. Reserve slot for 5 minutes (timeout if not used)
```

### 3.6 Get Optimal Floor Distribution Report

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Endpoint** | `/api/v1/parking/analytics/floor-efficiency` |
| **Roles** | ParkingManager, SystemAdmin |

**Success Response**
```json
{
  "floor_efficiency": [
    {
      "floor": 1,
      "vehicle_type": "car",
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
```

**Database Tables**
- `PARKING_BUILDING`
- `PARKING_SLOT`
- `FLOOR_ZONE`
- `PARKING_SESSION`

---

## 4. Vehicle Management Module

### 4.1 Register Vehicle (for Monthly/Subscribed Users)

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/vehicles/register` |
| **Authentication** | Required |
| **Roles** | ParkingUser |

**Request Body**
```json
{
  "license_plate": "29A-12345",
  "vehicle_type": "car",
  "brand": "Toyota",
  "model": "Vios",
  "color": "White",
  "owner_name": "Nguyễn Văn A",
  "owner_phone": "0901234567",
  "owner_email": "nguyenvana@gmail.com",
}
```

**Validation Rules**
- License plate must be unique in system
- Format: Vietnamese plate pattern `XXY-12345`

**Success Response** (201 Created)
```json
{
  "success": true,
  "data": {
    "vehicle_id": "veh_78901",
    "license_plate": "29A-12345",
    "qr_code": "https://api.parking.com/qrcode/veh_78901",
    "status": "pending_verification"
  }
}
```

### 4.2 Get Vehicle by License Plate (with cache)

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Endpoint** | `/api/v1/vehicles/{license_plate}` |
| **Authentication** | Required |
| **Roles** | ParkingStaff, ParkingUser |

**Success Response**
```json
{
  "success": true,
  "data": {
    "vehicle_id": "veh_78901",
    "license_plate": "29A-12345",
    "vehicle_type": "car",
    "is_registered": true,
    "subscription_status": "active",
    "subscription_expiry": "2024-12-31",
    "last_parking_session": {
      "session_id": "sess_12345",
      "check_in": "2024-01-15T08:15:00Z",
      "check_out": null
    }
  }
}
```

---

## 5. Parking Session Module (Python)

### 5.1 Check-in API

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/parking/check-in` |
| **Authentication** | Required (API Key for camera service) |
| **Roles** | ParkingStaff, CameraService(Python AI) |

**Request Body**
```json
{
  "license_plate": "51H-12345",
  "vehicle_type": "car",
  "camera_id": "cam_in_01",
  "gate_id": "gate_in_01",
  "confidence_score": 0.96,
  "captured_image_url": "/uploads/plates/abc.jpg",
  "detected_at": "2026-05-17T10:00:00Z"
}
```

**Success Response** (201 Created)
```json
{
  "success": true,
  "data": {
    "session_id": "sess_12345",
    "license_plate": "51H-12345",
    "slot_number": "C045",
    "floor": 3,
    "zone": "C",
    "check_in_time": "2026-05-17T10:00:00Z",
    "status": "ACTIVE"
  }
}
```

**Validation Rules**
| Field | Value |
|----------|-------|
| `license_plate` | Required |
| `vehicle_type` | car / motorcycle / electric_car |
| `confidence_score` | Range 0 → 1 |
| `camera_id` | Required |
| `gate_id` | Required |


**Backend processing**
1. Verify API key
2. Check active session
3. Find available slot
4. Create parking session
5. Update slot occupied
6. Save captured image
7. Return session info

### 5.2 Check-out API

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/parking/check-out` |

**Request Body**
```json
{
  "license_plate": "51H-12345",
  "camera_id": "cam_out_01",
  "gate_id": "gate_out_01",
  "confidence_score": 0.95,
  "detected_at": "2026-05-17T12:00:00Z"
}
```

**Success Response**
```json
{
  "success": true,
  "data": {
    "session_id": "sess_12345",
    "license_plate": "51H-12345",
    "check_in_time": "2026-05-17T10:00:00Z",
    "check_out_time": "2026-05-17T12:00:00Z",
    "duration_minutes": 120,
    "status": "COMPLETED",
    "total_fee": 20000,
    "payment_status": "PAID"
  }
}
```

**Session Status**
| Status | Meaning |
|--------|---------|
| `ACTIVE` | Vehicle currently parked |
| `COMPLETED` | Checked out |
| `CANCELLED` | Session cancelled |
| `LOST_TICKET` | Lost ticket case |


**Payment Status**
| Status | Meaning |
|--------|---------|
| `PENDING` | Waiting payment |
| `PAID` | Payment completed |
| `FAILED` | Payment failed |
| `WAIVED` | Staff waived fee |



### 5.3 Get Active Session by License Plate

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Endpoint** | `/api/v1/parking/sessions/active/{license_plate}` |

**Success Response**
```json
{
  "success": true,
  "data": {
    "session_id": "sess_12345",
    "license_plate": "29A-123.45",
    "check_in_time": "2024-01-15T08:15:23Z",
    "duration_minutes": 45,
    "slot_number": "C045",
    "floor": 3,
    "current_fee": 7500
  }
}
```

### 5.4 Pre-check-out (Calculate Fee Without Exiting)

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Endpoint** | `/api/v1/parking/sessions/{session_id}/calculate-fee` |

**Success Response**
```json
{
  "success": true,
  "data": {
    "current_fee": 22000,
    "fee_breakdown": {
      "base": 15000,
      "per_hour": 10000,
      "hours": 2,
      "total": 22000
    },
    "grace_period_remaining_seconds": 300
  }
}
```

**Edge Cases Handled**
- Lost ticket: 100% of max daily rate + handling fee
- Overstay: Additional fee per hour after closing time
- Wrong slot: Vehicle in wrong zone → alert staff
- Double entry: Prevent check-in if active session exists

**Database Tables**
`PARKING_SESSION`
`PARKING_SLOT`
`VEHICLE`
`PAYMENT`
`BOOKING`
`MONTHLY_PASS`

---

## 💳 6. Payment Module

### 6.1 Create Payment Request

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/payments/create` |
| **Authentication** | Required |
| **Roles** | ParkingUser, ParkingStaff |

**Request Body**
```json
{
  "session_id": "sess_12345",
  "payment_method": "vnpay_qr",
  "return_url": "https://parking.com/payment/callback",
  "cancel_url": "https://parking.com/payment/cancel"
}
```

**Supported Payment Methods**
- `vnpay_qr` - VNPay QR Code
- `momo` - Momo E-wallet
- `zalo_pay` - ZaloPay
- `bank_transfer` - Bank card
- `cash` - Cash at booth (staff only)
- `monthly_subscription` - Deduct from subscription

**Success Response**
```json
{
  "success": true,
  "data": {
    "payment_id": "pay_67890",
    "payment_url": "https://payment.vnpay.vn/v2/vpcpay.html?...",
    "qr_code": "data:image/png;base64,...",
    "expires_in_seconds": 900,
    "status": "pending"
  }
}
```

### 6.2 Payment Webhook (VNPay/Momo/ZaloPay Callback)

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/payments/webhook/{provider}` |
| **Authentication** | IP Whitelist + Signature Verification |

| provider |
|----------|
| `vnpay` |
| `momo` |
| `zalopay` |

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

**Business Logic Flow**
```
1. Verify signature with provider's public key
2. Validate IP is in whitelist
3. Update payment record status
4. If successful: update parking session payment_status = PAID
5. Trigger gate open command
6. Send notification to driver
7. Return acknowledgement to provider
```

**Success Response**
```json
{
  "RspCode": "00",
  "RspMessage": "Success"
}
```

### 6.3 Get Payment Status

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Endpoint** | `/api/v1/payments/{payment_id}/status` |

**Success Response**
```json
{
  "payment_id": "pay_67890",
  "session_id": "sess_12345",
  "amount": 22000,
  "status": "completed",
  "transaction_id": "txn_VNP123456",
  "paid_at": "2024-01-15T10:28:30Z",
  "refundable_until": "2024-01-22T10:28:30Z"
}
```

### 6.4 Refund Payment

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/payments/{payment_id}/refund` |
| **Roles** | SystemAdmin, ParkingManager |

**Request Body**
```json
{
  "reason": "Duplicate payment",
  "amount": 22000,
  "staff_notes": "Customer paid twice"
}
```

### 6.5 Cash Payment (Staff)

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/payments/cash` |
| **Roles** | ParkingStaff |

**Request Body**
```json
{
  "session_id": "sess_12345",
  "amount_received": 50000,
  "register_id": "reg_001"
}
```

**Success Response**
```json
{
  "payment_id": "pay_67891",
  "amount": 22000,
  "change_due": 28000,
  "receipt_url": "https://api.parking.com/receipts/pay_67891.pdf"
}
```

**Security Notes**
- Payment webhooks require signature verification
- Idempotency keys to prevent double charging
- PCI DSS compliance for card payments
- All transactions logged in AuditPayments table

---

## 👔 7. Staff Operations Module

### 7.1 Handle Lost Ticket

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/staff/lost-ticket` |
| **Roles** | ParkingStaff |

**Request Body**
```json
{
  "license_plate": "29A-123.45",
  "vehicle_type": "car",
  "check_in_time_estimated": "2024-01-15T07:30:00Z",
  "lost_reason": "Customer misplaced ticket",
  "staff_id": "usr_12345"
}
```

**Business Logic**
```
1. Calculate max daily rate for vehicle type (150,000 VND)
2. Add handling fee (50,000 VND)
3. Verify license plate doesn't have active session
4. Create lost ticket record
5. Calculate penalty fee
6. Process payment
7. Update vehicle blacklist? (if frequent lost)
```

**Success Response**
```json
{
  "success": true,
  "data": {
    "lost_ticket_id": "lost_001",
    "calculated_fee": 200000,
    "breakdown": {
      "max_daily_rate": 150000,
      "handling_fee": 50000
    },
    "payment_required": true
  }
}
```

### 7.2 Handle Wrong Information (Plate/Slot Mismatch)

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/staff/correct-mismatch` |

**Request Body**
```json
{
  "session_id": "sess_12345",
  "issue_type": "wrong_plate",
  "corrected_license_plate": "29A-123.45",
  "original_license_plate": "29A-123.46",
  "reason": "OCR misread",
  "staff_id": "usr_12345"
}
```

### 7.3 Manual Gate Control

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/staff/gate-control` |
| **Roles** | ParkingStaff |

**Request Body**
```json
{
  "gate_id": "gate_in_01",
  "action": "open",
  "reason": "Emergency override",
  "staff_id": "usr_12345"
}
```

### 7.4 View Real-time Dashboard (Staff View)

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Endpoint** | `/api/v1/staff/dashboard` |

**Success Response**
```json
{
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
    "exceptions": 5
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
```

---

## 📊 8. Admin Dashboard Module

### 8.1 Dashboard Analytics

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Endpoint** | `/api/v1/admin/dashboard/stats` |
| **Roles** | SystemAdmin, ParkingManager |

**Query Parameters**
| Parameter | Type | Description |
|-----------|------|-------------|
| `date_range` | string | today / week / month / custom |
| `building_id` | string | Filter by building |

**Success Response**
```json
{
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
    "monthly_subscribers": 1250,
    "new_registrations_this_month": 45
  },
  "slot_efficiency": {
    "most_used_floor": 1,
    "least_used_floor": 7,
    "recommendations": [
      "Convert 20 slots on floor 7 to electric charging"
    ]
  }
}
```

### 8.2 Configure Pricing Policy

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/admin/pricing` |
| **Roles** | ParkingManager |

**Request Body**
```json
{
  "vehicle_type": "car",
  "base_price": 15000,
  "hourly_rate": 10000,
  "max_daily_fee": 150000
}
```

## 📈 9. Reports Module

### 9.1 Revenue Report

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Endpoint** | `/api/v1/reports/revenue` |
| **Roles** | ParkingManager, SystemAdmin |

**Query Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `start_date` | date | Yes | YYYY-MM-DD |
| `end_date` | date | Yes | YYYY-MM-DD |
| `group_by` | string | No | day / week / month |
| `vehicle_type` | string | No | Filter by type |
| `format` | string | No | json / csv / pdf |

**Success Response**
```json
{
  "report_period": {
    "from": "2024-01-01",
    "to": "2024-01-31"
  },
  "summary": {
    "total_revenue": 147500000,
    "total_transactions": 8230,
    "average_ticket_value": 17922,
    "revenue_by_payment_method": {
      "vnpay_qr": 73500000,
      "cash": 42000000,
      "momo": 25000000,
      "subscription": 7000000
    },
    "revenue_by_vehicle_type": {
      "car": 98500000,
      "motorcycle": 45000000,
      "electric_car": 4000000
    }
  },
  "daily_breakdown": [
    {
      "date": "2024-01-01",
      "revenue": 4750000,
      "transactions": 245,
      "avg_ticket": 19388
    }
  ],
  "peak_hours_analysis": [
    { "hour": 8, "revenue": 12500000, "transactions": 850 },
    { "hour": 17, "revenue": 15800000, "transactions": 920 }
  ]
}
```

### 9.2 Occupancy Report

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Endpoint** | `/api/v1/reports/occupancy` |

**Success Response**
```json
{
  "average_occupancy_rate": 68.5,
  "peak_occupancy": {
    "rate": 94,
    "datetime": "2024-01-15T08:45:00Z"
  },
  "occupancy_by_floor": [
    { "floor": 1, "avg": 82, "peak": 98 },
    { "floor": 2, "avg": 75, "peak": 91 },
    { "floor": 3, "avg": 68, "peak": 84 }
  ],
  "hourly_pattern": [
    { "hour": 0, "avg_occupancy": 25 },
    { "hour": 8, "avg_occupancy": 85 },
    { "hour": 18, "avg_occupancy": 78 }
  ]
}
```

### 9.3 Exception Report

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Endpoint** | `/api/v1/reports/exceptions` |

**Success Response**
```json
{
  "total_exceptions": 342,
  "by_type": {
    "lost_ticket": 45,
    "wrong_plate": 123,
    "overstay": 89,
    "wrong_zone": 65,
    "gate_failure": 20
  },
  "by_staff": [
    {
      "staff_name": "Nguyễn Văn A",
      "handled_exceptions": 67,
      "avg_resolution_time_seconds": 45
    }
  ]
}
```

### 9.4 Export Report (CSV/PDF)

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Endpoint** | `/api/v1/reports/export/{report_type}` |
| **Authentication** | Required |

**Query Parameters**
| Parameter | Value |
|-----------|-------|
| `format` | csv / pdf |
| `start_date` | YYYY-MM-DD |
| `end_date` | YYYY-MM-DD |

**Response** (File download)
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="revenue_report_2024_01.pdf"
```

---

## 💳 13. Monthly Pass Module

### 13.1 Create Subscription Plan

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/subscription/plans` |
| **Roles** | ParkingManager |

**Request Body**
```json
{
  "vehicle_type": "car",
  "duration_days": 30,
  "price": 1500000,
  "grace_period_days": 7
}
```

### 13.2 Register Subscription

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/subscription/register` |
| **Authentication** | Required |
| **Roles** | Driver |

**Request Body**
```json
{
  "vehicle_id": "veh_78901",
  "plan_id": "plan_monthly_car",
  "start_date": "2024-02-01",
  "payment_method": "vnpay_qr"
}
```

### 13.3 Get Subscription Status

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Endpoint** | `/api/v1/subscription/status/{vehicle_id}` |

**Success Response**
```json
{
  "monthly_pass_id": "mp_001",
  "vehicle_id": "veh_78901",
  "license_plate": "29A-123.45",
  "status": "active",
  "start_date": "2024-02-01",
  "end_date": "2024-02-29",
  "days_remaining": 15,
  "total_entries_this_month": 23,
  "savings_compared_to_daily": 345000
}
```

---

### HTTP Status Codes

| Status | Description | When to use |
|--------|-------------|-------------|
| 200 | OK | Successful GET/PUT requests |
| 201 | Created | Successful POST (new resource) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation failed, malformed request |
| 401 | Unauthorized | Missing/invalid JWT token |
| 403 | Forbidden | Valid token but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate entry, state conflict |
| 422 | Unprocessable Entity | Business logic violation |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side exception |
| 503 | Service Unavailable | AI service/DB down |

### Business Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `ACTIVE_SESSION_EXISTS` | 409 | Vehicle already in parking |
| `NO_AVAILABLE_SLOT` | 422 | Parking full for vehicle type |
| `BLACKLISTED_VEHICLE` | 403 | Vehicle not allowed to enter |
| `INVALID_TICKET` | 404 | Ticket not found or expired |
| `PAYMENT_FAILED` | 422 | Transaction declined |
| `SUBSCRIPTION_EXPIRED` | 422 | Monthly pass expired |
| `GATE_OFFLINE` | 503 | Exit gate not responding |
| `AI_SERVICE_TIMEOUT` | 504 | Plate recognition timeout |

---

## Rate Limiting & Pagination

### Rate Limits

| Endpoint Category | Rate Limit | Per |
|------------------|------------|-----|
| Authentication | 5 requests | minute |
| Check-in/out | 10 requests | second |
| Payment | 3 requests | second |
| Reports | 20 requests | minute |
| AI Recognition | 30 requests | second |
| Public endpoints | 60 requests | minute |

**Rate Limit Headers**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642348800
Retry-After: 30
```

### Pagination Standard

**Request**
```
GET /api/v1/users?page=2&page_size=20&sort_by=created_at&sort_order=desc
```

**Response Headers**
```
X-Total-Count: 145
X-Page-Count: 8
Link: <https://api.parking.com/users?page=1>; rel="first", 
      <https://api.parking.com/users?page=3>; rel="next"
```

---

## Example End-to-End Flow

