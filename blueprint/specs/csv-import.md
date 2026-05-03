# Specification: Student CSV Import (Organizer Upload)

## Description
A feature for organizers to upload a CSV file and import student accounts in bulk. The endpoint validates each row, saves valid rows, and returns a report of invalid rows without crashing the entire task.

## Main Flow
1. The organizer selects a `.csv` file and clicks Import to send it to `POST /students/import` via `multipart/form-data`.
2. The backend uses the `csv-parse` library to parse the file contents.
3. Each row is checked for missing required fields, valid email format, and whether the email already exists.
4. For valid rows: generate a temporary password, hash it with `bcrypt`, and create a `User` with role `STUDENT`.
5. Return a JSON summary for the UI: `{ created, skipped, errors[] }`.

## Error Scenarios
- **Invalid file format**: If the file is not a valid CSV MIME type (for example `.pdf`), throw HTTP 400 "Only CSV files are accepted".
- **Missing important columns or invalid email in a row**: Skip that row, add the row error and reason to `errors[]`, and continue with the other rows.
- **Existing duplicate email**: Similarly, record "email already exists" in the report array. This row is skipped.

## Constraints
- Maximum file size is 5 MB, with at most 1000 rows per upload.
- Passwords must be hashed with bcrypt (cost factor >= 10) before insertion into the DB.
- Access must be strictly protected by role `ORGANIZER` through a NestJS Guard.

## Acceptance Criteria
- Importing 100 valid rows creates 100 clean student records.
- When a CSV contains both valid and invalid rows, the API returns HTTP 207 Multi-Status with a report that clearly lists broken rows and successfully created rows.
- Access is rejected with HTTP 403 for users who are not ORGANIZER.
