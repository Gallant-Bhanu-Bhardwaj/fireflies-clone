// Mirrors backend/schemas.py::MeetingList — keep in sync with that shape.

export interface Owner {
  id: number;
  name: string;
  email: string;
}

export interface Participant {
  id: number;
  name: string;
}

export interface Meeting {
  id: number;
  title: string;
  date: string; // ISO datetime string
  duration_seconds: number;
  created_at: string;
  owner: Owner;
  participants: Participant[];
  tags: string[];
}

// Mirrors backend/schemas.py::TranscriptSegment
export interface TranscriptSegment {
  id: number;
  meeting_id: number;
  speaker_name: string;
  start_time: number; // seconds from meeting start
  end_time: number;
  text: string;
  order_index: number;
}

// Mirrors backend/schemas.py::Summary
export interface Summary {
  id: number;
  meeting_id: number;
  overview_text: string;
  key_topics: string[];
}

// Mirrors backend/schemas.py::ActionItem
export interface ActionItem {
  id: number;
  meeting_id: number;
  text: string;
  assignee: string | null;
  is_completed: boolean;
  due_date: string | null; // ISO date string
}

// Mirrors backend/schemas.py::MeetingDetail — GET /meetings/{id} returns all
// nested data in one response, so the detail page needs only a single fetch.
export interface MeetingDetail extends Meeting {
  transcript_segments: TranscriptSegment[];
  summary: Summary | null;
  action_items: ActionItem[];
}

// Mirrors backend/schemas.py::SearchResultSegment / SearchResult
export interface SearchResultSegment {
  id: number;
  speaker_name: string;
  start_time: number;
  text: string;
}

export interface SearchResult {
  meeting_id: number;
  meeting_title: string;
  title_match: boolean;
  segment_matches: SearchResultSegment[];
}
