from typing import Dict, List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db

# Spans two resources (meetings + transcript_segments), so it gets its own
# file rather than living under either resource's router.
router = APIRouter(tags=["search"])


@router.get("/search", response_model=List[schemas.SearchResult])
def search(
    q: str = Query(..., min_length=1, description="Matched against meeting titles and transcript text"),
    db: Session = Depends(get_db),
):
    """Search meeting titles and transcript text, grouped by meeting.

    Two independent ilike queries (title, transcript) are merged in Python
    rather than a single join, since a meeting can match on title, on one or
    more transcript lines, or both — a join would either miss title-only
    matches or require an OR that's harder to read than just merging here.
    """
    like = f"%{q}%"

    title_matches = db.query(models.Meeting).filter(models.Meeting.title.ilike(like)).all()

    segment_matches = (
        db.query(models.TranscriptSegment)
        .join(models.Meeting)
        .filter(models.TranscriptSegment.text.ilike(like))
        .order_by(models.TranscriptSegment.meeting_id, models.TranscriptSegment.order_index)
        .all()
    )

    results: Dict[int, schemas.SearchResult] = {}

    for meeting in title_matches:
        results[meeting.id] = schemas.SearchResult(
            meeting_id=meeting.id,
            meeting_title=meeting.title,
            title_match=True,
            segment_matches=[],
        )

    for segment in segment_matches:
        entry = results.get(segment.meeting_id)
        if entry is None:
            entry = schemas.SearchResult(
                meeting_id=segment.meeting_id,
                meeting_title=segment.meeting.title,
                title_match=False,
                segment_matches=[],
            )
            results[segment.meeting_id] = entry

        entry.segment_matches.append(
            schemas.SearchResultSegment(
                id=segment.id,
                speaker_name=segment.speaker_name,
                start_time=segment.start_time,
                text=segment.text,
            )
        )

    return list(results.values())
