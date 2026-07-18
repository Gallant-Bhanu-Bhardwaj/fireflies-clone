from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db

router = APIRouter(prefix="/participants", tags=["participants"])


@router.get("", response_model=List[schemas.Participant])
def list_participants(db: Session = Depends(get_db)):
    return db.query(models.Participant).order_by(models.Participant.name.asc()).all()


@router.post("", response_model=schemas.Participant, status_code=status.HTTP_200_OK)
def get_or_create_participant(payload: schemas.ParticipantCreate, db: Session = Depends(get_db)):
    """Get-or-create by name (case-insensitive).

    The frontend collects participants as free-text tags, not ids, so this
    lets the same name typed twice resolve to one row instead of duplicates.
    """
    existing = (
        db.query(models.Participant)
        .filter(models.Participant.name.ilike(payload.name))
        .first()
    )
    if existing:
        return existing

    participant = models.Participant(name=payload.name)
    db.add(participant)
    db.commit()
    db.refresh(participant)
    return participant
