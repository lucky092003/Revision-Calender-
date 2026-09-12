from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models import RevisionSchedule, Topic, User
from app.schemas.topic import Difficulty, RevStatus, TopicCreate, TopicDetail, TopicOut, TopicUpdate
from app.services.revision_algorithm import revision_dates
from app.services.serializers import revision_to_out, topic_to_out

router = APIRouter(prefix="/topics", tags=["topics"])


def _get_owned_topic(topic_id: int, user: User, db: Session) -> Topic:
    topic = db.get(Topic, topic_id)
    if topic is None or topic.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")
    return topic


def _regenerate_revisions(topic: Topic, db: Session) -> None:
    topic.revisions.clear()
    db.flush()
    for number, scheduled in revision_dates(topic.studied_on):
        db.add(RevisionSchedule(topic_id=topic.id, revision_number=number, scheduled_date=scheduled))


@router.get("", response_model=list[TopicOut])
def list_topics(
    q: str | None = Query(default=None, max_length=100),
    subject: str | None = Query(default=None, max_length=100),
    difficulty: Difficulty | None = None,
    status_filter: RevStatus | None = Query(default=None, alias="status"),
    sort: str = Query(default="studied_on", pattern="^(studied_on|next_revision|created_at)$"),
    order: str = Query(default="desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[TopicOut]:
    query = db.query(Topic).filter(Topic.user_id == user.id)
    if q:
        pattern = f"%{q.strip()}%"
        query = query.filter(or_(Topic.title.ilike(pattern), Topic.subject.ilike(pattern)))
    if subject:
        query = query.filter(Topic.subject.ilike(f"%{subject.strip()}%"))
    if difficulty:
        query = query.filter(Topic.difficulty == difficulty.value)

    topics = query.all()
    today = date.today()
    topics_out = [topic_to_out(topic, today) for topic in topics]

    if status_filter and status_filter != RevStatus.ALL:
        topics_out = [topic for topic in topics_out if topic.status == status_filter]

    descending = order == "desc"
    if sort == "next_revision":
        topics_out.sort(
            key=lambda t: (0 if t.next_revision is None else 1, t.next_revision or date.max),
            reverse=descending,
        )
    else:
        topics_out.sort(key=lambda t: getattr(t, sort), reverse=descending)
    return topics_out


@router.post("", response_model=TopicDetail, status_code=status.HTTP_201_CREATED)
def create_topic(
    payload: TopicCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> TopicDetail:
    from app.models import RevisionSchedule

    topic = Topic(user_id=user.id, **payload.model_dump())
    db.add(topic)
    db.flush()
    for number, scheduled in revision_dates(payload.studied_on):
        db.add(RevisionSchedule(topic_id=topic.id, revision_number=number, scheduled_date=scheduled))
    db.commit()
    db.refresh(topic)

    base = topic_to_out(topic)
    return TopicDetail(
        **base.model_dump(),
        revisions=[revision_to_out(rev) for rev in topic.revisions],
    )


@router.get("/{topic_id}", response_model=TopicDetail)
def get_topic(
    topic_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> TopicDetail:
    topic = _get_owned_topic(topic_id, user, db)
    base = topic_to_out(topic)
    return TopicDetail(
        **base.model_dump(),
        revisions=[revision_to_out(rev) for rev in topic.revisions],
    )


@router.put("/{topic_id}", response_model=TopicDetail)
def update_topic(
    topic_id: int,
    payload: TopicUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> TopicDetail:
    topic = _get_owned_topic(topic_id, user, db)
    data = payload.model_dump(exclude_unset=True)
    studied_changed = False
    if "studied_on" in data and data["studied_on"] != topic.studied_on:
        studied_changed = True
    for field, value in data.items():
        setattr(topic, field, value)
    if studied_changed:
        _regenerate_revisions(topic, db)
    db.commit()
    db.refresh(topic)
    base = topic_to_out(topic)
    return TopicDetail(
        **base.model_dump(),
        revisions=[revision_to_out(rev) for rev in topic.revisions],
    )


@router.delete("/{topic_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_topic(
    topic_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    topic = _get_owned_topic(topic_id, user, db)
    db.delete(topic)
    db.commit()