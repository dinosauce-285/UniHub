# Implementation Tasks: Nightly Student Sync

## 1. Backend Setup
- [ ] 1.1 Install `@nestjs/schedule` and `csv-parse` (if not already installed).
- [ ] 1.2 Import `ScheduleModule.forRoot()` in `AppModule`.
- [ ] 1.3 Create `StudentSyncModule` (`server/src/modules/student-sync`).
- [ ] 1.4 Register Bull Queue for `student-sync` in the module.

## 2. API & Services
- [ ] 2.1 Create `StudentSyncService` with methods to:
  - Trigger job manually.
  - Query `StudentSyncLog` with pagination/sorting.
- [ ] 2.2 Implement `@Cron('0 2 * * *')` inside `StudentSyncService` to enqueue the sync job automatically at 02:00.
- [ ] 2.3 Create `StudentSyncController` with endpoints:
  - `GET /` (returns logs, protected by `ORGANIZER` role).
  - `POST /trigger` (enqueues job manually, protected by `ORGANIZER` role).

## 3. Worker Implementation
- [ ] 3.1 Create `StudentSyncWorker` (`@Processor('student-sync')`).
- [ ] 3.2 Implement `process` method to read a local CSV file (path configured via env `LEGACY_CSV_PATH` or fallback to a dummy file).
- [ ] 3.3 Set up `csv-parse` streaming to read records one by one or in batches.
- [ ] 3.4 Validate each row (email presence, correct format).
- [ ] 3.5 Perform `Prisma.User.upsert` based on `studentId` for each valid row.
- [ ] 3.6 Collect counts of `imported` and `errors`, pushing error details into an array.
- [ ] 3.7 Handle file not found or unreadable errors gracefully.
- [ ] 3.8 On completion (or fatal file error), create a `StudentSyncLog` record via Prisma.

## 4. Frontend Integration
- [ ] 4.1 Create `client/src/lib/studentSyncApi.ts` with methods for fetching logs and triggering sync.
- [ ] 4.2 Create `client/src/pages/organizer/StudentSyncPage.tsx` using existing UI components (e.g., Table, Button, Card).
- [ ] 4.3 Add a table to display sync logs (Date, Filename, Total Rows, Imported, Errors).
- [ ] 4.4 Add an expandable row or modal to view `errorDetails` JSON if errors occurred.
- [ ] 4.5 Add a "Trigger Manual Sync" button in the UI.
- [ ] 4.6 Update the Organizer layout/sidebar to include a link to the "Student Sync" page.

## 5. Testing & Verification
- [ ] 5.1 Place a sample `legacy-students.csv` file with both valid and invalid rows.
- [ ] 5.2 Click "Trigger Manual Sync" from the UI and verify that the job completes successfully.
- [ ] 5.3 Verify that `User` records are correctly inserted or updated in PostgreSQL.
- [ ] 5.4 Check the frontend table to ensure the `StudentSyncLog` displays accurate counts and error messages.
