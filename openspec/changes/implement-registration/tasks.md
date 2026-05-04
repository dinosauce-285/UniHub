## 1. Backend Workshops

- [x] 1.1 Create `WorkshopService` with `list()` to fetch open workshops from Prisma.
- [x] 1.2 Create `WorkshopController` to expose `GET /workshops`.
- [x] 1.3 Add `WorkshopModule` to `AppModule`.

## 2. Backend Registration

- [x] 2.1 Add `RedisModule` and `RedisService` to provide `Redis` connection using `ioredis`.
- [x] 2.2 Create `RegistrationService` logic for slot checking with Redis `DECR` and `INCR`.
- [x] 2.3 Add Prisma transaction to insert `Registration` and decrement `slotLeft` on `Workshop`.
- [x] 2.4 Add `Idempotency-Key` validation and caching in `RegistrationService` with 24h TTL.
- [x] 2.5 Generate QR Code payloads and base64 strings during registration creation.
- [x] 2.6 Create `listForUser` method in `RegistrationService`.
- [x] 2.7 Update `RegistrationController` with real `POST /registrations` and `GET /registrations/me` secured by `JwtAuthGuard` and `RolesGuard`.
- [x] 2.8 Add `RegistrationModule` to `AppModule`.

## 3. Frontend UI

- [x] 3.1 Create `client/src/features/registration/api.ts` for typed API interaction (`fetchWorkshops`, `fetchMyRegistrations`, `registerForWorkshop`).
- [x] 3.2 Add `uuid` dependency to generate `Idempotency-Key` on the client.
- [x] 3.3 Create `StudentWorkspace` component in `client/src/App.tsx`.
- [x] 3.4 Display available workshops, capacities, and a progress bar.
- [x] 3.5 Handle the "Claim seat" action, managing loading state and errors.
- [x] 3.6 Show the user's registrations and display the QR code image.
- [x] 3.7 Add logic to disable the "Claim seat" button if the workshop is full or the user is already registered.

## 4. Verification

- [ ] 4.1 Run Prisma generation and seed against local Docker services.
- [x] 4.2 Build the backend.
- [x] 4.3 Build the frontend.
- [ ] 4.4 Verify atomic slot booking limits with high concurrency scripts.
- [ ] 4.5 Verify idempotency allows retrying the same request safely.
- [ ] 4.6 Verify QR codes are downloadable and structurally correct.
