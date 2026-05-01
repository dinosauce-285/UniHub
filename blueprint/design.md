# UniHub Workshop — Technical Design

## Kiến trúc tổng thể

UniHub Workshop sử dụng kiến trúc **Monolith module hóa** (Modular Monolith) kết hợp với một số thành phần bổ trợ độc lập.

**Lý do chọn Modular Monolith thay vì Microservices:**
Hệ thống có quy mô vừa, team nhỏ (2 người), thời gian hạn chế. Microservices mang lại overhead vận hành lớn không tương xứng với lợi ích ở giai đoạn này. Tuy nhiên các module được thiết kế độc lập (Payment, Notification, CheckIn, CSV Import) để có thể tách ra sau nếu cần.

**Các thành phần chính:**

- **Web App (React + Vite):** Giao diện sinh viên và trang admin.
- **Mobile PWA (React):** Giao diện check-in cho nhân sự, hỗ trợ offline.
- **Backend API (NestJS):** Xử lý toàn bộ nghiệp vụ, chia module rõ ràng.
- **PostgreSQL:** Database chính, lưu toàn bộ dữ liệu quan hệ.
- **Redis:** Cache slot workshop, lưu idempotency key, rate limiting counter, Circuit Breaker state.
- **Bull Queue (Redis-backed):** Xử lý bất đồng bộ — gửi email, AI summary, CSV import.
- **Mock Payment Gateway:** Mô phỏng cổng thanh toán để test Circuit Breaker và Idempotency Key.

**Giao tiếp giữa các thành phần:**
- Web/PWA ↔ Backend API: REST over HTTP, JWT trong Authorization header.
- Backend API ↔ PostgreSQL: Prisma ORM.
- Backend API ↔ Redis: ioredis (cache, lock, rate limit, CB state).
- Backend API ↔ Bull Queue: job producer/consumer trong cùng process.
- Bull Queue → Email Service: SMTP (Nodemailer).
- Bull Queue → AI Model: HTTP call đến Anthropic API.
- Cronjob → CSV file: đọc file từ thư mục được mount, import vào PostgreSQL.

## C4 Diagram

### Level 1 — System Context

<!-- Diagram để trống -->

### Level 2 — Container

<!-- Diagram để trống -->

## High-Level Architecture Diagram

<!-- Diagram để trống -->

## Thiết kế cơ sở dữ liệu

### Lựa chọn database

Sử dụng **PostgreSQL** (SQL) làm database chính duy nhất.

**Lý do:**
- Dữ liệu có cấu trúc quan hệ rõ ràng: User — Registration — Workshop — Room.
- Cần transaction ACID cho luồng đăng ký (atomic slot deduction + tạo registration).
- Pessimistic Locking (`SELECT FOR UPDATE`) là native feature của PostgreSQL, đơn giản hơn nhiều so với implement ở tầng application.
- Team quen với SQL, không có usecase đặc thù cần NoSQL (không có document unstructured, không cần graph query).

Redis được dùng như **cache và coordination layer**, không phải database chính.

### Schema các entity chính

```sql
-- Người dùng hệ thống
User {
  id          UUID PRIMARY KEY
  studentId   VARCHAR UNIQUE      -- mã sinh viên, sync từ CSV
  email       VARCHAR UNIQUE
  name        VARCHAR
  role        ENUM(STUDENT, ORGANIZER, CHECKIN_STAFF)
  passwordHash VARCHAR
  createdAt   TIMESTAMP
}

-- Workshop
Workshop {
  id          UUID PRIMARY KEY
  title       VARCHAR
  description TEXT
  speakerName VARCHAR
  roomId      UUID REFERENCES Room(id)
  startTime   TIMESTAMP
  endTime     TIMESTAMP
  capacity    INT
  slotLeft    INT                 -- cache ở Redis, DB là source of truth
  price       DECIMAL(10,2)       -- 0 = miễn phí
  status      ENUM(DRAFT, OPEN, CANCELLED, COMPLETED)
  aiSummary   TEXT                -- kết quả AI Summary
  createdAt   TIMESTAMP
}

-- Phòng tổ chức
Room {
  id          UUID PRIMARY KEY
  name        VARCHAR
  building    VARCHAR
  mapImageUrl VARCHAR             -- sơ đồ phòng
  capacity    INT
}

-- Đăng ký tham dự
Registration {
  id              UUID PRIMARY KEY
  userId          UUID REFERENCES User(id)
  workshopId      UUID REFERENCES Workshop(id)
  status          ENUM(PENDING_PAYMENT, CONFIRMED, CANCELLED, CHECKED_IN)
  qrCode          VARCHAR UNIQUE  -- mã QR để check-in
  idempotencyKey  VARCHAR UNIQUE  -- chống thanh toán 2 lần
  paidAt          TIMESTAMP
  checkedInAt     TIMESTAMP
  createdAt       TIMESTAMP
  UNIQUE(userId, workshopId)
}

-- Lịch sử check-in (hỗ trợ offline sync)
CheckInRecord {
  id            UUID PRIMARY KEY
  registrationId UUID REFERENCES Registration(id)
  staffId       UUID REFERENCES User(id)
  checkedInAt   TIMESTAMP
  syncedAt      TIMESTAMP         -- null nếu chưa sync lên server
  deviceId      VARCHAR           -- identify thiết bị offline
}

-- Thông báo
Notification {
  id        UUID PRIMARY KEY
  userId    UUID REFERENCES User(id)
  type      ENUM(REGISTRATION_CONFIRMED, WORKSHOP_CANCELLED, WORKSHOP_UPDATED)
  channel   ENUM(APP, EMAIL)
  payload   JSONB
  sentAt    TIMESTAMP
  status    ENUM(PENDING, SENT, FAILED)
}
```

## Thiết kế kiểm soát truy cập

### Mô hình phân quyền: RBAC (Role-Based Access Control)

3 nhóm người dùng với quyền hạn cố định, không có điều kiện động → RBAC đơn giản là đủ, không cần ABAC.

| Quyền | STUDENT | ORGANIZER | CHECKIN_STAFF |
|---|---|---|---|
| Xem danh sách workshop | ✅ | ✅ | ✅ |
| Đăng ký workshop | ✅ | ❌ | ❌ |
| Xem "My Workshops" | ✅ | ❌ | ❌ |
| Tạo / sửa / hủy workshop | ❌ | ✅ | ❌ |
| Xem thống kê, danh sách đăng ký | ❌ | ✅ | ❌ |
| Quản lý users | ❌ | ✅ | ❌ |
| Quét QR check-in | ❌ | ❌ | ✅ |
| Xem danh sách đăng ký của workshop (để check-in) | ❌ | ❌ | ✅ |

### Cách triển khai

**JWT Payload:**
```json
{
  "sub": "user-uuid",
  "role": "STUDENT",
  "email": "user@example.com",
  "exp": 1234567890
}
```

- **Access token:** hết hạn sau 30 phút.
- **Refresh token:** hết hạn sau 7 ngày, lưu trong HttpOnly cookie.

**Guard trong NestJS:**
- `JwtAuthGuard`: verify token, gắn user vào request.
- `RolesGuard`: đọc `role` từ token, so sánh với decorator `@Roles()` trên endpoint.

**Áp dụng tại từng điểm truy cập:**
- `/api/workshops` (GET): public, không cần token.
- `/api/registrations` (POST): yêu cầu `STUDENT`.
- `/api/admin/workshops` (POST/PATCH/DELETE): yêu cầu `ORGANIZER`.
- `/api/checkin/scan` (POST): yêu cầu `CHECKIN_STAFF`.
- Trang admin React: redirect về `/login` nếu role không phải `ORGANIZER`.
- PWA check-in: ẩn toàn bộ UI nếu role không phải `CHECKIN_STAFF`.

## Thiết kế các cơ chế bảo vệ hệ thống

### Kiểm soát tải đột biến

**Giải pháp: Token Bucket** implemented bằng Redis + NestJS Throttler.

**Lý do chọn Token Bucket thay vì Fixed Window:**
Token Bucket cho phép burst ngắn hạn (sinh viên click nhanh 2–3 lần vẫn qua) nhưng giới hạn tốc độ trung bình. Fixed Window bị lỗi boundary — sinh viên có thể gửi 2x request ngay tại ranh giới cửa sổ thời gian.

**Cấu hình:**
- Mỗi IP: tối đa **20 request/10 giây** cho endpoint chung.
- Endpoint `/api/registrations` (POST): tối đa **5 request/30 giây** per user (theo JWT `sub`).

**Hành vi khi vượt ngưỡng:**
- Trả về HTTP `429 Too Many Requests`.
- Header `Retry-After` cho client biết bao giờ thử lại.
- Frontend hiển thị thông báo "Bạn đang thao tác quá nhanh, vui lòng thử lại sau X giây."

**Chống tranh chấp slot (race condition):**
Dùng `SELECT FOR UPDATE` trên bảng `Workshop` khi deduct slot, đảm bảo atomic trong cùng một DB transaction.

### Xử lý cổng thanh toán không ổn định

**Giải pháp: Circuit Breaker** với 3 trạng thái, state lưu trong Redis.

**Các trạng thái:**

| Trạng thái | Mô tả | Chuyển sang |
|---|---|---|
| **Closed** (bình thường) | Mọi request được gửi đến payment gateway | → Open khi ≥ 5 lỗi liên tiếp trong 60 giây |
| **Open** (đã ngắt) | Không gọi payment gateway, trả lỗi ngay | → Half-Open sau 30 giây |
| **Half-Open** (thử lại) | Cho 1 request thử qua | → Closed nếu thành công, → Open nếu thất bại |

**Graceful Degradation khi CB Open:**
- API vẫn phục vụ bình thường cho các endpoint không liên quan đến thanh toán.
- Endpoint đăng ký workshop miễn phí: **không bị ảnh hưởng**.
- Endpoint đăng ký workshop có phí: trả về HTTP `503` với message rõ ràng.
- Frontend: ẩn nút "Đăng ký" trên workshop có phí, hiển thị banner "Hệ thống thanh toán đang gián đoạn, vui lòng thử lại sau."
- Trang danh sách workshop, trang chi tiết: **load bình thường**.

### Chống trừ tiền hai lần

**Giải pháp: Idempotency Key**

**Luồng hoạt động:**

1. Frontend sinh `idempotencyKey = UUID v4` khi user bấm "Đăng ký".
2. Key được gửi kèm trong header `Idempotency-Key` của request.
3. Backend kiểm tra Redis: `EXISTS idempotency:{key}`.
   - Nếu **không tồn tại**: xử lý bình thường, lưu key vào Redis với TTL 24 giờ, lưu key vào cột `idempotencyKey` trong bảng `Registration`.
   - Nếu **đã tồn tại**: trả về kết quả của lần xử lý trước (lấy từ DB theo key), không xử lý lại.
4. Nếu payment gateway timeout: trả lỗi cho client, **không xóa key**. Client retry với cùng key → backend phát hiện đã có → kiểm tra trạng thái trong DB → trả về kết quả đúng.

**Nơi lưu trữ:** Redis (kiểm tra nhanh) + PostgreSQL cột `idempotencyKey` (source of truth khi Redis bị xóa).

**TTL:** 24 giờ — đủ dài để cover mọi retry trong một phiên đăng ký.

## Các quyết định kỹ thuật quan trọng (ADR)

### ADR-1: JWT thuần thay vì Session

**Chọn:** JWT stateless (access token 30 phút + refresh token 7 ngày trong HttpOnly cookie).

**Lý do:** Backend NestJS có thể scale ngang mà không cần sticky session. Mỗi request tự verify token mà không cần round-trip đến Redis. RBAC 3 nhóm quyền cố định — không có usecase cần thu hồi token ngay lập tức.

**Đánh đổi:** Nếu token bị lộ, phải chờ hết 30 phút mới vô hiệu. Chấp nhận được ở scope đồ án vì không có dữ liệu tài chính thật.

---

### ADR-2: PostgreSQL thay vì MongoDB

**Chọn:** PostgreSQL duy nhất cho toàn bộ dữ liệu nghiệp vụ.

**Lý do:** Dữ liệu có quan hệ rõ ràng, cần JOIN và transaction ACID. `SELECT FOR UPDATE` là tính năng native giải quyết trực tiếp bài toán tranh chấp slot. Team quen SQL.

**Đánh đổi:** Khó scale write theo chiều ngang hơn MongoDB. Không ảnh hưởng ở quy mô đồ án.

---

### ADR-3: Bull Queue thay vì Kafka

**Chọn:** Bull Queue (Redis-backed) cho tác vụ bất đồng bộ — gửi email, AI summary, CSV import.

**Lý do:** Team 2 người, không có thời gian vận hành Kafka cluster. Bull Queue đơn giản, tích hợp tốt với NestJS, đủ dùng cho lượng job của hệ thống này. Redis đã có sẵn cho cache và rate limiting — tái sử dụng không cần thêm infrastructure.

**Đánh đổi:** Không có message replay, partition, consumer group như Kafka. Không cần thiết ở quy mô này.

---

### ADR-4: Pipe-and-Filter cho AI Summary pipeline

**Chọn:** Pipe-and-Filter — mỗi bước xử lý độc lập: Upload PDF → Extract text → Clean text → Call AI API → Save summary.

**Lý do:** Dễ thêm/bớt bước xử lý (ví dụ: thêm bước dịch thuật) mà không ảnh hưởng các bước khác. Mỗi bước có thể retry độc lập khi lỗi. Phù hợp với Bull Queue — mỗi filter là một job.

**Đánh đổi:** Dữ liệu phải serialize/deserialize giữa các bước, tốn thêm một chút overhead. Không đáng kể với kích thước PDF vừa phải.

---

### ADR-5: IndexedDB cho offline check-in PWA

**Chọn:** IndexedDB trong PWA (Progressive Web App) để lưu check-in tạm khi mất mạng.

**Lý do:** PWA không cần cài đặt, nhân sự dùng ngay trên trình duyệt mobile. IndexedDB là storage API native của browser, không cần thư viện ngoài, đủ dùng cho volume check-in của một phòng workshop (~60 bản ghi).

**Đánh đổi:** Không có SQLite với đầy đủ query capability. Dữ liệu mất nếu user xóa storage trình duyệt. Chấp nhận được vì sync lên server ngay khi có mạng.