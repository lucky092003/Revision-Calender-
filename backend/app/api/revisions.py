import calendar
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models import RevisionCompletion, RevisionSchedule, Topic, User
from app.schemas.revision import CalendarDay, CalendarMonth, RevisionOut, RevisionWithTopic
from app.services.serializers import revision_to_out, revision_with_topic

router = APIRouter(prefix="/revisions", tags=["revisions"])


def _load_revisions_query(user: User, *criteria):
    query = (
        select(RevisionSchedule, Topic)
        .join(Topic, Topic.id == RevisionSchedule.topic_id)
        .options(selectinload(RevisionSchedule.completion))
        .where(Topic.user_id == user.id)
    )
    for criterion in criteria:
        query = query.where(criterion)
    return query


@router.get("/today", response_model=list[RevisionWithTopic])
def revisions_today(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[RevisionWithTopic]:
    today = date.today()
    rows = db.execute(
        _load_revisions_query(user, RevisionSchedule.scheduled_date == today)
        .order_by(RevisionSchedule.scheduled_date)
    ).all()
    return [
        revision_with_topic(revision, today)
        for revision, _topic in rows
        if revision.completion is None
    ]


@router.get("/upcoming", response_model=list[RevisionWithTopic])
def revisions_upcoming(
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[RevisionWithTopic]:
    today = date.today()
    rows = db.execute(
        _load_revisions_query(user, RevisionSchedule.scheduled_date >= today)
        .order_by(RevisionSchedule.scheduled_date)
        .limit(limit)
    ).all()
    return [
        revision_with_topic(revision, today)
        for revision, _topic in rows
        if revision.completion is None
    ]


@router.get("/calendar", response_model=CalendarMonth)
def revisions_calendar(
    year: int = Query(default=None, ge=1970, le=2100),
    month: int = Query(default=None, ge=1, le=12),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> CalendarMonth:
    today = date.today()
    year = year or today.year
    month = month or today.month

    start = date(year, month, 1)
    last_day = calendar.monthrange(year, month)[1]
    end = date(year, month, last_day)

    rows = db.execute(
        _load_revisions_query(user, RevisionSchedule.scheduled_date.between(start, end))
        .order_by(RevisionSchedule.scheduled_date)
    ).all()

    revisions_by_day: dict[date, list[RevisionWithTopic]] = {d: [] for d in _all_days(year, month)}
    for revision, _topic in rows:
        revisions_by_day[revision.scheduled_date].append(revision_with_topic(revision, today))

    return CalendarMonth(
        year=year,
        month=month,
        days=[
            CalendarDay(date=day, revisions=revisions_by_day[day])
            for day in _all_days(year, month)
        ],
    )


@router.post("/{revision_id}/complete", response_model=RevisionOut)
def complete_revision(
    revision_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> RevisionOut:
    revision = db.get(RevisionSchedule, revision_id)
    if revision is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Revision not found")
    topic = db.get(Topic, revision.topic_id)
    if topic is None or topic.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Revision not found")
    if revision.completion is None:
        db.add(RevisionCompletion(revision_id=revision.id))
        db.commit()
        db.refresh(revision)
    return revision_to_out(revision)


def _all_days(year: int, month: int) -> list[date]:
    _, last_day = calendar.monthrange(year, month)
    return [date(year, month, day) for day in range(1, last_day + 1)]