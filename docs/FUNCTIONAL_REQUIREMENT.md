# Functional Requirements – Parking Building Management System (PBMS)

## Module AUTH – Xác thực

| Mã | Tên chức năng | Mô tả | Vai trò | Ưu tiên |
|---|---|---|---|---|
| FR-AUTH-01 | Đăng ký tài khoản | Người dùng tạo tài khoản bằng số điện thoại + email + mật khẩu. Sau khi tạo xong, hệ thống yêu cầu nhập username. | User | Cao |
| FR-AUTH-02 | Đăng nhập | Đăng nhập bằng email/số điện thoại và mật khẩu. | Tất cả | Cao |
| FR-AUTH-03 | Đăng xuất | Hủy phiên đăng nhập hiện tại. | Tất cả | Cao |
| FR-AUTH-04 | Quên mật khẩu | Khôi phục mật khẩu qua email hoặc OTP số điện thoại. | Tất cả | Cao |
| FR-AUTH-05 | Quản lý thông tin cá nhân | Xem và chỉnh sửa ảnh đại diện, username, số điện thoại, email. | User | Trung bình |

## Module INFO – Thông tin bãi xe

| Mã | Tên chức năng | Mô tả | Vai trò | Ưu tiên |
|---|---|---|---|---|
| FR-INFO-01 | Xem thông tin bãi xe | Hiển thị ảnh nhà xe, tên, địa chỉ, thời gian hoạt động, loại xe phục vụ, bảng giá, quy định, số slot trống theo loại xe. Nếu hết slot hiển thị chữ "FULL" màu đỏ đậm. | User (public) | Cao |
| FR-INFO-02 | Nút đặt chỗ nhanh | Nếu còn slot trống, cuối bảng thông tin hiển thị nút "Đặt chỗ" dẫn đến chức năng đặt chỗ. | User | Cao |

## Module BOOKING – Đặt chỗ

| Mã | Tên chức năng | Mô tả | Vai trò | Ưu tiên |
|---|---|---|---|---|
| FR-BK-01 | Chọn loại xe | Giao diện chia đôi: bên trái là ảnh xe máy, bên phải là ảnh ô tô; hiển thị số slot trống của từng loại. | User | Cao |
| FR-BK-02 | Xem sơ đồ slot | Hiển thị sơ đồ tầng với các slot sắp xếp theo vị trí thực. Mỗi slot thể hiện trạng thái bằng màu sắc: Trống (xanh), Đang dùng (đỏ), Đã đặt (vàng), Bảo trì (xám), Slot nhân viên (tím). | User | Cao |
| FR-BK-03 | Đặt slot | Nhấp vào slot trống, nhập thời gian đặt (ngày/giờ bắt đầu – kết thúc). Giá tiền cập nhật động theo lựa chọn. | User | Cao |
| FR-BK-04 | Thanh toán giữ chỗ | Hiển thị QR chuyển khoản phí giữ chỗ. Hệ thống xác nhận thanh toán tự động. | User | Cao |
| FR-BK-05 | Nhận mã QR | Sau khi thanh toán thành công, hệ thống sinh mã QR duy nhất kèm hướng dẫn đưa mã cho nhân viên khi vào/ra. Nút "OK" đưa người dùng về trang chủ. | User | Cao |
| FR-BK-06 | Xem danh sách booking | Hiển thị các slot đã đặt: mã slot, tầng, loại xe, thời gian đặt, trạng thái. | User | Cao |
| FR-BK-07 | Hiển thị lại QR | Bên cạnh mỗi booking có nút hiển thị QR. Nút "OK" để đóng. | User | Cao |
| FR-BK-08 | Điều chỉnh thời gian đặt | Cho phép thay đổi thời gian đặt; giá tiền tính lại tự động. Không thể điều chỉnh sau khi đã thanh toán đầy đủ. | User | Cao |
| FR-BK-09 | Hủy booking | Hủy slot đã đặt. Phí giữ chỗ không hoàn. Hiển thị bảng xác nhận; nút xác nhận chỉ kích hoạt sau 5 giây. Không thể hủy sau khi đã thanh toán. | User | Cao |
| FR-BK-10 | Thanh toán phí còn lại | Thanh toán online khoản phí còn lại (ngoài phí giữ chỗ đã trả). | User | Cao |

## Module PAYMENT – Thanh toán

| Mã | Tên chức năng | Mô tả | Vai trò | Ưu tiên |
|---|---|---|---|---|
| FR-PAY-01 | Xem danh sách khoản cần thanh toán | Hiển thị các khoản: phí gửi xe theo slot, thẻ tháng, tiền phạt vi phạm. Mỗi khoản có nội dung, số tiền và nút thanh toán riêng. | User | Cao |
| FR-PAY-02 | Thanh toán QR | Hiển thị mã QR tương ứng khoản cần thanh toán theo chuẩn VietQR. | User | Cao |
| FR-PAY-03 | Thanh toán tiền mặt | Nhân viên xác nhận thu tiền mặt và cập nhật trạng thái thanh toán. | Staff | Cao |
| FR-PAY-04 | Lịch sử giao dịch | Xem toàn bộ lịch sử các giao dịch đã thực hiện. | User | Cao |

## Module GATE – Vận hành cổng

| Mã | Tên chức năng | Mô tả | Vai trò | Ưu tiên |
|---|---|---|---|---|
| FR-GATE-01 | Xử lý xe vào – xe đặt trước | Quét mã QR của khách, xác thực booking, hướng dẫn xe vào đúng slot/tầng. | Staff | Cao |
| FR-GATE-02 | Xử lý xe vào – xe vãng lai | Nhập/quét biển số xe, kiểm tra loại xe và slot còn trống, tạo parking session (ghi nhận thời gian vào, loại xe, cổng vào), in vé xe, hướng dẫn khách đến slot. | Staff | Cao |
| FR-GATE-03 | Xử lý xe ra | Quét biển số xe, xác định phiên gửi xe, tính tổng phí, thu tiền mặt hoặc hiển thị QR chuyển khoản, xác nhận thanh toán, mở barrier. | Staff | Cao |
| FR-GATE-04 | Xử lý ngoại lệ | Xử lý các tình huống: mất thẻ/QR, sai thông tin xe, quá giờ, gửi sai khu vực. Ghi nhận vi phạm và phí phạt tương ứng. | Staff | Cao |
| FR-GATE-05 | Cập nhật trạng thái slot | Thay đổi trạng thái slot: Trống / Đang dùng / Bảo trì / Tạm khóa. | Staff | Cao |

## Module FEEDBACK – Phản hồi

| Mã | Tên chức năng | Mô tả | Vai trò | Ưu tiên |
|---|---|---|---|---|
| FR-FB-01 | Gửi phản hồi | Người dùng điền form: họ tên, CCCD, tiêu đề, nội dung vấn đề (mất thẻ, sai phí, slot bị chiếm, khó tìm xe…). | User | Trung bình |
| FR-FB-02 | Xem và xử lý phản hồi | Manager xem danh sách phản hồi, cập nhật trạng thái xử lý. | Manager | Trung bình |

## Module MANAGEMENT – Quản lý

| Mã | Tên chức năng | Mô tả | Vai trò | Ưu tiên |
|---|---|---|---|---|
| FR-MGT-01 | Quản lý thông tin tòa nhà | Xem và chỉnh sửa: tên, địa chỉ, ảnh, giờ hoạt động, mô tả. | Manager | Cao |
| FR-MGT-02 | Quản lý loại phương tiện | Thêm/sửa/xóa các loại phương tiện bãi xe tiếp nhận (xe máy, ô tô, xe tải nhỏ…). | Manager | Cao |
| FR-MGT-03 | Quản lý phân tầng | Cấu hình tầng nào dành cho loại xe nào. | Manager | Cao |
| FR-MGT-04 | Quản lý slot | Xem trạng thái toàn bộ slot theo tầng; thêm/sửa/xóa slot; cập nhật trạng thái. | Manager | Cao |
| FR-MGT-05 | Quản lý bảng giá | Thiết lập và cập nhật đơn giá gửi xe theo loại xe, khung giờ, thời gian. | Manager | Cao |
| FR-MGT-06 | Xem báo cáo | Dashboard báo cáo: lượt xe vào/ra, doanh thu, tỷ lệ lấp đầy, khung giờ cao điểm theo loại phương tiện. Lọc theo ngày/tuần/tháng. | Manager | Cao |
| FR-MGT-07 | Quản lý vi phạm *(optional)* | Theo dõi các trường hợp: mất vé, sai biển số, quá giờ, sai khu vực, xe chưa thanh toán. | Manager | Thấp |

## Module ADMIN – Quản trị hệ thống

| Mã | Tên chức năng | Mô tả | Vai trò | Ưu tiên |
|---|---|---|---|---|
| FR-ADM-01 | Quản lý tài khoản | Tạo, xem, sửa, xóa, khóa/mở khóa tài khoản người dùng. | Admin | Cao |
| FR-ADM-02 | Phân quyền | Gán và thu hồi vai trò (User, Staff, Manager, Admin) cho tài khoản. | Admin | Cao |
| FR-ADM-03 | Quản lý cấu hình hệ thống | Cấu hình thông số kỹ thuật, tích hợp API bên thứ ba, xem log hệ thống. | Admin | Cao |

## Module AI – Tối ưu phân bổ slot *(Nâng cao / Optional)*

| Mã | Tên chức năng | Mô tả | Vai trò | Ưu tiên |
|---|---|---|---|---|
| FR-AI-01 | Gợi ý slot tối ưu | Khi người dùng chọn loại xe và thời gian, AI gợi ý slot phù hợp nhất dựa trên: khoảng cách đến lối ra/vào, tỷ lệ lấp đầy tầng, loại xe, thời gian gửi. | User | Thấp |
| FR-AI-02 | Phân bổ slot tự động cho walk-in | Nhân viên tạo session walk-in, AI tự động phân bổ slot thay vì chọn tự do, giảm thời gian hướng dẫn. | Staff | Thấp |
| FR-AI-03 | Tối ưu tỷ lệ lấp đầy giờ cao điểm | Hệ thống phân tích lịch sử và dự báo nhu cầu, đề xuất chính sách đặt chỗ/giá linh động trong giờ cao điểm. | Manager | Thấp |
| FR-AI-04 | Báo cáo hiệu quả phân bổ | So sánh chỉ số thời gian tìm chỗ và tỷ lệ sử dụng trước/sau khi áp dụng AI. | Manager | Thấp |
