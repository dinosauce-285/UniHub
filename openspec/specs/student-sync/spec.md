# Student Sync Specification

## Purpose
Imports student records from a nightly CSV export in a Batch Sequential job, with error logging and safe re-run semantics.

## Requirements

### Requirement: Scheduled CSV Import
The system SHALL run a Bull Queue cronjob at 02:00 to import the latest student CSV.

#### Scenario: Successful batch import
- GIVEN a valid CSV file exported by the legacy student management system
- WHEN the cronjob runs at 02:00
- THEN each row is parsed and upserted via `INSERT ... ON CONFLICT (student_id) DO UPDATE`
- AND a StudentSyncLog record is created with `totalRows`, `imported`, `errors` counts

#### Scenario: File not found or unreadable
- GIVEN the expected CSV path does not exist or is unreadable
- WHEN the job runs
- THEN the job fails gracefully
- AND a StudentSyncLog entry is created with `errors = totalRows` and a descriptive errorDetails

### Requirement: Row-Level Error Handling (Dead Letter Queue)
The system SHALL log individual row failures without stopping the entire import.

#### Scenario: Malformed row
- GIVEN a CSV with a malformed row (missing required field or invalid format)
- WHEN the row is processed
- THEN the row is skipped and its error is recorded in `errorDetails` (Dead Letter pattern)
- AND processing continues with subsequent rows

#### Scenario: Duplicate student_id
- GIVEN a student who already exists in the database
- WHEN the CSV row is processed
- THEN the existing record is updated (upsert) without error

### Requirement: Safe Re-run
The system SHALL allow the same CSV to be imported multiple times without creating duplicate records.

#### Scenario: Re-run on same file
- GIVEN a file that was successfully imported yesterday
- WHEN it is imported again today (no changes)
- THEN all rows are upserted with no net data change
- AND a new StudentSyncLog entry is created showing the re-run

### Requirement: Manual Admin Trigger
The system SHALL allow an admin to manually trigger a CSV import without waiting for the scheduled job.

#### Scenario: Manual upload
- GIVEN an admin uploads a CSV file via the admin UI
- WHEN the upload is submitted
- THEN a sync job is enqueued immediately in Bull
- AND the admin can view the resulting StudentSyncLog entry

## Constraints
- Import MUST use upsert semantics — safe to rerun on the same file
- Individual row errors MUST NOT abort the entire batch
- Cronjob MUST NOT run during peak registration hours (scheduled for 02:00)

## Acceptance Criteria
- Valid rows are upserted idempotently across multiple runs
- StudentSyncLog reflects accurate totals, success count, and per-error details
- Manual trigger from admin panel enqueues a job immediately
