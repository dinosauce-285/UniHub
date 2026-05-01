# UniHub Workshop — Technical Design

## Kiến trúc tổng thể

Hệ thống sử dụng kiến trúc **Modular Monolith** kết hợp với **Async Worker Processes**.

- **Frontend**: Ứng dụng SPA viết bằng React (Vite) đóng vai trò là Web App cho Sinh viên và Ban tổ chức, đồng thời cung cấp giao diện PWA điểm danh offline cho Nhân sự sự kiện.
- **Backend API**: Dựa trên NestJS, cung cấp RESTful API phân chia theo các module nghiệp vụ rõ ràng (Auth, Workshop, Registration, Checkin...) nhưng chạy trong một tiến trình duy nhất để dễ triển khai.
- **Message Broker & Cache**: Sử dụng Redis đóng vai trò then chốt trong việc duy trì hiệu suất dưới tải cao (Slot Counting, Rate Limiting, Idempotency) và điều phối các Background Jobs thông qua Bull Queue.
- **Lý do lựa chọn**: Kiến trúc Monolith giúp tốc độ phát triển nhanh, phù hợp cho quy mô nhóm nhỏ nhưng vẫn xử lý được khối lượng giao dịch đột biến nhờ đưa các nút thắt cổ chai (như kiểm đếm chỗ ngồi) ra xử lý in-memory trên Redis, và đẩy các tác vụ nặng (Email, AI, Import File) sang hàng đợi bất đồng bộ.

## C4 Diagram

### Level 1 — System Context

```mermaid

```

### Level 2 — Container

```mermaid

```

## High-Level Architecture Diagram


```mermaid

```

## High-Level Architecture Diagram

<!-- Sơ đồ luồng dữ liệu, đặc biệt tại các điểm tích hợp và luồng check-in offline -->

## Thiết kế cơ sở dữ liệu

<!-- Loại database, lý do lựa chọn, schema các entity chính -->

## Thiết kế kiểm soát truy cập

<!-- Mô hình phân quyền, các nhóm người dùng, cách kiểm tra quyền tại từng điểm truy cập -->

## Thiết kế các cơ chế bảo vệ hệ thống

### Kiểm soát tải đột biến

<!-- Giải pháp, thuật toán, ngưỡng, hành vi khi vượt ngưỡng -->

### Xử lý cổng thanh toán không ổn định

<!-- Giải pháp, các trạng thái, ngưỡng kích hoạt, hành vi khi lỗi -->

### Chống trừ tiền hai lần

<!-- Cơ chế, nơi lưu trữ, TTL, luồng xử lý khi phát hiện trùng lặp -->

## Các quyết định kỹ thuật quan trọng (ADR)

<!-- Với mỗi quyết định lớn: lựa chọn gì, tại sao, đánh đổi gì.
     Ví dụ: SQL vs NoSQL, JWT vs Session, Kafka vs RabbitMQ, ... -->
