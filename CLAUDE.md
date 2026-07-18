# Project: Fireflies.ai Clone (SDE Assignment)

## Stack
- Frontend: Next.js 14 (TypeScript, App Router), Tailwind CSS
- Backend: FastAPI (Python), SQLite via SQLAlchemy
- No real auth — single default user (id=1, "Demo User"). No real transcription — data is seeded/mocked.

## Structure
- /frontend  -> Next.js app (App Router)
- /backend   -> FastAPI app
  - main.py
  - database.py
  - models.py
  - schemas.py
  - seed.py
  - routers/meetings.py
  - routers/transcripts.py
  - routers/action_items.py

## Conventions
- Keep components small and named clearly (MeetingCard, TranscriptLine, ActionItemRow, SummaryPanel)
- Backend: one router file per resource
- Add short comments explaining WHY a decision was made, not just what the code does — I need to explain this in an interview
- Prefer readable code over clever/compressed code
- Use Tailwind utility classes directly; no CSS-in-JS libraries

## Database Schema (source of truth — implement exactly this, ask me before changing it)

**users**
- id (int, PK)
- name (text)
- email (text)

**meetings**
- id (int, PK)
- title (text)
- date (datetime)
- duration_seconds (int)
- created_at (datetime, default now)
- owner_id (FK -> users.id)

**participants**
- id (int, PK)
- name (text)

**meeting_participants** (join table, many-to-many)
- meeting_id (FK -> meetings.id)
- participant_id (FK -> participants.id)

**transcript_segments**
- id (int, PK)
- meeting_id (FK -> meetings.id)
- speaker_name (text)
- start_time (float, seconds)
- end_time (float, seconds)
- text (text)
- order_index (int)

**summaries**
- id (int, PK)
- meeting_id (FK -> meetings.id, unique)
- overview_text (text)
- key_topics (JSON, list of strings)

**action_items**
- id (int, PK)
- meeting_id (FK -> meetings.id)
- text (text)
- assignee (text, nullable)
- is_completed (boolean, default false)
- due_date (date, nullable)

## Relationships
- One meeting → many transcript_segments (1:N)
- One meeting → one summary (1:1)
- One meeting → many action_items (1:N)
- Meetings ↔ participants (M:N via meeting_participants)