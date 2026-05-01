# Đặc tả: Registration Slot Claiming

## Mô tả
Xử lý đăng ký workshop (cả miễn phí và có phí). Chịu trách nhiệm giữ chỗ (Slot Claiming) an toàn tuyệt đối bằng lệnh atomic trên Redis, đồng thời sinh mã QR check-in khi đăng ký thành công.

## Luồng chính
1. Sinh viên bấm Đăng ký tại trang chi tiết Workshop.
2. Frontend gửi `POST /registrations` kèm theo một UUID sinh ngẫu nhiên làm `Idempotency-Key` trên Header.
3. Backend gọi lệnh `DECR` vào Redis counter của workshop đó để giành lấy 1 chỗ.
4. Nếu dư chỗ (`DECR` >= 0): Insert bản ghi `Registration` xuống PostgreSQL, sinh QR Code và trả về trạng thái `CONFIRMED`.
5. Nếu hết chỗ (`DECR` < 0): Gọi ngay `INCR` hoàn trả lại slot vào Redis, trả về HTTP 409 (Workshop is full).

## Kịch bản lỗi
- **Hết chỗ (Race Condition)**: Nhiều người tranh 1 vé cuối cùng. Lệnh `DECR` thực thi tuần tự trên RAM Redis nên chỉ duy nhất 1 người nhận kết quả 0, những người còn lại nhận số âm và bị từ chối công bằng.
- **Spam request cùng mã**: Sinh viên bấm nút nhiều lần sinh ra các request có cùng `Idempotency-Key` -> Backend túm được ở Redis, trả về kết quả cũ, không đụng đến DB.
- **Đăng ký nhiều lần (khác mã)**: Một sinh viên cố tình đăng ký 2 vé cho 1 sự kiện -> Database bật lại nhờ ràng buộc Unique Constraint `@@unique([userId, workshopId])`.

## Ràng buộc
- Slot Claiming tuyệt đối phải dùng Redis Atomic DECR, KHÔNG dùng Row Locking của DB (`SELECT FOR UPDATE`) để tránh thắt cổ chai.
- Idempotency-Key lưu tại Redis với thời hạn TTL là 24 giờ.
- Một sinh viên chỉ đăng ký 1 vé duy nhất cho mỗi workshop.

## Tiêu chí chấp nhận
- Chịu được các đợt bùng nổ truy cập không làm nghẽn DB và 100% không bị oversell vé.
- Nỗ lực retry request cũ không bao giờ sinh ra 2 bản ghi khác nhau.
- QR code hợp lệ được đính kèm ở response khi đăng ký hoàn tất.
