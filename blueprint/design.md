# UniHub Workshop - Technical Design

## Overall Architecture

The system uses a **Modular Monolith** with separate **Async Worker Processes**.

- **Client**: `client/` is a React + Vite SPA for students and organizers, and also provides the check-in PWA surface for event staff.
- **Server API**: `server/` is a NestJS REST API split by business modules: Auth, Workshop, Registration, Payment, Checkin, Notification, Student Sync, and AI Summary.
- **Message Broker & Cache**: Redis supports high-traffic coordination: slot counters, rate limiting, idempotency, circuit-breaker state, and Bull Queue jobs.
- **Reasoning**: A modular monolith keeps delivery fast for a small team while Redis and workers move high-contention or slow operations out of the direct PostgreSQL request path.

## C4 Diagram

### Level 1 - System Context

```mermaid
flowchart LR
  student[Student]
  organizer[Organizer]
  staff[Check-in Staff]
  legacy[Legacy Student CSV Export]
  ai[External AI API]
  gateway[Mock Payment Gateway]
  mailhog[MailHog SMTP/Web UI]

  system[UniHub Workshop Platform]

  student -->|Browse workshops, register, pay, receive QR| system
  organizer -->|Manage workshops, upload CSV/PDF, monitor operations| system
  staff -->|Scan QR and sync offline check-ins| system
  legacy -->|Nightly CSV input| system
  system -->|Payment authorization with circuit breaker| gateway
  system -->|Email delivery in development| mailhog
  system -->|PDF text summary requests| ai
```

UniHub is the single platform for workshop discovery, registration, payment fallback, QR check-in, and operational workflows. Users access it through `client/`; integrations and persistence are coordinated by `server/`.

### Level 2 - Container

```mermaid
flowchart TB
  subgraph Browser["User Browser / Mobile Device"]
    spa["client/ React + Vite SPA"]
    pwa["Check-in PWA surface"]
    indexeddb[(IndexedDB pending_checkins)]
    pwa <--> indexeddb
  end

  subgraph Api["server/ NestJS API"]
    auth["AuthModule<br/>JWT + RBAC"]
    workshop["WorkshopModule<br/>CRUD + slot read model"]
    registration["RegistrationModule<br/>slot claim + QR"]
    payment["PaymentModule<br/>opossum circuit breaker"]
    checkin["CheckinModule<br/>validate + sync"]
    notification["NotificationModule<br/>enqueue jobs"]
    sync["StudentSyncModule<br/>CSV import"]
    summary["AiSummaryModule<br/>PDF summary enqueue"]
  end

  subgraph Worker["server/ Worker Process"]
    notificationWorker["Notification worker"]
    csvWorker["Student sync worker"]
    aiWorker["AI summary worker"]
  end

  postgres[(PostgreSQL<br/>canonical data)]
  redis[(Redis<br/>slots, rate limits,<br/>idempotency, Bull queues,<br/>breaker state)]
  mailhog[MailHog]
  gateway[Mock Payment Gateway]
  ai[External AI API]
  csv[CSV files]

  spa -->|REST JSON + JWT| auth
  spa -->|REST JSON + JWT| workshop
  spa -->|REST JSON + JWT + Idempotency-Key| registration
  spa -->|paid registration| payment
  pwa -->|online validate / sync batch| checkin

  auth --> postgres
  workshop --> postgres
  workshop --> redis
  registration --> redis
  registration --> postgres
  registration --> notification
  payment --> redis
  payment --> gateway
  payment --> postgres
  checkin --> postgres
  checkin --> redis
  notification --> redis
  sync --> redis
  summary --> redis

  redis --> notificationWorker
  redis --> csvWorker
  redis --> aiWorker
  notificationWorker --> mailhog
  csvWorker --> csv
  csvWorker --> postgres
  aiWorker --> ai
  aiWorker --> postgres
```

`server/` remains the HTTP modular monolith. Background work runs in worker processes that use Redis-backed Bull queues. PostgreSQL is the source of truth; Redis is used for volatile coordination and read-side counters.

## High-Level Architecture Diagram

```mermaid
flowchart TD
  student[Student in client/]
  staff[Check-in Staff in client/ PWA]
  api[server/ NestJS API]
  idemp[(Redis idempotency:key<br/>TTL 24h)]
  slots[(Redis workshop:id:slots)]
  breaker[(Redis / memory<br/>payment breaker state)]
  db[(PostgreSQL)]
  queue[(Redis Bull queues)]
  worker[server/ Worker]
  mailhog[MailHog]
  gateway[Mock Payment Gateway]
  pending[(IndexedDB pending_checkins)]

  student -->|POST /registrations<br/>Idempotency-Key| api
  api -->|GET idempotency:key| idemp
  idemp -->|cached result| api
  api -->|DECR workshop:id:slots| slots
  slots -->|remaining >= 0| api
  slots -->|remaining < 0 then INCR| api
  api -->|create Registration + QR| db
  api -->|SET idempotency result| idemp
  api -->|enqueue notification job| queue
  queue --> worker
  worker -->|send confirmation email| mailhog

  student -->|paid workshop payment request<br/>Idempotency-Key| api
  api -->|check/update breaker state| breaker
  breaker -->|OPEN: fast fallback canPay=false| api
  breaker -->|CLOSED/HALF_OPEN| gateway
  gateway -->|success/failure| api
  api -->|update paymentStatus| db

  staff -->|scan QR while online| api
  api -->|POST /checkin/validate<br/>insert CheckinLog| db

  staff -->|scan QR while offline| pending
  pending -->|navigator online event| staff
  staff -->|POST /checkin/sync batch| api
  api -->|idempotent upsert check-ins| db
  api -->|synced result| staff
  staff -->|clear synced items| pending
```

Registration is the strongest consistency path: the API checks the idempotency cache before touching slot state, uses Redis `DECR` as the atomic slot claim, writes the confirmed registration and QR to PostgreSQL, then stores the response for safe retries. If `DECR` returns a negative value, the API compensates with `INCR` and returns `409`.

Payment is isolated from free registration. Paid flows use the same idempotency concept, but calls to the mock gateway pass through an `opossum` circuit breaker; when the breaker is open, the API returns a graceful fallback instead of retrying the gateway.

Check-in supports both immediate and delayed writes. Online scans call `POST /checkin/validate`; offline scans are held in IndexedDB and later uploaded to `POST /checkin/sync`, which must be idempotent so repeated batches do not create duplicate `CheckinLog` rows.

## Database Design

PostgreSQL stores canonical data: `User`, `Workshop`, `Registration`, `CheckinLog`, and `StudentSyncLog`. Redis stores transient coordination state: workshop slot counters, idempotency responses, rate-limit buckets, circuit-breaker state, and Bull queues. Slot availability shown in the UI may be slightly stale; actual registration writes are protected by Redis `DECR` and database uniqueness constraints.

## Access Control Design

Authentication uses JWT issued by `server/src/modules/auth`. Protected endpoints use `JwtAuthGuard` plus `@Roles()` metadata checked by `RolesGuard`. The fixed roles are `STUDENT`, `ORGANIZER`, and `CHECKIN_STAFF`; organizer-only routes manage workshops/imports/summaries, while check-in routes require `CHECKIN_STAFF`.

## System Protection Design

### Traffic Spike Control

Use Redis-backed token buckets through `@nestjs/throttler`. Sensitive write paths such as `POST /registrations` get stricter limits than workshop browsing. When a bucket is exhausted, the API returns HTTP 429 with `Retry-After`.

### Payment Gateway Instability

Payment calls go through an `opossum` circuit breaker around the mock gateway. The target behavior is closed by default, open when failures exceed 50%, and half-open after 30 seconds. Open state returns `{ canPay: false }` quickly so workshop browsing and free registration remain available.

### Double Charge / Duplicate Registration Prevention

Registration and payment requests require an `Idempotency-Key` header. The API stores completed responses in Redis for 24 hours; a repeated key returns the saved response without re-claiming a slot or re-calling the payment gateway.

## Architecture Decision Records

- **Modular monolith over microservices**: faster delivery for a two-person team, while keeping domain boundaries in NestJS modules.
- **PostgreSQL as system of record**: strong relational constraints for users, workshops, registrations, and check-ins.
- **Redis for coordination, not canonical data**: low-latency counters and queues without making Redis the source of truth.
- **Bull Queue for slow work**: email, CSV sync, and AI summary jobs must not block user-facing API responses.
- **IndexedDB for offline check-in**: browser-local durable storage survives refreshes and temporary network loss.
