# Student CSV Import Specification

## Purpose
Define how organizers upload CSV files to bulk create student accounts with validation and partial success reporting.

## Requirements

### Requirement: Organizer CSV upload
The system SHALL allow organizers to upload a CSV file to bulk import student accounts.

#### Scenario: Valid CSV upload
- GIVEN an `ORGANIZER` uploads a valid `.csv` file to `POST /students/import`
- WHEN the backend parses the file with `csv-parse`
- THEN valid rows create `User` records with role `STUDENT`
- AND temporary passwords are hashed with `bcrypt`
- AND the response includes `{ created, skipped, errors[] }`

### Requirement: Partial import reporting
The system SHALL report row-level errors without failing the whole import.

#### Scenario: Mixed valid and invalid rows
- GIVEN a CSV contains valid rows and invalid rows
- WHEN the backend imports the file
- THEN valid rows are created
- AND invalid rows are skipped with reasons in `errors[]`
- AND the API returns HTTP 207 Multi-Status

#### Scenario: Duplicate email
- GIVEN a row contains an email that already exists
- WHEN the backend validates that row
- THEN the row is skipped
- AND the report records `email already exists`

### Requirement: Upload validation
The system SHALL reject invalid upload files.

#### Scenario: Non-CSV file
- GIVEN an organizer uploads a `.pdf`
- WHEN the backend validates the MIME type
- THEN the backend returns HTTP 400 "Only CSV files are accepted"

## Constraints
- Implementation MUST cover both backend API/business logic and frontend user-facing flows unless a written proposal explicitly marks one side out of scope.
- Frontend implementation MUST first look for reusable components in `client/src/components`, use the theme setup from `client/src/index.css` and `client/tailwind.config.ts`, and create a shared component only when no suitable component exists.
- Maximum file size is 5 MB.
- Maximum upload size is 1000 rows.
- Access MUST require role `ORGANIZER`.
- Password hashing MUST use bcrypt with cost factor at least 10.
