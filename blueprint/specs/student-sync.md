# Specification: Nightly Student Sync

## Description
Automatically imports student data from a CSV file from the legacy Student Management System at midnight, with Dead Letter Queue style error recording.

## Main Flow
1. A Bull Queue cronjob triggers at 02:00.
2. The async worker loads the latest CSV file and iterates through each row.
3. Each valid row is written to PostgreSQL through an UPSERT statement (`INSERT ... ON CONFLICT (student_id) DO UPDATE`).
4. Malformed rows are recorded in the `errorDetails` array instead of throwing an exception that interrupts the run.
5. A report is written to `StudentSyncLog` with total rows, imported rows, and error details.

## Error Scenarios
- **Missing or unreadable CSV file**: The job fails gracefully and creates a `StudentSyncLog` with total errors equal to total rows.
- **Error in a specific row**: That row is skipped, the error is recorded, and processing continues for the following rows (Dead Letter Queue pattern).
- **Duplicate student (`student_id`)**: The UPSERT statement automatically updates the latest information without conflict (No Error).

## Constraints
- The import process must be safe to rerun on the same old file multiple times (idempotent upsert).
- A local error in one CSV row must not kill the entire sync batch.
- The cron schedule must avoid peak registration hours and is fixed at 02:00.

## Acceptance Criteria
- CSV data is imported automatically without duplicate records, even when the cronjob runs repeatedly on the same file.
- `StudentSyncLog` reports fully and accurately, helping Admins monitor dirty data.
- Admins can manually trigger this sync from the internal interface.
