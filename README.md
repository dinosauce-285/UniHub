# UniHub Workshop Platform

UniHub is a university workshop and event management platform for replacing manual Google Form, spreadsheet, and email workflows. It supports workshop publishing, student registration, QR confirmation, door check-in, organizer operations, and scalable seat claiming for high-contention registration windows.

The project is built as a course-ready modular monolith: a React/Vite frontend, a NestJS backend, PostgreSQL for canonical data, Redis for coordination, BullMQ for async jobs, Supabase Storage for uploaded files, Groq for PDF summaries, MailHog for local email testing, and a mock payment gateway for payment-resilience demos.

For full architecture diagrams and ADRs, see [blueprint/design.md](blueprint/design.md).

## Key Features

### Student

- Login with seeded or imported student account.
- Browse open workshops and view workshop details.
- Register for workshops with QR confirmation.
- View "My workshops" and QR code image.
- Complete mock payment for paid workshop registrations.

### Organizer

- Dashboard and overview statistics.
- Create, update, and manage workshop status.
- Configure free/paid workshops, capacity, schedule, speaker, room, and description.
- Upload room maps to Supabase Storage.
- Generate AI workshop summaries from PDF through Groq.
- List/search students and import students from CSV.
- Trigger and inspect legacy student sync logs.

### Check-in Staff

- Scan or manually enter QR payloads.
- Validate eligible registrations.
- Record check-in logs.
- Store check-ins in IndexedDB while offline and batch-sync them when the browser comes back online.

### System-Level

- JWT authentication with refresh token rotation.
- Role-based access control for `STUDENT`, `ORGANIZER`, and `CHECKIN_STAFF`.
- Redis-backed rate limiting and atomic slot counters.
- Idempotency keys for registration and payment writes.
- BullMQ queues for notification and student sync jobs.
- Mock payment gateway with `opossum` circuit breaker.
- PostgreSQL + Prisma schema with unique constraints for duplicate protection.
- MailHog/Nodemailer email delivery for local development.

## Architecture Summary

UniHub uses a **NestJS modular monolith**. Business capabilities are split into modules such as Auth, Workshop, Registration, Payment, Check-in, Notification, Student Sync, Students, AI Summary, and Stats.

High-level components:

| Component | Responsibility |
|---|---|
| React + Vite frontend | Student, organizer, and check-in staff UI. |
| NestJS backend | REST API, validation, RBAC, business workflows. |
| PostgreSQL | Canonical relational data for users, workshops, registrations, payments, check-ins, and sync logs. |
| Redis | Slot counters, idempotency cache, rate limits, and BullMQ queue storage. |
| BullMQ | Async notification and student sync jobs; AI summary queue in backend. |
| Supabase Storage | Room map uploads and temporary AI-summary PDFs. |
| Mock payment gateway | Demo payment provider wrapped by a circuit breaker. |
| Groq AI API | Workshop PDF summary generation. |
| MailHog | Local SMTP capture and email preview. |

Important implementation note: BullMQ workers currently run inside the NestJS application process. The architecture can be split into separate worker processes later, but there is no separate worker script in the current package scripts.

## Tech Stack

### Backend

- NestJS
- TypeScript
- Prisma 7 with PostgreSQL
- Redis with ioredis
- BullMQ
- JWT + Passport
- NestJS Throttler
- Supabase Storage SDK
- Groq AI API via `fetch`
- Nodemailer + MailHog
- `opossum` circuit breaker

### Frontend

- React 19
- Vite
- TypeScript
- React Router
- Zustand
- Axios
- Tailwind CSS
- ZXing browser QR scanner
- PWA service worker and IndexedDB for check-in queue

### Infrastructure

- Docker Compose
- PostgreSQL 16
- Redis 7
- MailHog

## Repository Structure

```text
.
|-- blueprint/              # Proposal, architecture design, demo notes
|-- client/                 # React/Vite frontend
|-- data/                   # Sample and legacy CSV files
|-- openspec/               # Change/spec history
|-- scripts/                # Utility/demo scripts
|-- server/                 # NestJS backend and Prisma schema
|-- docker-compose.yml      # PostgreSQL, Redis, MailHog
|-- package.json            # Root convenience scripts
`-- README.md
```

## Local Development Setup

### Prerequisites

- Node.js 22 recommended
- npm
- Docker Desktop or compatible Docker Compose runtime
- Supabase project credentials for backend startup
- Groq API key for AI summary features

### 1. Install Dependencies

```powershell
npm install
cd server
npm install
cd ../client
npm install
cd ..
```

### 2. Start Local Infrastructure

```powershell
docker compose up -d
```

This starts:

- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- MailHog SMTP: `localhost:1025`
- MailHog UI: `http://localhost:8025`

### 3. Configure Environment Files

Create `server/.env` from `server/.env.example` and fill in required values:

```powershell
Copy-Item server\.env.example server\.env
```

Create or keep `client/.env.local`:

```env
VITE_API_URL=/api
```

The Vite dev server proxies `/api` to `http://localhost:3000`.

### 4. Prepare the Database

```powershell
cd server
npm run prisma:generate
npm run prisma:push
npm run seed
cd ..
```

Seeded demo users all use password `Password123!`.

| Role | Email |
|---|---|
| Student | `student1@unihub.local` |
| Organizer | `organizer1@unihub.local` |
| Check-in staff | `checkin1@unihub.local` |

### 5. Run the App

Run both backend and frontend from the repository root:

```powershell
npm run dev
```

Or run them separately:

```powershell
npm run dev:server
npm run dev:client
```

Useful URLs:

- Frontend: `https://localhost:5173`
- Backend API root: `http://localhost:3000`
- Backend API prefix: `http://localhost:3000/api`
- Health check: `http://localhost:3000/api/health`
- MailHog UI: `http://localhost:8025`

For mobile check-in testing on the same Wi-Fi, use the Network URL printed by Vite, for example `https://192.168.1.x:5173/checkin`. If using production preview, run:

```powershell
cd client
npm run build
npx vite preview --host 0.0.0.0
```

## Environment Variables

Backend variables are documented in [server/.env.example](server/.env.example). Required or used names:

| Variable | Purpose |
|---|---|
| `PORT` | Backend port, defaults to `3000`. |
| `CORS_ORIGINS` | Allowed frontend origins; `*` is supported for local development. |
| `DATABASE_URL` | PostgreSQL connection string. |
| `REDIS_URL` | Redis connection string. |
| `JWT_SECRET` | JWT signing secret. Must be set. |
| `JWT_EXPIRES_IN` | Access token lifetime. |
| `REFRESH_TOKEN_EXPIRES_DAYS` | Refresh token lifetime in days. |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_FROM` | SMTP settings, defaulting to MailHog locally. |
| `NOTIFICATION_EMAIL_ENABLED` | Set to `false` to disable email sends. |
| `GROQ_API_KEY`, `GROQ_MODEL` | Groq AI summary integration. |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase Storage integration. Required by current backend startup. |
| `LEGACY_CSV_PATH` | Optional path for scheduled/manual student sync. |
| `MOCK_PAYMENT_FAILURE_RATE` | Optional mock gateway failure rate from `0` to `1`. |
| `RATE_LIMIT_GLOBAL_LIMIT`, `RATE_LIMIT_GLOBAL_TTL_MS` | Optional global rate-limit overrides. |
| `STUDENT_IMPORT_TEMP_PASSWORD` | Optional temporary password for imported students. |

Frontend variables:

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | API base URL. Use `/api` when running through Vite proxy. |

Do not commit real Supabase, Groq, JWT, or database secrets.

## API Overview

The backend sets a global `/api` prefix.

| Group | Main endpoints |
|---|---|
| Auth | `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout` |
| Workshops | `GET /api/workshops`, `GET /api/workshops/:id`, organizer create/update/status/room-map routes |
| Registrations | `GET /api/registrations/me`, `POST /api/registrations` |
| Payment | `GET /api/payment/status`, `POST /api/payment/registrations/:registrationId/pay` |
| Check-in | `POST /api/checkin/validate`, `POST /api/checkin/sync` |
| Students | `GET /api/students`, `GET /api/students/:id`, `POST /api/students/import` |
| Student sync | `GET /api/student-sync`, `POST /api/student-sync/trigger` |
| AI summary | `POST /api/workshops/:workshopId/ai-summary`, `POST /api/ai-summary/preview` |
| Stats | `GET /api/stats/overview` |
| Health | `GET /api/health` |

Registration and payment write endpoints require an `Idempotency-Key` header.

## Implementation Status

| Feature | Status | Notes |
|---|---|---|
| Auth + RBAC | Implemented | JWT access token, refresh token records, backend guards, frontend protected routes. |
| Workshop management | Implemented | CRUD/status and Supabase room-map upload. |
| Registration slot control | Implemented | Redis `DECR`/`INCR` with PostgreSQL unique constraints. |
| Registration idempotency | Implemented | Redis 24-hour response cache plus database unique key. |
| Payment | Mock/demo implementation | Mock gateway with `PaymentAttempt` persistence and idempotency. No real payment provider. |
| Payment circuit breaker | Implemented | In-memory `opossum` breaker; state is not shared across API instances. |
| Notifications | Implemented | BullMQ, MailHog email, and in-app log strategy. |
| Check-in | Implemented | Online QR validation and IndexedDB offline queue with batch sync. Offline scans are validated when synced. |
| Student CSV import | Implemented | Organizer upload path creates new students and reports row errors. |
| Legacy student sync | Implemented | Manual/cron BullMQ worker reads CSV and writes `StudentSyncLog`. |
| AI summary preview | Implemented | Frontend form uses synchronous preview endpoint. |
| AI summary async queue | Backend implemented | Endpoint and worker exist; current organizer form primarily uses preview flow. |
| Separate worker deployment | Partial | Workers are architecturally separable but currently run in the NestJS process. |
| Production readiness | Out of scope | Local/demo infrastructure only; no CI/CD or production monitoring. |

## Documentation

- [Project proposal](blueprint/proposal.md)
- [Architecture design, C4 diagrams, database schema, flows, ADRs](blueprint/design.md)
- [Demo script notes](blueprint/demo.md)
- [Original assignment text](blueprint/test.txt)

## Useful Commands

```powershell
# Root
npm run dev
npm run build
npm run seed

# Backend
cd server
npm run dev
npm run build
npm run lint
npm run prisma:generate
npm run prisma:push
npm run seed

# Frontend
cd client
npm run dev
npm run build
npm run preview
```
