# Design: AI Summary Implementation

## Overview
This feature relies on a worker-queue pattern. When a PDF is uploaded, a job is added to a Redis-backed Bull queue. A worker then processes this job by reading the file, parsing it with `pdf-parse`, calling the AI API, and finally updating the database.

## Flow

```mermaid
sequenceDiagram
    participant O as Organizer
    participant API as NestJS API
    participant Q as Bull Queue
    participant W as Bull Worker
    participant AI as AI Model API
    participant DB as Database

    O->>API: POST /workshops/:id/ai-summary (PDF)
    API->>API: Verify Organizer Role
    API->>API: Temporarily store file
    API->>Q: Add AI Summary Job
    API-->>O: 202 Accepted
    
    Q->>W: Process Job
    W->>W: Read PDF & run `pdf-parse`
    W->>AI: Send extracted text for summary
    AI-->>W: Return generated summary
    W->>DB: Update Workshop.aiSummary
```

## Module Mapping
- **`server/src/workshops/`**:
  - Add file upload endpoint `POST /:id/ai-summary`.
  - Add `@nestjs/bull` queue integration.
- **`server/src/ai-summary/`** (or worker module):
  - Bull queue processor `AiSummaryProcessor`.
  - Logic to use `pdf-parse` and call AI model.
- **`client/src/pages/WorkshopDetails/`**:
  - UI for Organizers to upload the PDF.
  - UI for Students to read the `aiSummary` if it exists.
  - Loading state indicator for pending summaries.
