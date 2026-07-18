# Fireflies.ai Clone

## 1. Overview

This is a clone of Fireflies.ai's meeting library and meeting detail experience, built as an SDE take-home assignment. It provides a dashboard of recorded meetings with search, sorting, and tag filtering; a meeting detail page with a synced transcript/media player, AI-style summary, and action items; full CRUD for meetings and action items via modals; a global command-palette search across meeting titles and transcript text; and a dark mode toggle. There is no real authentication (a single hardcoded demo user) and no real speech-to-text — all meeting data is seeded or entered manually/pasted by the user.

## 2. Tech Stack

| Layer    | Technology |
|----------|------------|
| Frontend | Next.js 16 (App Router, TypeScript), Tailwind CSS v4 |
| Backend  | FastAPI (Python 3.13) |
| Database | SQLite, accessed via SQLAlchemy ORM |

## 3. Setup Instructions

Run these from the project root, in two terminals (backend first, then frontend).

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python seed.py                  # creates fireflies.db and seeds mock data
uvicorn main:app --reload --port 8000
```

The API is now running at `http://localhost:8000` (interactive docs at `http://localhost:8000/docs`).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app is now running at `http://localhost:3000`.

> The frontend calls the backend at a hardcoded `http://localhost:8000` (see `frontend/app/lib/api.ts`), and the backend's CORS config only allows `http://localhost:3000` (see `backend/main.py`). Both must be running, on these exact ports, for the app to work.

## 4. Architecture Overview

**Communication:** The frontend is a client-rendered Next.js app that talks to the backend exclusively over plain `fetch()` calls to REST JSON endpoints — there is no server-side rendering of data, no GraphQL, and no websockets. `frontend/app/lib/api.ts` centralizes the API base URL and a couple of shared request helpers (participant resolution, search); everything else calls `fetch` directly against `http://localhost:8000`. The backend has no session/auth layer — every request implicitly acts as the single seeded demo user (`id=1`).

**Backend folder structure** (`/backend`):
```
main.py                 FastAPI app setup, CORS, router registration, table creation
database.py             SQLAlchemy engine/session setup
models.py               SQLAlchemy ORM models (source of truth for table structure)
schemas.py              Pydantic request/response models
seed.py                 Drops, recreates, and seeds all tables with mock data
routers/
  meetings.py           /meetings — list/get/create/update/delete
  transcripts.py        /meetings/{id}/transcript — read/bulk-add segments
  action_items.py       /meetings/{id}/action-items, /action-items/{id}
  participants.py       /participants — get-or-create by name
  search.py             /search — cross-meeting title + transcript search
```
One router file per resource, matching the models/schemas split.

**Frontend folder structure** (`/frontend/app`):
```
page.tsx                Dashboard: meeting grid, search, sort, tag filters
meetings/[id]/page.tsx  Meeting detail: player, transcript, summary/action items/topics tabs
layout.tsx              Root layout: fonts, dark-mode init script, context providers
globals.css             Tailwind import + dark-mode variant/theme variables
types.ts                Shared TypeScript types mirroring backend/schemas.py
components/             One component per UI concern (MeetingCard, TranscriptLine,
                         ActionItemRow, Modal, ToastProvider, ThemeProvider, etc.)
hooks/useTranscriptSync.ts   Player <-> transcript sync (active segment, seek, play state)
lib/                    api.ts (fetch helpers), format.ts (dates/durations), 
                         highlight.tsx (search-match highlighting), transcript.ts (paste parser)
```

## 5. Database Schema

**users**

| Column | Type | Notes |
|--------|------|-------|
| id     | int  | Primary key |
| name   | text | |
| email  | text | |

**meetings**

| Column           | Type     | Notes |
|------------------|----------|-------|
| id               | int      | Primary key |
| title            | text     | |
| date             | datetime | |
| duration_seconds | int      | |
| created_at       | datetime | Default: now |
| owner_id         | int      | FK → users.id |
| tags             | JSON     | List of strings, e.g. `["sales", "onboarding"]` |

**participants**

| Column | Type | Notes |
|--------|------|-------|
| id     | int  | Primary key |
| name   | text | |

**meeting_participants** (join table, many-to-many)

| Column         | Type | Notes |
|----------------|------|-------|
| meeting_id     | int  | FK → meetings.id |
| participant_id | int  | FK → participants.id |

**transcript_segments**

| Column       | Type  | Notes |
|--------------|-------|-------|
| id           | int   | Primary key |
| meeting_id   | int   | FK → meetings.id |
| speaker_name | text  | |
| start_time   | float | Seconds from meeting start |
| end_time     | float | Seconds from meeting start |
| text         | text  | |
| order_index  | int   | Playback order |

**summaries**

| Column        | Type | Notes |
|---------------|------|-------|
| id            | int  | Primary key |
| meeting_id    | int  | FK → meetings.id, unique (1:1) |
| overview_text | text | |
| key_topics    | JSON | List of strings |

**action_items**

| Column       | Type    | Notes |
|--------------|---------|-------|
| id           | int     | Primary key |
| meeting_id   | int     | FK → meetings.id |
| text         | text    | |
| assignee     | text    | Nullable |
| is_completed | boolean | Default: false |
| due_date     | date    | Nullable |

**Relationships**
- One `meeting` → many `transcript_segments` (1:N)
- One `meeting` → one `summary` (1:1)
- One `meeting` → many `action_items` (1:N)
- `meetings` ↔ `participants` (M:N via `meeting_participants`)
- One `user` → many `meetings` (1:N, via `owner_id`)

## 6. API Endpoints

| Method | Path                              | Description |
|--------|------------------------------------|--------------|
| GET    | `/`                                | Health check |
| GET    | `/meetings`                        | List meetings — supports `search`, `meeting_date`, `participant_id`, `sort` query params |
| GET    | `/meetings/{meeting_id}`           | Get one meeting, including transcript, summary, and action items |
| POST   | `/meetings`                        | Create a meeting |
| PUT    | `/meetings/{meeting_id}`           | Full update of a meeting's title/date/duration/tags/participants |
| DELETE | `/meetings/{meeting_id}`           | Delete a meeting (cascades to its segments, summary, action items) |
| GET    | `/meetings/{meeting_id}/transcript`| List a meeting's transcript segments in playback order |
| POST   | `/meetings/{meeting_id}/transcript`| Bulk-add transcript segments to a meeting |
| GET    | `/meetings/{meeting_id}/action-items` | List a meeting's action items |
| POST   | `/meetings/{meeting_id}/action-items` | Create an action item on a meeting |
| PUT    | `/action-items/{item_id}`         | Partial update of an action item (e.g. toggle `is_completed`) |
| DELETE | `/action-items/{item_id}`         | Delete an action item |
| GET    | `/participants`                   | List all participants |
| POST   | `/participants`                   | Get-or-create a participant by name (case-insensitive) |
| GET    | `/search?q=`                      | Search meeting titles and transcript text, grouped by meeting |

## 7. Assumptions & Mocked Features

- **No real authentication.** There is no login flow; every request acts as a single hardcoded demo user (`id=1`, "Demo User"). `owner_id` defaults to `1` wherever it's needed.
- **No real transcription.** Transcripts are either seeded mock data or entered by the user via the "New Meeting" modal — either pasted as raw `Speaker: text` lines (parsed into segments with mocked, evenly-spaced timestamps) or left empty via the manual form. No audio is ever actually transcribed.
- **The audio player is a placeholder.** There is no real recording file behind any meeting. The `<audio>` element renders with no `src`, and playback (the seek bar, current time, and the transcript's auto-highlighting of the "active" line) is driven by a simulated clock, not real media playback. If a real audio file were wired up as the `src`, the same UI would work by swapping the simulated clock for the element's native `timeupdate` event — this fallback is called out in code comments in `useTranscriptSync.ts`.
- **Duration for manually-created meetings defaults to 0** since the manual form doesn't collect a duration and there's no recording to measure.

## 8. Bonus Features Implemented

- **Full meeting CRUD via modals** — "New Meeting" (with Paste Transcript and Manual Form tabs), Edit (title + participants), and Delete (with confirmation), all backed by a shared `Modal` component.
- **Action item management** — add, toggle complete, and delete, each with optimistic UI updates and toast feedback.
- **Toast notifications** — a small context-based `ToastProvider`, no external library, used for success/error feedback across every mutation.
- **Transcript search with highlighting** — an in-panel search box highlights matches in the transcript without hiding non-matching lines, and scrolls to the first match.
- **Global command-palette search** — a navbar search icon opens a modal that searches meeting titles *and* transcript text across all meetings, grouped by meeting, and jumps straight to (and scrolls/seeks to) the matching line.
- **Tags** — meetings can be tagged on creation, and the dashboard shows tags as clickable filter chips (multi-select, OR logic).
- **Dark mode** — a manual light/dark toggle persisted to `localStorage`, with a flash-free pre-paint init script and full `dark:` styling across the app.
- **Click-to-seek transcript** — clicking any transcript line seeks the (simulated) player to that line's timestamp, and the currently-"playing" line auto-highlights.
