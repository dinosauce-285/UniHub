# UniHub Workshop — Project Proposal

## Vấn đề
Hiện tại, Trường Đại học tổ chức "Tuần lễ kỹ năng và nghề nghiệp" quy mô lớn (kéo dài 5 ngày, mỗi ngày 8-12 workshop song song) bằng cách sử dụng Google Form và gửi thông báo qua email thủ công. Quy trình này gặp nhiều hạn chế:
- **Quá tải & Cạnh tranh không công bằng**: Hàng ngàn sinh viên truy cập cùng lúc dẫn đến hệ thống bị sập cục bộ hoặc đăng ký vượt số lượng vé thực tế (oversell).
- **Thiếu tự động hóa**: Ban tổ chức tốn rất nhiều thời gian tổng hợp danh sách, duyệt thanh toán và gửi email.
- **Quy trình điểm danh thủ công**: Không có công cụ check-in tại sự kiện chuyên nghiệp, việc dò tên mất thời gian.
Hậu quả là trải nghiệm của sinh viên bị ảnh hưởng nghiêm trọng, rủi ro quản lý tăng cao và gây áp lực lớn lên đội ngũ vận hành.

## Mục tiêu
Số hóa toàn bộ quy trình sự kiện từ khâu đăng ký đến điểm danh tại cửa, cụ thể:
- **Đảm bảo khả năng chịu tải**: Hỗ trợ an toàn 12.000 sinh viên truy cập trong 10 phút đầu (với 60% dồn vào 3 phút đầu).
- **Tính chính xác 100%**: Cam kết không xảy ra tình trạng "oversell" chỗ ngồi dù có hàng trăm lượt đăng ký đồng thời trong 1 giây.
- **Tiện lợi tại sự kiện**: Cung cấp ứng dụng PWA điểm danh qua QR code nhanh chóng, hỗ trợ hoạt động mượt mà kể cả khi rớt mạng (Offline Check-in).

## Người dùng và nhu cầu
1. **Sinh viên**: Cần xem lịch sự kiện, đăng ký nhanh, thanh toán an toàn, nhận vé QR và vào cửa dễ dàng. *Điều quan trọng nhất*: Hệ thống không bị treo lúc đăng ký các workshop "hot".
2. **Ban tổ chức (Organizer)**: Cần tạo/sửa/hủy workshop, theo dõi dashboard số lượng đăng ký theo thời gian thực và quản lý thông tin. *Điều quan trọng nhất*: Số liệu cập nhật chính xác và tiết kiệm công sức.
3. **Nhân sự check-in (Staff)**: Cần một ứng dụng di động gọn nhẹ để quét mã QR tại cửa phòng. *Điều quan trọng nhất*: Quét mã cực nhanh và vẫn điểm danh được khi khu vực đó mất sóng 4G/Wifi.

## Phạm vi
**Trong phạm vi dự án**:
- Web App (React + Vite) cho Sinh viên và Admin.
- Ứng dụng PWA (Progressive Web App) dành cho Staff điểm danh.
- Backend API (NestJS) với CSDL PostgreSQL.
- Tích hợp Redis để xử lý tải cao, slot counting và rate limiting.
- Tích hợp Message Queue (Bull) xử lý các tác vụ ngầm: Gửi email xác nhận, AI Summary, đồng bộ CSV sinh viên đêm.

**Không thuộc phạm vi**:
- Tích hợp cổng thanh toán (Payment Gateway) của đối tác thật (sẽ sử dụng Mock Gateway để mô phỏng tính không ổn định).
- Kết nối API thời gian thực hai chiều với hệ thống Quản lý Sinh Viên (chỉ đọc file CSV sinh viên export hàng đêm).
- Triển khai lên cụm Cloud Production thực tế (dự án chạy trên môi trường Docker Compose).

## Rủi ro và ràng buộc
- **Tranh chấp chỗ ngồi (Race Conditions)**: Một số workshop chỉ có 60 chỗ. Cần áp dụng cơ chế khóa atomic (Redis DECR) để tránh oversell.
- **Tải trọng đột biến (Traffic Spikes)**: Hệ thống dễ bị sập nếu không có kiểm soát truy cập. Cần cơ chế Token Bucket Rate Limiting.
- **Cổng thanh toán không ổn định**: Khi đối tác thanh toán lỗi, hệ thống phải đảm bảo các workshop miễn phí và giao diện xem lịch vẫn hoạt động. Cần áp dụng Circuit Breaker và Graceful Degradation.
- **Chống trừ tiền / đăng ký hai lần**: Sinh viên có thể spam nút click. Cần cơ chế Idempotency Key bảo vệ API.
- **Check-in Offline**: Điểm danh khi mất mạng cần lưu tại IndexedDB của thiết bị, tiềm ẩn rủi ro xung đột dữ liệu khi có sóng lại.
- **Tích hợp dữ liệu một chiều**: Quá trình đọc CSV hàng đêm có thể dính file lỗi hoặc dữ liệu rác, cần cơ chế Dead Letter Queue để không làm gãy toàn bộ tiến trình.
