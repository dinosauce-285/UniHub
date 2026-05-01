# Đặc tả: Payment Circuit Breaker

## Mô tả
Luồng thanh toán dành cho các workshop có tính phí. Tích hợp Mẫu thiết kế Circuit Breaker (ngắt mạch) để đối phó với cổng thanh toán ngoài không ổn định, kết hợp Idempotency Key để ngăn trừ tiền 2 lần.

## Luồng chính
1. Frontend yêu cầu thanh toán cho một workshop.
2. Backend gửi UUID (Idempotency Key) qua Mock Payment Gateway (được bọc trong `opossum` Circuit Breaker).
3. **Thành công**: Cập nhật `Registration.paymentStatus = PAID`, trả về hóa đơn cho sinh viên.
4. **Mạch bị ngắt (OPEN)**: Cổng thanh toán sập -> Backend lập tức trả về `{ canPay: false }`. Frontend ẩn nút thanh toán thay vì quay đều (Graceful Degradation).

## Kịch bản lỗi
- **Cổng thanh toán chập chờn**: Fail dưới ngưỡng ngắt mạch -> báo lỗi HTTP 502, sinh viên thử lại.
- **Quá tải cổng thanh toán**: Lỗi vượt ngưỡng 50% -> Circuit Breaker chuyển sang trạng thái OPEN, từ chối gửi request trong 30 giây để bảo vệ mạng.
- **Ấn thanh toán nhiều lần**: Idempotency Key khóa các request trùng lặp, trả về kết quả cũ đã lưu tại Redis, không gọi cổng thanh toán lần 2.

## Ràng buộc
- Circuit Breaker sử dụng thư viện `opossum` với ngưỡng: 50% lỗi thì ngắt mạch, 30 giây sau thử lại (Half-Open).
- Tính năng miễn phí (duyệt workshop, đăng ký free) tuyệt đối KHÔNG bị ảnh hưởng dù mạch thanh toán bị ngắt.
- Mock gateway được cấu hình tự động văng lỗi ngẫu nhiên 30% để mô phỏng sự cố thực.

## Tiêu chí chấp nhận
- Cổng thanh toán sập liên tục sẽ kích hoạt mạch OPEN.
- Mạch OPEN trả về payload fallback lịch sự mà không cần ráng gọi gateway (fast-fail).
- Thử lại cùng một Idempotency Key sẽ chặn trừ tiền lần hai.
