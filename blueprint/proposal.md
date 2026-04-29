# UniHub Workshop Proposal

## Problem

University workshops need a single platform for discovery, registration, payment fallback, QR check-in, and operational monitoring.

## Goals

- Support student discovery and registration for workshops
- Support organizer CRUD and operational dashboards
- Support offline-capable check-in for event staff
- Keep architecture simple enough for a two-person team

## Scope

- Modular monolith with a separate worker process
- PostgreSQL for system-of-record data
- Redis for rate limits, slot counters, idempotency, and queue coordination
- Blueprint specs aligned to delivery priorities in `TASK.MD`

## Risks

- Race conditions in slot claiming if Redis and DB flows drift
- Payment integration instability and retry duplication
- Offline sync conflicts during delayed check-in uploads

