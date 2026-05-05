# AI Summary Specification

## Purpose
Define how organizers generate workshop summaries from uploaded PDFs through a non-blocking AI background job.

## Requirements

### Requirement: Async AI summary generation
The system SHALL generate workshop AI summaries from uploaded PDFs through a background job.

#### Scenario: Organizer uploads PDF
- GIVEN an `ORGANIZER` uploads a PDF to `POST /workshops/:id/ai-summary`
- WHEN the API receives the file
- THEN the file is stored temporarily
- AND the API returns HTTP 202 Accepted
- AND a Bull Queue job is created

#### Scenario: Worker generates summary
- GIVEN an AI summary job is queued
- WHEN the worker processes the job
- THEN it extracts raw text with `pdf-parse`
- AND sends cleaned text to the AI model API
- AND stores the generated summary in `Workshop.aiSummary`

### Requirement: Non-blocking AI failures
The system SHALL keep workshop browsing available while AI summary generation is pending or failing.

#### Scenario: AI API outage
- GIVEN the AI API is unavailable
- WHEN the worker attempts summary generation
- THEN the job retries up to 3 times
- AND `Workshop.aiSummary` may remain `null`
- AND students can still browse the workshop page

## Constraints
- Implementation MUST cover both backend API/business logic and frontend user-facing flows unless a written proposal explicitly marks one side out of scope.
- Frontend implementation MUST first look for reusable components in `client/src/components`, use the theme setup from `client/src/index.css` and `client/tailwind.config.ts`, and create a shared component only when no suitable component exists.
- AI calls MUST run in an async queue and never block the client HTTP request.
- Uploading PDFs for AI summary MUST require role `ORGANIZER`.
- `pdf-parse` MUST be used as the input text extraction filter.
