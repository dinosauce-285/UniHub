# Đặc tả: Bắn thông báo (Notification)

## Mô tả
Chịu trách nhiệm gửi email xác nhận và thông báo In-app cho sinh viên. Sử dụng Bull Queue để chạy ngầm không đồng bộ nhằm giảm độ trễ của API chính, thiết kế theo Strategy Pattern để dễ dàng gắn thêm kênh chat mới sau này.

## Luồng chính
1. Sinh viên đăng ký workshop thành công.
2. Backend API vứt một Notification Job vào hàng đợi `notification.queue` của Bull và LẬP TỨC trả kết quả HTTP 201 cho sinh viên.
3. Background Worker âm thầm móc Job ra xử lý, kích hoạt chiến lược `NotificationStrategy`.
4. Gọi qua Nodemailer bắn email tới MailHog (dùng SMTP ở port 1025 trên môi trường dev).

## Kịch bản lỗi
- **Mail server bị lỗi hoặc sập**: Job bị báo lỗi nội bộ, Bull tự động retry lại sau. Tiến trình đăng ký sự kiện của sinh viên KHÔNG HỀ bị dội lỗi (Non-blocking).
- **Thêm kênh thông báo mới**: Thiết kế Pattern cho phép lập trình viên tạo Class mới mà không cần đụng vô logic của core module Registration.

## Ràng buộc
- Luồng gửi thư bắt buộc phải chạy bất đồng bộ qua Bull Queue. Tuyệt đối không được gửi email chặn đồng bộ (blocking API response) trong luồng đăng ký.
- Mọi email gửi ở môi trường hiện tại đều được nắn dòng chảy về MailHog để kiểm thử, không xả ra internet thật.
- Các lỗi gửi thư chỉ được ghi Log, không rollback (hủy) giao dịch đăng ký thành công của người dùng.

## Tiêu chí chấp nhận
- Xác nhận đăng ký trả về ngay lập tức, ngay sau đó thư xác nhận nổi lên trong hộp thư MailHog.
- Response time (độ trễ) của API đăng ký không bị dao động theo thời gian xử lý gửi thư.
- Đảm bảo mở rộng dễ dàng (khi muốn gắn bot Telegram, Zalo v.v).
