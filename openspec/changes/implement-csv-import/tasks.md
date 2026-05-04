## 1. Backend CSV Import

- [x] 1.1 Add `csv-parse` and `@types/multer` dependencies to `server/package.json` (`pnpm add csv-parse` and `pnpm add -D @types/multer`).
- [x] 1.2 Create `StudentController` or add to `UserController` to expose `POST /students/import` or `POST /users/import`.
- [x] 1.3 Add `@UseGuards(JwtAuthGuard, RolesGuard)` and `@Roles('ORGANIZER')` to the endpoint to restrict access.
- [x] 1.4 Use `@UseInterceptors(FileInterceptor('file'))` to handle the file upload.
- [x] 1.5 Add a custom Pipe or validation logic to reject non-`text/csv` files with a `400` error and enforce a 5MB size limit.
- [x] 1.6 Create logic in `StudentService` (or `UserService`) to parse the CSV buffer using `csv-parse`.
- [x] 1.7 Enforce a limit of 1000 rows during the import process.
- [x] 1.8 Iterate over each row to validate required fields (e.g., `email`) and check for duplicate emails using Prisma (`User` table).
- [x] 1.9 Hash temporary passwords using `bcrypt` (with a cost of 10) for valid records and insert them into the database with the `STUDENT` role.
- [x] 1.10 Collect skipped rows and reasons (e.g., "email already exists") and return a summary object `{ created: number, skipped: number, errors: string[] }`.
- [x] 1.11 Return HTTP `207 Multi-Status` if there is a mix of valid and invalid rows.

## 2. Frontend UI

- [x] 2.1 Add API integration in `client/src/services/api.ts` (or equivalent) to `POST` `FormData` to `/students/import`.
- [x] 2.2 Create or update an Admin page (`client/src/pages/admin/StudentsPage.tsx` or similar).
- [x] 2.3 Ensure the UI is accessible only to users with the `ORGANIZER` role.
- [x] 2.4 Create a file upload component restricted to `.csv` files (`<input type="file" accept=".csv" />`).
- [x] 2.5 Submit the file and handle loading states.
- [x] 2.6 Display a detailed result summary to the organizer, showing the number of created students, skipped rows, and the list of specific error messages.
- [x] 2.7 Properly handle edge cases like `400 Bad Request` or `413 Payload Too Large`.

## 3. Verification

- [ ] 3.1 Verify that only files with `.csv` extension and `text/csv` MIME type are accepted.
- [ ] 3.2 Verify that uploading a file larger than 5MB fails.
- [ ] 3.3 Verify that a file with more than 1000 rows fails or truncates.
- [ ] 3.4 Verify that rows with duplicate emails are skipped and accurately reported in the `errors` array.
- [ ] 3.5 Verify that valid rows correctly create `User` records with the `STUDENT` role and a hashed password.
