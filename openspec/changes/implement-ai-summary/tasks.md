# Tasks: AI Summary Implementation

## 1. Backend: API and Queue Setup
- [ ] 1.1 Install dependencies: `@nestjs/bull`, `bull`, `@nestjs/platform-express`, `pdf-parse`, and their types.
- [ ] 1.2 Configure Bull module in `app.module.ts` using Redis URL.
- [ ] 1.3 Create an `AiSummaryQueue` in the Workshops module.
- [ ] 1.4 Add `POST /workshops/:id/ai-summary` endpoint for file upload (`ORGANIZER` only).
- [ ] 1.5 Implement endpoint logic to save the file to a temp directory and enqueue a Bull job.
- [ ] 1.6 Return `202 Accepted` response from the endpoint.

## 2. Backend: Worker Implementation
- [ ] 2.1 Create `AiSummaryProcessor` class decorated with `@Processor()`.
- [ ] 2.2 Implement job handling to read the temporarily stored PDF file.
- [ ] 2.3 Use `pdf-parse` to extract text from the PDF.
- [ ] 2.4 Implement a service to call the chosen AI API (e.g. OpenAI or Gemini) with the extracted text.
- [ ] 2.5 Update the `Workshop` record with the generated summary.
- [ ] 2.6 Configure job retries (up to 3 times) and error handling for AI API failures.
- [ ] 2.7 Clean up the temporary PDF file after processing.

## 3. Frontend: Organizer UI
- [ ] 3.1 Update the Workshop management page to include a "Generate AI Summary" section.
- [ ] 3.2 Add a file input for PDF upload.
- [ ] 3.3 Implement the API call to `POST /workshops/:id/ai-summary`.
- [ ] 3.4 Show success toast when upload succeeds (202 Accepted) and indicate summary generation is pending.

## 4. Frontend: Student UI
- [ ] 4.1 Update the Workshop Details page to display `aiSummary` if it exists.
- [ ] 4.2 Show a "Summary generating..." placeholder if the user is an organizer and the summary is null, or gracefully hide it for students if null.
