from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db

# Mixed paths: collection routes are nested under /meetings/{id}, while
# item-level routes live at /action-items/{id}. One router, explicit paths.
router = APIRouter(tags=["action-items"])


@router.get(
    "/meetings/{meeting_id}/action-items",
    response_model=List[schemas.ActionItem],
)
def list_action_items(meeting_id: int, db: Session = Depends(get_db)):
    meeting = db.query(models.Meeting).filter(models.Meeting.id == meeting_id).first()
    if meeting is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")
    return (
        db.query(models.ActionItem)
        .filter(models.ActionItem.meeting_id == meeting_id)
        .all()
    )


@router.post(
    "/meetings/{meeting_id}/action-items",
    response_model=schemas.ActionItem,
    status_code=status.HTTP_201_CREATED,
)
def create_action_item(
    meeting_id: int,
    payload: schemas.ActionItemBase,
    db: Session = Depends(get_db),
):
    meeting = db.query(models.Meeting).filter(models.Meeting.id == meeting_id).first()
    if meeting is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")

    item = models.ActionItem(
        meeting_id=meeting_id,
        text=payload.text,
        assignee=payload.assignee,
        is_completed=payload.is_completed,
        due_date=payload.due_date,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/action-items/{item_id}", response_model=schemas.ActionItem)
def update_action_item(
    item_id: int,
    payload: schemas.ActionItemUpdate,
    db: Session = Depends(get_db),
):
    """Partial update — only the fields present in the body are changed.

    Uses exclude_unset so PATCH-style calls (e.g. just toggling is_completed)
    don't wipe the other columns.
    """
    item = db.query(models.ActionItem).filter(models.ActionItem.id == item_id).first()
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Action item not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)
    return item


@router.delete("/action-items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_action_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.ActionItem).filter(models.ActionItem.id == item_id).first()
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Action item not found")
    db.delete(item)
    db.commit()
    return None
