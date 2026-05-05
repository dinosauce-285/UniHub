# UniHub Workshop Platform 🎓✨

**UniHub** is a high-performance, resilient event management platform built to handle the massive scale of University "Career and Skill Weeks". 

When 12,000+ students rush to register for limited workshop slots simultaneously, traditional solutions like Google Forms crash, overbook seats, and require slow manual processing. UniHub was engineered from the ground up to solve these specific system design challenges.

## 🌟 Core Features & Technical Architecture

The platform utilizes a **Modular Monolith** architecture (NestJS, React, PostgreSQL, Redis) combined with advanced system design patterns to address real-world bottlenecks:

### 1. 🚀 Massive Concurrency & Slot Contention
- **The Problem:** Thousands of clicks per second. If two students click "Register" at the exact same millisecond for the last available seat, naive database queries will allow both, leading to overbooking.
- **The Architecture:** 
  - **Token Bucket Rate Limiting (Redis):** Throttles API requests (e.g., max 5 requests/30s per user) to protect the backend.
  - **Atomic Slot Claiming:** Instead of relying on slow database row-locks, UniHub uses Redis `DECR` operations on the workshop's slot key. This provides atomic, extremely fast concurrency control. If the value drops below 0, it safely compensates (`INCR`) and returns an HTTP 409. Canonical records and unique constraints are then safely persisted to PostgreSQL.

### 2. 🛡️ Payment Gateway Instability & Double Charges
- **The Problem:** External payment gateways often timeout or fail under heavy load. A hung payment request shouldn't crash the entire university registration system or charge a student twice on retry.
- **The Architecture:**
  - **Circuit Breaker Pattern (`opossum`):** Monitors payment API health. If errors exceed the threshold, the breaker "Opens", instantly failing fast (HTTP 503) instead of waiting for timeouts. This ensures **Graceful Degradation**: paid registrations pause, but free registrations and viewing schedules continue to work flawlessly.
  - **Idempotency Keys:** Every registration generates a UUIDv4 `Idempotency-Key` (cached in Redis for 24h and persisted in PostgreSQL). If a student retries after a network timeout, the system guarantees they will never be registered or charged twice.

### 3. 📱 Offline-First Door Check-in
- **The Problem:** Event venues frequently suffer from dead zones or dropped WiFi. Checking in students using paper lists is chaotic, but a cloud-only app will freeze if the internet drops.
- **The Architecture:** 
  - **PWA with IndexedDB:** A specialized Progressive Web App surface for event staff. When online, QR scans validate instantly via `POST /checkin/validate`. When offline, check-ins are intercepted and stored in the browser's `IndexedDB`.
  - **Idempotent Batch Sync:** Once the device reconnects to the network, the PWA automatically pushes the queue to `POST /checkin/sync`. The backend handles these batch syncs idempotently, guaranteeing no duplicate logs even if the sync is interrupted midway.

### 4. 🤖 Asynchronous Processing (AI Summaries & Emails)
- **The Problem:** Processing large PDF workshop documents via external AI APIs (Anthropic/Groq) or sending thousands of confirmation emails synchronously will block HTTP threads and slow down the API.
- **The Architecture:**
  - **Redis-backed BullMQ Workers:** The NestJS API acts only as a producer, instantly returning a 202 Accepted response. Separate worker processes consume the queue.
  - **Pipe-and-Filter Pattern:** The AI Summary pipeline is broken into independent, retryable steps (Extract Text -> Clean -> Call AI -> Save to PostgreSQL), maximizing reliability.

## Blueprint Documentation 🏛️

The `blueprint/` directory serves as the centralized source of truth for the project's technical architecture, product requirements, and feature specifications:
- **`proposal.md`**: The high-level product vision, defining the problem, goals, scope, and user roles.
- **`design.md`**: The technical design document detailing the Monolith architecture, database schema, System C4 diagrams, and Architectural Decision Records (ADRs).
- **`specs/`**: Contains detailed functional specifications for individual features (e.g., `checkin`, `registration`, `student-sync`). All new feature implementations must align with these specs.

## Quick start

1. Copy `.env.example` to `.env`.
2. Start infrastructure:
   `docker compose up -d`
3. Install dependencies:
   `cd server && npm install`
   `cd ../client && npm install`
4. Create database schema:
   `cd ../server && npm run prisma:push`
5. Seed sample data:
   `npm run seed`
6. Run apps:
   `npm run start:dev`
   `cd ../client && npm run dev`

## AI Configuration (Groq)

To test the AI Summary feature when uploading workshop PDFs, you need a free Groq API key:

1. Visit [console.groq.com/keys](https://console.groq.com/keys) to sign up and generate an API key.
2. Open your `.env` (and `server/.env`) file and set the key:
   `GROQ_API_KEY=your_key_here`

## Useful URLs

- API: `http://localhost:3000`
- Frontend: `http://localhost:5173`
- MailHog: `http://localhost:8025`

## Demo Credentials

After running `npm run seed` in `server/`, all seeded users use password `Password123!`.

- Student: `student1@unihub.local`
- Organizer: `organizer1@unihub.local`
- Check-in staff: `checkin1@unihub.local`
