from datetime import date as date_type
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db

router = APIRouter(prefix="/meetings", tags=["meetings"])


@router.get("", response_model=List[schemas.MeetingList])
def list_meetings(
    db: Session = Depends(get_db),
    search: Optional[str] = Query(None, description="Case-insensitive match on meeting title"),
    meeting_date: Optional[date_type] = Query(None, description="Only meetings on this calendar day"),
    participant_id: Optional[int] = Query(None, description="Only meetings including this participant"),
    sort: str = Query("recent", description="'recent' (newest first) or 'oldest'"),
):
    """List meetings with optional search/filter/sort.

    Kept as query params (not separate endpoints) so the frontend can combine
    filters freely — e.g. search + participant in one request.
    """
    query = db.query(models.Meeting)

    if search:
        # ilike gives case-insensitive partial matching, which is what a search box expects
        query = query.filter(models.Meeting.title.ilike(f"%{search}%"))

    if meeting_date:
        # date column is a datetime; compare only the calendar-day part
        query = query.filter(func.date(models.Meeting.date) == meeting_date.isoformat())

    if participant_id:
        # .any() avoids a manual join and duplicate rows across the M:N table
        query = query.filter(
            models.Meeting.participants.any(models.Participant.id == participant_id)
        )

    if sort == "oldest":
        query = query.order_by(models.Meeting.date.asc())
    else:
        query = query.order_by(models.Meeting.date.desc())

    return query.all()


@router.get("/{meeting_id}", response_model=schemas.MeetingDetail)
def get_meeting(meeting_id: int, db: Session = Depends(get_db)):
    """Return a single meeting with all nested data (transcript, summary, action items)."""
    meeting = db.query(models.Meeting).filter(models.Meeting.id == meeting_id).first()
    if meeting is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")
    return meeting


@router.post("", response_model=schemas.MeetingDetail, status_code=status.HTTP_201_CREATED)
def create_meeting(payload: schemas.MeetingCreate, db: Session = Depends(get_db)):
    meeting = models.Meeting(
        title=payload.title,
        date=payload.date,
        duration_seconds=payload.duration_seconds,
        owner_id=payload.owner_id,
        tags=payload.tags,
    )

    # Attach participants by id; silently ignore ids that don't exist rather than 400,
    # so a partial participant list still creates the meeting
    if payload.participant_ids:
        meeting.participants = (
            db.query(models.Participant)
            .filter(models.Participant.id.in_(payload.participant_ids))
            .all()
        )

    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return meeting


@router.put("/{meeting_id}", response_model=schemas.MeetingDetail)
def update_meeting(
    meeting_id: int, payload: schemas.MeetingCreate, db: Session = Depends(get_db)
):
    """Full replace of the editable meeting fields (title/date/duration/participants)."""
    meeting = db.query(models.Meeting).filter(models.Meeting.id == meeting_id).first()
    if meeting is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")

    meeting.title = payload.title
    meeting.date = payload.date
    meeting.duration_seconds = payload.duration_seconds
    meeting.owner_id = payload.owner_id
    meeting.tags = payload.tags
    meeting.participants = (
        db.query(models.Participant)
        .filter(models.Participant.id.in_(payload.participant_ids))
        .all()
    )

    db.commit()
    db.refresh(meeting)
    return meeting


@router.delete("/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meeting(meeting_id: int, db: Session = Depends(get_db)):
    meeting = db.query(models.Meeting).filter(models.Meeting.id == meeting_id).first()
    if meeting is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")

    # cascade="all, delete-orphan" on the relationships removes segments/summary/action items too
    db.delete(meeting)
    db.commit()
    return None
