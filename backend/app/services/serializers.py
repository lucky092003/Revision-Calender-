from datetime import date

from app.models import RevisionSchedule, Topic
from app.schemas.revision import RevisionOut, RevisionWithTopic, TopicBrief
from app.schemas.topic import RevStatus, TopicOut
from app.services.revision_algorithm import status_for


def revision_to_out(revision: RevisionSchedule, today: date | None = None) -> RevisionOut:
    completed = revision.completion is not None
    return RevisionOut(
        id=revision.id,
        topic_id=revision.topic_id,
        revision_number=revision.revision_number,
        scheduled_date=revision.scheduled_date,
        status=status_for(revision.scheduled_date, completed, today),
        completed_at=revision.completion.completed_at if revision.completion else None,
    )


def revision_with_topic(revision: RevisionSchedule, today: date | None = None) -> RevisionWithTopic:
    base = revision_to_out(revision, today)
    topic = revision.topic
    return RevisionWithTopic(
        **base.model_dump(),
        topic=TopicBrief(
            id=topic.id,
            title=topic.title,
            subject=topic.subject,
            difficulty=topic.difficulty,
            studied_on=topic.studied_on,
        ),
    )


def topic_to_out(topic: Topic, today: date | None = None) -> TopicOut:
    today = today or date.today()
    revisions = topic.revisions or []
    total = len(revisions)
    completed = sum(1 for rev in revisions if rev.completion is not None)
    pending = [rev for rev in revisions if rev.completion is None]

    next_revision: date | None = None
    next_revision_number: int | None = None
    status: RevStatus = RevStatus.COMPLETED

    if pending:
        next_revision = min(rev.scheduled_date for rev in pending)
        next_revision_number = next(
            rev.revision_number for rev in pending if rev.scheduled_date == next_revision
        )
        if next_revision < today:
            status = RevStatus.OVERDUE
        elif next_revision == today:
            status = RevStatus.DUE_TODAY
        else:
            status = RevStatus.UPCOMING

    return TopicOut(
        id=topic.id,
        title=topic.title,
        subject=topic.subject,
        description=topic.description,
        studied_on=topic.studied_on,
        source=topic.source,
        difficulty=topic.difficulty,
        notes=topic.notes,
        created_at=topic.created_at,
        updated_at=topic.updated_at,
        total_revisions=total,
        completed_revisions=completed,
        next_revision=next_revision,
        next_revision_number=next_revision_number,
        status=status,
    )