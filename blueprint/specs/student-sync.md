# Đặc tả: Đồng bộ sinh viên đêm (Student Sync)

## Mô tả
Chức năng tự động nhập dữ liệu sinh viên từ file CSV của hệ thống Quản lý sinh viên cũ (Legacy System) chạy vào lúc nửa đêm, tích hợp cơ chế ghi nhận lỗi Dead Letter Queue.

## Luồng chính
1. Cronjob của Bull Queue kích hoạt vào lúc 02:00 sáng.
2. Async Worker tải file CSV mới nhất, duyệt qua từng dòng.
3. Mỗi dòng hợp lệ được thêm vào PostgreSQL thông qua câu lệnh UPSERT (`INSERT ... ON CONFLICT (student_id) DO UPDATE`).
4. Dòng dữ liệu bị hỏng định dạng được ghi chép vào mảng lỗi `errorDetails` thay vì ném ra Exception làm gián đoạn.
5. Tổng hợp báo cáo vào `StudentSyncLog` với thông tin tổng số dòng, số dòng nhập thành công và chi tiết lỗi.

## Kịch bản lỗi
- **Thiếu file CSV hoặc không đọc được**: Job thất bại gracefully, sinh ra log `StudentSyncLog` với tổng số lỗi bằng tổng dòng.
- **Lỗi ở một dòng cụ thể**: Dòng đó bị bỏ qua, lỗi được ghi chú lại, tiến trình vẫn tiếp tục cho các dòng kế tiếp (Dead Letter Queue pattern).
- **Trùng lặp sinh viên (student_id)**: Câu lệnh UPSERT tự động cập nhật thông tin mới nhất mà không gây xung đột (No Error).

## Ràng buộc
- Quá trình nhập liệu bắt buộc phải an toàn để có thể chạy lại file cũ nhiều lần (Idempotent upsert).
- Một lỗi cục bộ tại một dòng CSV KHÔNG ĐƯỢC PHÉP làm chết toàn bộ mẻ đồng bộ (Batch batch).
- Giờ hẹn cronjob tránh khung giờ cao điểm đăng ký (chỉ định sẵn là 02:00 sáng).

## Tiêu chí chấp nhận
- Dữ liệu CSV được nhập tự động và không bị nhân bản bản ghi kể cả khi cronjob chạy lặp lại cùng một file.
- `StudentSyncLog` báo cáo đầy đủ, chính xác, giúp Admin kiểm soát được dữ liệu bẩn.
- Có tính năng cho Admin chủ động kích hoạt chạy lệnh đồng bộ này ngay trên giao diện nội bộ.
