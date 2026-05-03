# Specification: AI Summary

## Description
An automated analysis process that extracts text from PDF documents and generates a summary introduction for a Workshop detail page through a third-party AI API.

## Main Flow
1. The organizer uploads a PDF document to `POST /workshops/:id/ai-summary`.
2. The file is stored temporarily, the API immediately responds with HTTP 202 (Accepted), and a background job is placed into Bull Queue.
3. In the background, the worker pulls the job and uses `pdf-parse` to extract raw text from the PDF.
4. The worker cleans the text and sends the chunked content to the AI Model API (Pipe-and-Filter pattern).
5. The AI summary response is saved directly to `Workshop.aiSummary`.

## Error Scenarios
- **AI API outage or overload**: The worker fails the job, and it is configured to retry up to 3 times.
- **While waiting**: The `aiSummary` field remains empty (`null`). The student browsing experience is not blocked.

## Constraints
- Calling AI is especially slow, so it must run in an Async Queue. Never call it directly inside the client's HTTP request.
- Upload permission for this feature is only available to the `ORGANIZER` role.
- Use `pdf-parse` as the input filter to extract text before passing it to the AI model.

## Acceptance Criteria
- Return HTTP 202 quickly when Admin clicks Upload. Students can continue viewing workshops normally.
- In the background, the AI Summary is generated and successfully inserted into the database a few seconds or minutes later.
