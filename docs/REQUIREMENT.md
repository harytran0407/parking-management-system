# Hệ thống quản lý tòa nhà gửi xe (Parking Building Management System)

## Bối cảnh (Context)

Tại các đô thị lớn, nhu cầu gửi xe tăng cao trong khi diện tích đỗ xe bị giới hạn. Tòa nhà gửi xe nhiều tầng là công trình chuyên dùng để tiếp nhận, lưu giữ và tổ chức xe ra/vào theo nhiều tầng hoặc khu vực đỗ khác nhau. Vì lưu lượng xe ra vào liên tục, cần có hệ thống phần mềm hỗ trợ quản lý vận hành bãi xe chính xác và hiệu quả.

## Vấn đề (Problems)

Nghiệp vụ tòa nhà gửi xe cần quản lý tốt các vấn đề như xe vào/ra, chỗ đỗ còn trống, vé gửi xe, phí gửi xe và các tình huống phát sinh như mất vé, quá hạn hoặc sai thông tin xe. Nếu quản lý thủ công, bãi xe dễ bị ùn ú tại cổng, sai lệch dữ liệu, khó kiểm soát sức chứa và khó đối soát doanh thu.

## Tác nhân chính (Primary Actors)

- **Parking Facility Manager** (Quản lý bãi xe)
- **Parking Staff** (Nhân viên bãi xe)
- **Parking User / Driver** (Người dùng / tài xế)
- **System Administrator** (Quản trị hệ thống)

## Chức năng theo từng tác nhân (Functional Requirements)

### Parking Manager (Quản lý bãi xe)

- Quản lý thông tin tòa nhà gửi xe
- Quản lý loại phương tiện
- Quản lý phân tầng theo loại xe
- Quản lý slot đỗ xe và trạng thái slot: theo dõi slot còn trống, đang sử dụng, đã đặt trước, bảo trì hoặc tạm khóa
- Quản lý bảng giá, quy định chính sách tính phí gửi xe
- Xem báo cáo lượt xe vào/ra, doanh thu, tỷ lệ lấp đầy, khung giờ cao điểm theo từng loại phương tiện
- Các quản lý nâng cao khác (tùy chọn): theo dõi các trường hợp mất vé, sai biển số, quá giờ, gửi sai khu vực, xe chưa thanh toán

### Parking Staff (Nhân viên bãi xe)

- Hỗ trợ xử lý xe vào bãi: kiểm tra điều kiện xe vào bãi, nhập/quét biển số xe, hướng dẫn xe vào đúng tầng/khu vực theo loại phương tiện
- Tạo lượt gửi xe: tạo parking session cho xe gửi theo lượt, ghi nhận thời gian vào, loại xe, cổng vào
- Hỗ trợ xử lý xe ra bãi: tìm lượt gửi xe, xác nhận thời gian ra, kiểm tra phí cần thanh toán, thu phí gửi xe
- Hỗ trợ xử lý các trường hợp ngoại lệ: mất thẻ xe, sai thông tin xe, xe quá hạn gửi, xe gửi sai khu vực, cập nhật trạng thái slot

### Parking User / Driver (Người dùng / tài xế)

1. Xem thông tin bãi xe: thời gian hoạt động, loại xe được phục vụ, bảng giá và quy định gửi xe, số slot trống
2. Gửi xe theo lượt: nhận thẻ xe/mã gửi xe khi vào bãi và thanh toán phí khi ra
3. Đặt chỗ trước: đặt chỗ theo loại phương tiện, thời gian gửi và khu vực còn trống nếu hệ thống hỗ trợ
4. Theo dõi lượt gửi xe: xem thông tin lượt gửi xe hiện tại: giờ vào, loại xe, khu vực gửi, phí tạm tính
5. Thanh toán phí gửi xe và dịch vụ bổ sung nếu có
6. Gửi phản hồi về mất thẻ xe, sai phí, khó tìm xe, slot bị chiếm hoặc vấn đề trong bãi xe (tùy chọn)

### System Administrator (Quản trị hệ thống)

- Quản lý tài khoản người dùng
- Phân quyền
- Quản lý cấu hình hệ thống

> **Khuyến khích**: Có thêm các chức năng AI hỗ trợ như tối ưu phân bổ chỗ đỗ xe theo loại phương tiện trong tòa nhà gửi xe sao cho giảm thời gian tìm chỗ, tăng tỷ lệ sử dụng bãi xe.

## Câu hỏi nghiên cứu (Research Questions)

- **RQ1:** Việc phân tầng, khu vực theo loại phương tiện ảnh hưởng thế nào đến hiệu quả sử dụng chỗ đỗ?
- **RQ2:** Phân bổ slot tự động có giúp giảm thời gian tìm chỗ so với cách chọn chỗ tự do không?
- **RQ3:** Nên ưu tiên tiêu chí nào khi phân bổ slot: khoảng cách, tầng, loại xe, thời gian gửi hay tỷ lệ lấp đầy slot đỗ các tầng, các khu vực?
- **RQ4:** Thuật toán phân bổ slot có thể cải thiện tỷ lệ sử dụng bãi xe trong giờ cao điểm?