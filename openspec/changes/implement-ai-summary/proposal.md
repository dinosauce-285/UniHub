# Proposal: AI Summary Implementation

## Why
Organizers often have workshop materials (like PDFs) but lack concise summaries for students. Automating this summary generation saves time and provides consistent context for prospective attendees.

## What Changes
We will introduce an endpoint for organizers to upload a PDF. A background worker will process the PDF, extract text using `pdf-parse`, and interact with an AI model to generate a summary. The summary will be stored in the `aiSummary` field of the workshop.

## Capabilities
- **Background Processing**: Jobs are handled by Bull queue to ensure non-blocking HTTP requests.
- **Resilience**: The system supports retries (up to 3 times) for transient AI model API failures.
- **Graceful Degradation**: Students can still browse workshops even if AI summary generation is pending or has failed.

## Impact
- **Organizer UX**: Seamless experience with fast HTTP 202 responses on upload.
- **Student UX**: Better workshop descriptions available automatically.
- **System**: Minor increased load from PDF processing and AI API interactions, managed via queue.
