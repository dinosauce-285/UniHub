# AI Summary Specification

## Purpose
Automated pipeline that extracts text from uploaded PDF workshop materials and generates an AI summary displayed on the workshop detail page.

## Requirements

### Requirement: PDF Upload and Processing
The system SHALL allow ORGANIZER users to upload a PDF for a workshop and trigger async summarization.

#### Scenario: PDF uploaded
- GIVEN an authenticated ORGANIZER
- WHEN they upload a PDF file to `POST /workshops/:id/ai-summary`
- THEN the file is saved temporarily
- AND a Bull job is enqueued for processing
- AND HTTP 202 Accepted is returned immediately

#### Scenario: Text extraction
- GIVEN a Bull job with a PDF path
- WHEN the worker processes the job
- THEN `pdf-parse` extracts and cleans the raw text

### Requirement: AI Summarization Pipeline
The system SHALL pipe extracted text through an AI model API to generate a summary (Pipe-and-Filter pattern).

#### Scenario: Summary generated
- GIVEN clean extracted text from a PDF
- WHEN it is sent to the AI model API
- THEN a summary is returned and stored in `Workshop.aiSummary`
- AND the workshop detail endpoint returns the summary immediately

#### Scenario: AI API failure
- GIVEN the AI API is unavailable
- WHEN the Bull job runs
- THEN the job fails and is retried up to 3 times
- AND `Workshop.aiSummary` remains null until a successful attempt

## Constraints
- AI processing MUST be async via Bull Queue — never blocks the API
- `pdf-parse` is used for text extraction; AI call follows as next pipeline stage
- ORGANIZER role MUST be required to trigger uploads

## Acceptance Criteria
- After a successful upload and processing, `aiSummary` appears on the workshop detail page
- API responds 202 immediately on upload; students are not blocked waiting for AI
