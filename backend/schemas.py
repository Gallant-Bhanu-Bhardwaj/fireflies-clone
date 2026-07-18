from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel


# ── Participant ────────────────────────────────────────────────────────────────

class ParticipantBase(BaseModel):
    name: str

class ParticipantCreate(ParticipantBase):
    pass

class Participant(ParticipantBase):
    id: int

    model_config = {"from_attributes": True}


# ── User ───────────────────────────────────────────────────────────────────────

class UserBase(BaseModel):
    name: str
    email: str

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int

    model_config = {"from_attributes": True}


# ── TranscriptSegment ──────────────────────────────────────────────────────────

class TranscriptSegmentBase(BaseModel):
    speaker_name: str
    start_time: float
    end_time: float
    text: str
    order_index: int

class TranscriptSegmentCreate(TranscriptSegmentBase):
    meeting_id: int

class TranscriptSegment(TranscriptSegmentBase):
    id: int
    meeting_id: int

    model_config = {"from_attributes": True}


# ── Summary ────────────────────────────────────────────────────────────────────

class SummaryBase(BaseModel):
    overview_text: str
    key_topics: List[str]

class SummaryCreate(SummaryBase):
    meeting_id: int

class Summary(SummaryBase):
    id: int
    meeting_id: int

    model_config = {"from_attributes": True}


# ── ActionItem ─────────────────────────────────────────────────────────────────

class ActionItemBase(BaseModel):
    text: str
    assignee: Optional[str] = None
    is_completed: bool = False
    due_date: Optional[date] = None

class ActionItemCreate(ActionItemBase):
    meeting_id: int

class ActionItemUpdate(BaseModel):
    # All fields optional so callers can PATCH only what changed
    text: Optional[str] = None
    assignee: Optional[str] = None
    is_completed: Optional[bool] = None
    due_date: Optional[date] = None

class ActionItem(ActionItemBase):
    id: int
    meeting_id: int

    model_config = {"from_attributes": True}


# ── Meeting ────────────────────────────────────────────────────────────────────

class MeetingBase(BaseModel):
    title: str
    date: datetime
    duration_seconds: int
    tags: List[str] = []

class MeetingCreate(MeetingBase):
    # owner_id defaults to 1 (single demo user — no real auth)
    owner_id: int = 1
    participant_ids: List[int] = []

class MeetingList(MeetingBase):
    """Lightweight shape returned in list views — no nested children."""
    id: int
    created_at: datetime
    owner: User
    participants: List[Participant] = []

    model_config = {"from_attributes": True}

class MeetingDetail(MeetingList):
    """Full shape returned for a single meeting — includes all nested data."""
    transcript_segments: List[TranscriptSegment] = []
    summary: Optional[Summary] = None
    action_items: List[ActionItem] = []


# ── Search ─────────────────────────────────────────────────────────────────────

class SearchResultSegment(BaseModel):
    id: int
    speaker_name: str
    start_time: float
    text: str

class SearchResult(BaseModel):
    """One meeting's worth of matches — title hit and/or matching transcript lines."""
    meeting_id: int
    meeting_title: str
    title_match: bool
    segment_matches: List[SearchResultSegment] = []
