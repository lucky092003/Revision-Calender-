from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.services.revision_algorithm import RevisionStatus


class RevisionOut(BaseModel):
    id: int
    topic_id: int
    revision_number: int
    scheduled_date: date
    status: RevisionStatus
    completed_at: datetime | None = None


class TopicBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    subject: str
    difficulty: str
    studied_on: date


class RevisionWithTopic(RevisionOut):
    topic: TopicBrief


class CalendarDay(BaseModel):
    date: date
    revisions: list[RevisionWithTopic]


class CalendarMonth(BaseModel):
    year: int
    month: int
    days: list[CalendarDay]