# Student Sync Spec

## Description

Imports student records from CSV in a batch job and logs failures for later review.

## Main flow

1. Scheduler or admin upload triggers a sync job.
2. Worker parses CSV rows sequentially.
3. Each student row is upserted into the database.
4. Errors are counted and stored in sync logs.

## Error scenarios

- Malformed CSV row
- Duplicate or missing identifiers
- Database write failure

## Constraints

- Import should be safe to rerun on the same file
- Error reporting must preserve enough detail for debugging

## Acceptance criteria

- Valid rows are upserted idempotently
- Sync logs reflect totals, successes, and errors
