# Nightly Student Sync Specification

## Purpose
Define how student records are imported from a legacy CSV source on a nightly schedule with row-level error handling.

## Requirements

### Requirement: Nightly CSV sync
The system SHALL automatically import student data from the legacy CSV source at 02:00.

#### Scenario: Valid CSV rows
- GIVEN the latest CSV file is available
- WHEN the Bull cronjob runs at 02:00
- THEN the worker reads each row
- AND upserts valid students into PostgreSQL using `INSERT ... ON CONFLICT (student_id) DO UPDATE`

### Requirement: Row-level error handling
The system SHALL continue processing the sync when individual CSV rows are invalid.

#### Scenario: Malformed row
- GIVEN one row has invalid data
- WHEN the worker processes the CSV
- THEN that row is skipped
- AND the error is recorded in `errorDetails`
- AND following rows continue processing

#### Scenario: Missing or unreadable file
- GIVEN the CSV file is missing or unreadable
- WHEN the sync job runs
- THEN the job fails gracefully
- AND creates a `StudentSyncLog` describing the failure

### Requirement: Sync reporting
The system SHALL record each sync run in `StudentSyncLog`.

#### Scenario: Sync completes
- GIVEN a sync job finishes
- WHEN the worker writes the report
- THEN `StudentSyncLog` contains filename, total rows, imported count, error count, and error details

## Constraints
- Implementation MUST cover both backend API/business logic and frontend user-facing flows unless a written proposal explicitly marks one side out of scope.
- Frontend implementation MUST first look for reusable components in `client/src/components`, use the theme setup from `client/src/index.css` and `client/tailwind.config.ts`, and create a shared component only when no suitable component exists.
- The sync MUST be idempotent and safe to rerun on the same file.
- One row error MUST NOT kill the full batch.
- The scheduled job MUST avoid peak registration hours and run at 02:00.
