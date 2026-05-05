# Implementation Proposal: Nightly Student Sync

## Why
The UniHub system needs to automate the synchronization of student data from the legacy system's CSV export. Instead of manual data entry or uploads, an automated process running nightly at 02:00 will read a legacy CSV dump, import/update `User` records with the `STUDENT` role, and generate a sync report. This ensures that every morning, the system has an up-to-date and accurate list of students eligible to register for workshops.

## What Changes
- **Backend**: 
  - Add `@nestjs/schedule` to trigger a cron job every day at 02:00.
  - Create a `StudentSyncModule` which enqueues a `student-sync` job in Bull Queue.
  - Implement a `StudentSyncWorker` that reads the legacy CSV file (from a configured path), processes it row by row, and upserts students.
  - Create `StudentSyncLog` entries in PostgreSQL to keep a history of sync outcomes.
  - Add API endpoints to fetch the sync history and manually trigger a sync for testing purposes.
- **Frontend**: 
  - Create a new admin page under the organizer view (`StudentSyncPage.tsx`) to display the history of nightly syncs, showing total rows, imported count, errors, and JSON error details.

## Capabilities
- Nightly automated background job running without manual intervention.
- Safe idempotent updates: Uses PostgreSQL `INSERT ... ON CONFLICT (student_id) DO UPDATE` to handle returning and new students.
- Graceful error handling: A single malformed row will not fail the entire batch. Row-level errors are collected and saved in `StudentSyncLog.errorDetails`.
- Observability: Admin UI allows organizers to monitor the health and results of the background sync jobs.

## Impact
Eliminates manual synchronization work. Reduces the risk of students not being able to log in or register due to missing data. Aligns with the system constraint to operate safely without real-time APIs to the legacy system.
