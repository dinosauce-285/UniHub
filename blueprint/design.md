# UniHub Workshop Design

## Architecture

- Frontend: React + Vite with student, admin, and check-in surfaces
- Backend: NestJS modular monolith following controller-service-repository layering
- Infrastructure: PostgreSQL, Redis, MailHog via Docker Compose
- Workers: Bull-based async processing for notification, sync, and AI summary jobs

## Module map

- `auth`: JWT and RBAC guard flow
- `workshop`: workshop CRUD and slot metadata
- `registration`: slot claiming, QR generation, idempotency
- `payment`: gateway abstraction with circuit breaker
- `checkin`: QR validation and offline sync ingestion
- `notification`: email and app notification jobs
- `student-sync`: batch CSV import and error logging
- `ai-summary`: PDF extraction and summarization pipeline

## Data notes

- PostgreSQL stores canonical users, workshops, registrations, and sync logs
- Redis stores volatile counters and operational coordination state
- Slots shown to users may be eventually consistent, while registration writes remain strongly consistent

