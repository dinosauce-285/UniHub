# UniHub Workshop — Phân công & Kế hoạch kỹ thuật
> Stack: React (Vite) + NestJS + PostgreSQL + Redis | 2 người: Thạnh & Long | Deadline < 2 tuần

---

## Tại sao NestJS thay vì Express thuần?

| Tiêu chí | Express thuần | NestJS |
|---|---|---|
| Cấu trúc | Tự tổ chức | Module/Controller/Service có sẵn — khớp với Layered Architecture |
| RBAC / Guards | Tự viết middleware | `@Roles()` decorator + `RolesGuard` có sẵn |
| Dependency Injection | Không có | Built-in — thực hiện DIP từ cheatsheet mà không cần tự build |
| Validation | Tự viết | `class-validator` + `ValidationPipe` — tự động |
| Queue (Bull) | Phải setup tay | `@nestjs/bull` module — 5 dòng setup |
| Blueprint mapping | Tự tổ chức | Mỗi NestJS Module = 1 domain trong Blueprint |

**Kết luận:** NestJS thực thi Layered Architecture (C1 trong cheatsheet) một cách tự nhiên. Với deadline gấp, không phải tự nghĩ cách tổ chức code.

---

## Kiến trúc áp dụng từ cheatsheet

### Tổng thể: Modular Monolith + Worker Process
Theo **C1 (Layered Architecture)** + **YAGNI (B4)**: team 2 người không làm Microservices, nhưng module hóa rõ ràng để tránh God Object.

```
┌─────────────────────────────────────────────────────┐
│                   React (Vite)                       │
│  Student UI │ Admin Panel │ Check-in PWA             │
└───────────────────┬─────────────────────────────────┘
                    │ HTTP / REST
┌───────────────────▼─────────────────────────────────┐
│              NestJS API (Layered)                    │
│  Controller → Service → Repository → Prisma/DB      │
│                                                     │
│  Modules: Auth │ Workshop │ Registration │           │
│           Payment │ CheckIn │ Notification │ Admin   │
└──────┬───────────────────────────────┬──────────────┘
       │                               │
┌──────▼──────┐              ┌─────────▼──────────────┐
│ PostgreSQL  │              │         Redis           │
│ (Primary)   │              │  - Slot counter (DECR)  │
│             │              │  - Rate limit           │
└─────────────┘              │  - Idempotency Key      │
                             │  - Circuit Breaker state│
                             │  - Bull Queue           │
                             └────────────────────────┘
┌─────────────────────────────────────────────────────┐
│              Bull Worker (NestJS Process)            │
│  - CSV Import Job (Batch Sequential - C4)           │
│  - AI Summary Job (Pipe-and-Filter - C3)            │
│  - Email Notification Job (Event-driven - C6)       │
└─────────────────────────────────────────────────────┘
```

### Pattern áp dụng cho từng vấn đề

| Vấn đề | Pattern (ref cheatsheet) | Cài đặt cụ thể |
|---|---|---|
| Race condition slot | A3: Pessimistic Locking / Distributed Lock | Redis `DECR` atomic — nếu < 0 → hết chỗ, không cần lock DB |
| Tải đột biến 12.000 SV | A1: Horizontal Scaling + Rate Limit | `@nestjs/throttler` với Redis store — Token Bucket |
| Payment lỗi | E3: Circuit Breaker + E5: Graceful Degradation | `opossum` npm — 3 state: Closed/Open/Half-Open |
| Double charge | F5: Idempotency Key | Middleware check UUID trong Redis TTL 24h |
| Check-in offline | A6: Offline-first + D4: Eventual Consistency | IndexedDB (`idb`) trên PWA, sync khi online |
| CSV import | C4: Batch Sequential | Bull Queue cronjob, chạy 2h sáng |
| Notification | C6: Event-driven | Bull Queue async — không chặn luồng đăng ký |
| Auth | F1: JWT (vì multi-service sau này) | `@nestjs/jwt` + `PassportJS` |
| Phân quyền | F4: RBAC (3 role cố định) | `@Roles()` decorator + `RolesGuard` |
| Số chỗ hiển thị | D2: Eventual Consistency | Đọc từ Redis cache, chấp nhận stale vài giây |
| Đặt chỗ thật sự | D1: Strong Consistency | Transaction Prisma + Redis DECR atomic |

---

## Cấu trúc repo (Thạnh setup)

```
unihub-workshop/
├── README.md
├── docker-compose.yml          ← Postgres + Redis + MailHog
├── .env.example
│
├── backend/                    ← NestJS
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/           ← JWT + RBAC Guards
│   │   │   ├── workshop/       ← CRUD + slot management
│   │   │   ├── registration/   ← Đăng ký + QR + Idempotency
│   │   │   ├── payment/        ← Circuit Breaker + mock gateway
│   │   │   ├── checkin/        ← Quét QR + sync offline
│   │   │   ├── notification/   ← Bull Queue email/app
│   │   │   ├── student-sync/   ← CSV import job
│   │   │   └── ai-summary/     ← PDF → AI → summary
│   │   ├── common/
│   │   │   ├── guards/         ← RolesGuard, JwtGuard
│   │   │   ├── decorators/     ← @Roles(), @CurrentUser()
│   │   │   ├── interceptors/   ← IdempotencyInterceptor
│   │   │   └── filters/        ← Global exception filter
│   │   └── prisma/
│   │       └── schema.prisma
│   └── package.json
│
├── frontend/                   ← React + Vite + TailwindCSS
│   ├── src/
│   │   ├── pages/
│   │   │   ├── student/        ← Xem workshop, đăng ký
│   │   │   ├── admin/          ← Quản lý workshop
│   │   │   └── checkin/        ← PWA quét QR (offline-capable)
│   │   ├── components/
│   │   ├── hooks/
│   │   │   └── useOfflineSync.ts  ← IndexedDB sync logic
│   │   └── lib/
│   │       └── api.ts
│   └── package.json
│
├── blueprint/                  ← Thạnh làm OpenSpec
│   ├── proposal.md
│   ├── design.md
│   └── specs/
│       ├── auth.md
│       ├── payment.md
│       ├── checkin.md
│       ├── registration.md
│       └── student-sync.md
│
└── data/
    ├── seed.ts                 ← Dữ liệu mẫu
    └── sample-students.csv     ← CSV mẫu để test import
```

---

## Phân công chi tiết

> **Nguyên tắc:** Mỗi người phụ trách một tính năng từ đầu đến cuối (backend NestJS + frontend React), không chia theo layer. Phát triển song song — dùng mock API/data để không block nhau.

---

### NGÀY 1–2: Khởi tạo & Thiết kế

- [x] **Thạnh:** Init repo GitHub, branch `main` + `dev`, `docker-compose.yml` (Postgres, Redis, MailHog)
- [x] **Thạnh:** Init NestJS, cài Prisma, viết `schema.prisma` đầy đủ, migration, seed data (3 user/role, 5 workshop, 50 student)
- [x] **Thạnh:** Init React + Vite + TailwindCSS, React Router (3 khu vực: student / admin / checkin)
- [x] **Thạnh:** `lib/api.ts`: axios instance, auto-attach JWT; Zustand store: auth state
- [ ] **Long:** Vẽ C4 Diagram (Level 1 System Context + Level 2 Container) vào `blueprint/design.md`
- [ ] **Long:** Vẽ High-Level Architecture Diagram (luồng dữ liệu, offline check-in, circuit breaker) vào `blueprint/design.md`
- [x] **Thạnh:** Review schema + cấu trúc repo trước khi bắt đầu feature riêng

---

### THẠNH — Auth + RBAC (Ngày 3–4) · [BE + FE]

**Backend (NestJS):**
- [ ] `AuthModule`: `POST /auth/login` → JWT access token + refresh token
- [ ] `RolesGuard` + `@Roles()` decorator, áp lên tất cả endpoint cần bảo vệ
- [ ] `@CurrentUser()` decorator, `@JwtGuard` global guard

**Frontend (React):**
- [ ] Trang Login với form + validation client-side
- [ ] `useAuth` hook, lưu token vào Zustand, auto-refresh
- [ ] `ProtectedRoute` component: redirect nếu chưa đăng nhập / sai role

---

### LONG — Workshop CRUD (Ngày 3–4) · [BE + FE]

**Backend (NestJS):**
- [ ] `WorkshopModule`: `GET /workshops`, `GET /workshops/:id`, `POST/PATCH/DELETE` (ORGANIZER only)
- [ ] Prisma queries, populate slot còn lại từ Redis cache

**Frontend (React):**
- [ ] Trang danh sách workshop: filter theo ngày, hiển thị slot còn lại (D2: Eventual Consistency từ Redis)
- [ ] Trang chi tiết workshop: thông tin diễn giả, sơ đồ phòng, AI summary placeholder, nút đăng ký
- [ ] Admin: form tạo/sửa workshop (validate phía client), bảo vệ route ORGANIZER

> **Không block:** Long mock auth state trong Zustand (`isLoggedIn: true, role: 'ORGANIZER'`) để phát triển UI độc lập khi Thạnh chưa xong Auth.

---

### THẠNH — Đăng ký + QR + Idempotency (Ngày 5–6) · [BE + FE]

**Backend (NestJS):**
- [ ] `RegistrationModule`: `POST /registrations` — **Redis DECR atomic** cho slot (A3: Pessimistic Locking)
- [ ] Sinh QR code (`qrcode` npm) sau đăng ký thành công
- [ ] `IdempotencyInterceptor`: check UUID header trong Redis TTL 24h (F5: Idempotency Key)

**Frontend (React):**
- [ ] Luồng đăng ký free: click → gọi API kèm `Idempotency-Key` UUID header
- [ ] Nhận QR code từ response → hiển thị inline + tải về
- [ ] Trang "Workshop của tôi": danh sách đã đăng ký + QR code

---

### LONG — Payment + Circuit Breaker (Ngày 5–6) · [BE + FE]

**Backend (NestJS):**
- [ ] Mock payment gateway: endpoint nội bộ, random fail 30%
- [ ] `PaymentModule` dùng `opossum`: Closed → Open (50% lỗi) → Half-Open (30s) (E3: Circuit Breaker)
- [ ] Fallback: `{ canPay: false, reason: 'payment_unavailable' }` (E5: Graceful Degradation)
- [ ] Idempotency Key cho payment request

**Frontend (React):**
- [ ] Luồng đăng ký có phí: form nhập thông tin → gọi payment API
- [ ] Xử lý `canPay: false` → hiển thị banner "Thanh toán tạm thời gián đoạn, xem lịch vẫn bình thường"
- [ ] Loading state + error handling

---

### THẠNH — Check-in API (Ngày 7) · [BE]

- [ ] `CheckinModule`: `POST /checkin/validate` — nhận QR, ghi `checkin_logs`, trả kết quả
- [ ] `POST /checkin/sync` — nhận batch từ PWA offline (Eventual Consistency)
- [ ] Viết `blueprint/specs/checkin.md`

---

### LONG — Rate Limiting + Notification BE (Ngày 7) · [BE]

- [ ] `@nestjs/throttler` + Redis store: 10 req/10s cho `/registrations`, 100 req/min cho GET workshop
- [ ] Trả `HTTP 429` với `Retry-After` header khi vượt ngưỡng
- [ ] `NotificationModule` dùng `@nestjs/bull`: Job gửi email qua Nodemailer → MailHog (async, không block luồng đăng ký)
- [ ] Viết `blueprint/specs/registration.md`

---

### THẠNH — Check-in PWA Offline (Ngày 8–9) · [FE hoàn chỉnh]

- [ ] Cài `idb` (IndexedDB wrapper)
- [ ] `useOfflineSync` hook:
  - Online: gọi API check-in trực tiếp
  - Offline: ghi vào IndexedDB `pending_checkins`
  - Khi có mạng lại: `navigator.onLine` event → gọi `POST /checkin/sync` batch
- [ ] QR scanner: dùng `@zxing/browser`
- [ ] UI rõ trạng thái: badge "OFFLINE MODE" khi mất mạng, hiển thị số check-in đang pending

---

### LONG — Notification FE + Responsive (Ngày 8–9) · [FE hoàn chỉnh]

- [ ] Toast notification khi đăng ký thành công
- [ ] Responsive mobile cho tất cả trang: student, admin, check-in
- [ ] Kiểm tra UX flow toàn bộ trang trên mobile viewport
- [ ] Viết `blueprint/specs/auth.md`

---

### THẠNH — CSV Import + AI Summary (Ngày 10–11) · [BE + FE]

**Backend (NestJS):**
- [ ] `StudentSyncModule`: Bull Job cronjob 2h sáng, đọc CSV, upsert `INSERT ... ON CONFLICT (student_id) DO UPDATE` (C4: Batch Sequential)
- [ ] Dead Letter Queue: file lỗi → log vào bảng `sync_errors`
- [ ] `AISummaryModule`: upload PDF → `pdf-parse` extract text → pipe sang Claude API → lưu `ai_summary` (C3: Pipe-and-Filter), chạy qua Bull Queue (không block API)
- [ ] Viết `blueprint/specs/student-sync.md`

**Frontend (React):**
- [ ] Upload PDF trong admin → trigger AI Summary, hiển thị `ai_summary` trên trang chi tiết workshop
- [ ] Upload CSV thủ công trong admin + xem sync log lỗi (bảng `StudentSyncLog`)

---

### LONG — Admin Dashboard + Thống kê (Ngày 10–11) · [BE + FE]

**Backend (NestJS):**
- [ ] `GET /admin/stats` — số đăng ký theo workshop, tỷ lệ check-in
- [ ] `GET /admin/users` — danh sách user theo role (phân trang)

**Frontend (React):**
- [ ] Dashboard: biểu đồ số đăng ký theo workshop (`recharts` BarChart)
- [ ] Biểu đồ tỷ lệ check-in theo workshop (recharts PieChart)
- [ ] Quản lý user: danh sách theo role, tìm kiếm theo email/tên

---

### THẠNH — Hoàn thiện + Blueprint (Ngày 12–13)

- [ ] Hoàn chỉnh `blueprint/proposal.md` + `blueprint/design.md` (DB design, ADR)
- [ ] Viết `blueprint/specs/payment.md` theo template: Mô tả, Luồng chính, Kịch bản lỗi, Ràng buộc, Tiêu chí chấp nhận
- [ ] Kiểm tra tất cả endpoint có guard đúng, test thủ công toàn bộ luồng
- [ ] Fix bug còn lại: hết slot, QR duplicate, circuit breaker mở

---

### LONG — Review Blueprint + Video demo (Ngày 12–14)

- [ ] Kiểm tra specs đã viết khớp code thực tế
- [ ] Viết `README.md` đầy đủ: hướng dẫn `docker-compose up` → migrate → seed → test từng luồng
- [ ] Tạo thư mục `clips/` và quay video demo FullHD 1080p MP4 theo thứ tự:
  đăng ký free → payment circuit breaker → check-in offline → sync → admin dashboard + thống kê

---

### THẠNH — Final check (Ngày 14)

- [ ] Chạy toàn bộ luồng từ đầu trên môi trường `docker-compose` fresh (không dùng dữ liệu cũ)
- [ ] Kiểm tra Blueprint khớp code, commit tag `v1.0.0`

---

## Các điểm kỹ thuật quan trọng cần implement đúng

### 1. Redis DECR cho slot (không dùng DB lock)
```typescript
// registration.service.ts
async claimSlot(workshopId: string): Promise<boolean> {
  const key = `workshop:${workshopId}:slots`;
  const remaining = await this.redis.decr(key);
  if (remaining < 0) {
    await this.redis.incr(key); // hoàn lại
    return false; // hết chỗ
  }
  return true;
}
```
**Lý do:** `DECR` là atomic — không cần transaction DB, không có race condition (A3 cheatsheet).

### 2. Circuit Breaker với opossum
```typescript
// payment.service.ts
const breaker = new CircuitBreaker(callPaymentGateway, {
  timeout: 3000,           // timeout 3s
  errorThresholdPercentage: 50,  // Open sau 50% lỗi
  resetTimeout: 30000,     // Half-Open sau 30s
});
breaker.fallback(() => ({ success: false, reason: 'payment_unavailable' }));
```
**Lý do:** Khi gateway sập, không gọi liên tục → tránh Cascading Failure (E3 cheatsheet).

### 3. Idempotency Middleware
```typescript
// idempotency.interceptor.ts
const key = request.headers['idempotency-key'];
const cached = await redis.get(`idempotency:${key}`);
if (cached) return JSON.parse(cached); // trả kết quả cũ
// ... xử lý xong thì lưu:
await redis.setex(`idempotency:${key}`, 86400, JSON.stringify(result));
```
**Lý do:** Ngăn double charge khi client retry (F5 cheatsheet).

### 4. Offline sync hook
```typescript
// useOfflineSync.ts
useEffect(() => {
  window.addEventListener('online', async () => {
    const pending = await db.getAll('pending_checkins');
    if (pending.length > 0) {
      await api.post('/checkin/sync', { checkins: pending });
      await db.clear('pending_checkins');
    }
  });
}, []);
```
**Lý do:** Eventual Consistency — dữ liệu sẽ đúng sau khi sync, không mất khi mất mạng (A6 cheatsheet).

---

## Database Schema (Prisma)

```prisma
enum Role { STUDENT  ORGANIZER  CHECKIN_STAFF }
enum RegistrationStatus { PENDING  CONFIRMED  CANCELLED }
enum PaymentStatus { FREE  PENDING  PAID  FAILED  REFUNDED }

model User {
  id          String   @id @default(cuid())
  studentId   String?  @unique  // từ CSV import
  email       String   @unique
  name        String
  role        Role     @default(STUDENT)
  registrations Registration[]
  checkinLogs  CheckinLog[]
}

model Workshop {
  id          String   @id @default(cuid())
  title       String
  description String
  speaker     String
  room        String
  roomMapUrl  String?
  startTime   DateTime
  endTime     DateTime
  totalSlots  Int
  // slots còn lại lưu ở Redis, không ở đây
  isPaid      Boolean  @default(false)
  price       Int      @default(0)
  aiSummary   String?
  registrations Registration[]
}

model Registration {
  id            String  @id @default(cuid())
  userId        String
  workshopId    String
  status        RegistrationStatus @default(PENDING)
  paymentStatus PaymentStatus      @default(FREE)
  qrCode        String?
  idempotencyKey String? @unique    // chống đăng ký trùng
  createdAt     DateTime @default(now())
  user          User     @relation(fields: [userId], references: [id])
  workshop      Workshop @relation(fields: [workshopId], references: [id])
  checkinLog    CheckinLog?
  @@unique([userId, workshopId])   // 1 SV chỉ đăng ký 1 workshop 1 lần
}

model CheckinLog {
  id             String   @id @default(cuid())
  registrationId String   @unique
  checkedInAt    DateTime
  syncedAt       DateTime?  // null = chưa sync từ offline
  registration   Registration @relation(fields: [registrationId], references: [id])
}

model StudentSyncLog {
  id         String   @id @default(cuid())
  filename   String
  totalRows  Int
  imported   Int
  errors     Int
  errorDetails Json?
  runAt      DateTime @default(now())
}
```

---

## docker-compose.yml

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: unihub
      POSTGRES_USER: unihub
      POSTGRES_PASSWORD: unihub123
    ports: ["5432:5432"]
    volumes: [postgres_data:/var/lib/postgresql/data]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  mailhog:
    image: mailhog/mailhog
    ports:
      - "1025:1025"  # SMTP
      - "8025:8025"  # Web UI xem email

volumes:
  postgres_data:
```

---

## OpenSpec Blueprint structure (Thạnh viết)

```
blueprint/
├── proposal.md         ← Vấn đề, mục tiêu, người dùng, phạm vi, rủi ro
├── design.md           ← C4 diagram, High-level arch, DB design, ADR
└── specs/
    ├── auth.md         ← RBAC, JWT, 3 role, endpoint nào cần quyền gì
    ├── registration.md ← Luồng đăng ký free + có phí, QR, Idempotency
    ├── payment.md      ← Circuit Breaker states, Graceful Degradation
    ├── checkin.md      ← Offline sync flow, conflict handling
    └── student-sync.md ← Batch Sequential, error handling, Dead Letter
```

Mỗi spec file viết theo template:
- **Mô tả**: tính năng làm gì
- **Luồng chính**: step by step, thành phần tham gia  
- **Kịch bản lỗi**: timeout, mất mạng, dữ liệu lỗi
- **Ràng buộc**: giới hạn hiệu năng, bảo mật
- **Tiêu chí chấp nhận**: làm sao biết tính năng đúng

---

## Thứ tự ưu tiên nếu hết thời gian

1. ✅ Blueprint hoàn chỉnh
2. ✅ Auth + RBAC + seed data
3. ✅ Workshop CRUD + đăng ký free + QR
4. ✅ Rate Limiting (5 dòng config)
5. ✅ Idempotency Key (middleware)
6. ✅ Circuit Breaker payment
7. ✅ Check-in PWA offline
8. ⬜ CSV import job
9. ⬜ AI Summary
10. ⬜ Video demo
