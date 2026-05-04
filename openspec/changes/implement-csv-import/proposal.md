## Why

Organizers need to bulk create student accounts from legacy system exports. Creating these manually is too slow and error-prone, especially before large events. An automated CSV import flow allows organizers to quickly onboard students so they can register for workshops.

## What Changes

- Add a new `POST /students/import` endpoint to accept `.csv` file uploads.
- Integrate `csv-parse` to handle parsing the uploaded buffer.
- Add logic to validate rows, check for duplicate emails, and hash passwords using `bcrypt`.
- Return a 207 Multi-Status summary report detailing created accounts, skipped rows, and specific validation errors.
- Add a new "Import Students" UI component in the Admin panel for `ORGANIZER` users.

In scope:
- Backend CSV parsing and batch insertion in NestJS.
- Frontend CSV file selection and upload UI in React.
- Error reporting for partial successes.

Out of scope:
- Background worker processing (the limit of 1000 rows allows synchronous processing).
- Exporting data back to the legacy system.

Key risks:
- Synchronous processing of large files blocking the event loop. This is mitigated by enforcing a strict 1000 row limit and a 5MB maximum file size.

## Capabilities

### New Capabilities
- `csv-import`: Organizers can upload a `.csv` file to bulk import student accounts and receive a detailed row-by-row success/failure report.

### Modified Capabilities
- None.

## Impact

- Backend modules: `server/src/modules/users` (or `students`), `server/package.json` (new dependencies).
- Frontend modules: `client/src/pages/admin/`, `client/src/services/api.ts`.
- Database: Insert multiple `User` records with `role='STUDENT'`.
- APIs: `POST /students/import` accepts `multipart/form-data` and returns `207 Multi-Status` on partial success.
