from sqlalchemy import (
    Boolean, Column, DateTime, Float, ForeignKey,
    Integer, String, Text, Date, func
)
from sqlalchemy.orm import relationship
from sqlalchemy.types import JSON

from database import Base


# Many-to-many join table — no ORM class needed, just a Table object
meeting_participants = __import__("sqlalchemy").Table(
    "meeting_participants",
    Base.metadata,
    Column("meeting_id", Integer, ForeignKey("meetings.id"), primary_key=True),
    Column("participant_id", Integer, ForeignKey("participants.id"), primary_key=True),
)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(Text, nullable=False)
    email = Column(Text, nullable=False)

    meetings = relationship("Meeting", back_populates="owner")


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(Text, nullable=False)
    date = Column(DateTime, nullable=False)
    duration_seconds = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    tags = Column(JSON, nullable=False, default=list)   # free-form labels, e.g. ["sales", "onboarding"]

    owner = relationship("User", back_populates="meetings")
    participants = relationship(
        "Participant", secondary=meeting_participants, back_populates="meetings"
    )
    transcript_segments = relationship(
        "TranscriptSegment", back_populates="meeting", cascade="all, delete-orphan"
    )
    summary = relationship(
        "Summary", back_populates="meeting", uselist=False, cascade="all, delete-orphan"
    )
    action_items = relationship(
        "ActionItem", back_populates="meeting", cascade="all, delete-orphan"
    )


class Participant(Base):
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(Text, nullable=False)

    meetings = relationship(
        "Meeting", secondary=meeting_participants, back_populates="participants"
    )


class TranscriptSegment(Base):
    __tablename__ = "transcript_segments"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=False)
    speaker_name = Column(Text, nullable=False)
    start_time = Column(Float, nullable=False)   # seconds from meeting start
    end_time = Column(Float, nullable=False)
    text = Column(Text, nullable=False)
    order_index = Column(Integer, nullable=False)

    meeting = relationship("Meeting", back_populates="transcript_segments")


class Summary(Base):
    __tablename__ = "summaries"

    id = Column(Integer, primary_key=True, index=True)
    # unique=True enforces the 1:1 relationship at the DB level
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=False, unique=True)
    overview_text = Column(Text, nullable=False)
    key_topics = Column(JSON, nullable=False)   # stored as a JSON list of strings

    meeting = relationship("Meeting", back_populates="summary")


class ActionItem(Base):
    __tablename__ = "action_items"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=False)
    text = Column(Text, nullable=False)
    assignee = Column(Text, nullable=True)
    is_completed = Column(Boolean, default=False, nullable=False)
    due_date = Column(Date, nullable=True)

    meeting = relationship("Meeting", back_populates="action_items")
