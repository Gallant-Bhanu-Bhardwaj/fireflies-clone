from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db

# No prefix here: these paths are nested under /meetings/{id} but conceptually
# belong to the transcript resource, so they live in their own router/file.
router = APIRouter(tags=["transcripts"])


def _get_meeting_or_404(meeting_id: int, db: Session) -> models.Meeting:
    meeting = db.query(models.Meeting).filter(models.Meeting.id == meeting_id).first()
    if meeting is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")
    return meeting


@router.get(
    "/meetings/{meeting_id}/transcript",
    response_model=List[schemas.TranscriptSegment],
)
def get_transcript(meeting_id: int, db: Session = Depends(get_db)):
    """Return a meeting's transcript segments in playback order."""
    _get_meeting_or_404(meeting_id, db)
    return (
        db.query(models.TranscriptSegment)
        .filter(models.TranscriptSegment.meeting_id == meeting_id)
        .order_by(models.TranscriptSegment.order_index.asc())
        .all()
    )


@router.post(
    "/meetings/{meeting_id}/transcript",
    response_model=List[schemas.TranscriptSegment],
    status_code=status.HTTP_201_CREATED,
)
def add_transcript_segments(
    meeting_id: int,
    segments: List[schemas.TranscriptSegmentBase],
    db: Session = Depends(get_db),
):
    """Bulk-add segments to a meeting.

    Transcripts always arrive as a batch (a whole recording), so a single bulk
    endpoint is more natural than inserting one line at a time.
    """
    _get_meeting_or_404(meeting_id, db)

    created = [
        models.TranscriptSegment(
            meeting_id=meeting_id,
            speaker_name=seg.speaker_name,
            start_time=seg.start_time,
            end_time=seg.end_time,
            text=seg.text,
            order_index=seg.order_index,
        )
        for seg in segments
    ]

    db.add_all(created)
    db.commit()
    for seg in created:
        db.refresh(seg)

    return created
