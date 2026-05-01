# UniHub Workshop — Project Proposal

## Vấn đề

Trường Đại học A tổ chức "Tuần lễ kỹ năng và nghề nghiệp" hàng năm với 5 ngày, mỗi ngày có 8–12 workshop diễn ra song song. Hiện tại ban tổ chức quản lý đăng ký bằng Google Form và thông báo qua email thủ công.

Quy trình này gây ra các hậu quả cụ thể:

- **Tranh chấp chỗ ngồi:** Google Form không kiểm soát số lượng — nhiều sinh viên có thể đăng ký vượt quá sức chứa phòng, ban tổ chức phải lọc thủ công sau đó.
- **Không có xác nhận tức thời:** Sinh viên không biết mình có chỗ hay không cho đến khi nhận email thủ công từ ban tổ chức, đôi khi mất vài ngày.
- **Check-in thủ công:** Nhân sự phải đối chiếu danh sách in giấy tại cửa phòng, dễ sai sót và mất thời gian.
- **Không có thống kê:** Ban tổ chức không theo dõi được số lượng đăng ký theo thời gian thực, khó điều phối phòng và diễn giả.
- **Không mở rộng được:** Khi quy mô tăng lên hàng nghìn sinh viên đăng ký cùng lúc, Google Form và email thủ công hoàn toàn không đáp ứng được.

## Mục tiêu

- Hỗ trợ **12.000 sinh viên** truy cập trong 10 phút đầu khi mở đăng ký, trong đó 60% dồn vào 3 phút đầu tiên.
- Đảm bảo **không có hai sinh viên nào cùng nhận được chỗ cuối cùng** của một workshop.
- Sinh viên nhận **mã QR xác nhận trong vòng vài giây** sau khi đăng ký thành công.
- Nhân sự check-in **vẫn hoạt động được khi mất mạng**, dữ liệu không bị mất khi kết nối phục hồi.
- Hệ thống **vẫn cho xem lịch workshop bình thường** dù cổng thanh toán đang gặp sự cố.
- Dễ dàng **bổ sung kênh thông báo mới** (Telegram, v.v.) mà không cần thay đổi lớn vào code hiện có.

## Người dùng và nhu cầu

| Nhóm | Nhu cầu chính | Điều quan trọng nhất |
|---|---|---|
| **Sinh viên** | Xem lịch workshop, đăng ký, nhận QR, check-in khi tham dự | Đăng ký nhanh, biết ngay có chỗ hay không |
| **Ban tổ chức** | Tạo/sửa/hủy workshop, xem thống kê đăng ký theo thời gian thực | Kiểm soát được toàn bộ sự kiện từ một trang admin |
| **Nhân sự check-in** | Quét mã QR tại cửa phòng bằng mobile app | App hoạt động được ngay cả khi mạng không ổn định |

## Phạm vi

**Trong phạm vi đồ án:**
- Toàn bộ luồng đăng ký: xem workshop, đăng ký miễn phí và có phí, nhận mã QR.
- Hệ thống thông báo qua app và email, thiết kế để dễ mở rộng thêm kênh mới.
- Trang admin để quản lý workshop và xem thống kê.
- Mobile PWA cho nhân sự check-in, hỗ trợ offline.
- AI Summary tự động từ file PDF giới thiệu workshop.
- Đồng bộ dữ liệu sinh viên từ file CSV export của hệ thống cũ.
- Các cơ chế bảo vệ: rate limiting, circuit breaker, idempotency key, RBAC.

**Ngoài phạm vi:**
- Tích hợp cổng thanh toán thật (dùng mock gateway).
- Hạ tầng production, CI/CD, monitoring thật (chỉ chạy local qua Docker).
- API hai chiều với hệ thống quản lý sinh viên hiện tại (chỉ đọc CSV một chiều).
- Ứng dụng mobile native (iOS/Android) — dùng PWA.

## Rủi ro và ràng buộc

| Vấn đề | Mô tả | Giải pháp dự kiến |
|---|---|---|
| **Tranh chấp chỗ ngồi** | Hàng trăm sinh viên cùng đăng ký workshop 60 chỗ ngay khi mở | Pessimistic Locking / Distributed Lock (Redis) để đảm bảo atomic |
| **Tải đột biến** | ~12.000 sinh viên trong 10 phút, 60% trong 3 phút đầu | Rate Limiting (Token Bucket) + hàng đợi để bảo vệ backend API |
| **Thanh toán không ổn định** | Cổng thanh toán có thể timeout hoặc sập | Circuit Breaker + Graceful Degradation + Idempotency Key |
| **Check-in offline** | Một số khu vực mất mạng, dữ liệu không được mất | Offline-first PWA với IndexedDB, sync khi có mạng |
| **Tích hợp một chiều CSV** | Không có API hệ thống cũ, chỉ có file CSV export theo lịch | Batch Sequential (cronjob đêm) + Dead Letter Queue xử lý lỗi |