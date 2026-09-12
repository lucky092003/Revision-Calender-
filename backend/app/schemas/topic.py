from datetime import date, datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class RevStatus(str, Enum):
    ALL = "all"
    UPCOMING = "upcoming"
    DUE_TODAY = "due_today"
    COMPLETED = "completed"
    OVERDUE = "overdue"


class TopicBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    subject: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=5000)
    studied_on: date
    source: str | None = Field(default=None, max_length=500)
    difficulty: Difficulty = Difficulty.MEDIUM
    notes: str | None = Field(default=None, max_length=10000)


class TopicCreate(TopicBase):
    pass


class TopicUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    subject: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=5000)
    studied_on: date | None = None
    source: str | None = Field(default=None, max_length=500)
    difficulty: Difficulty | None = None
    notes: str | None = Field(default=None, max_length=10000)


class TopicOut(BaseModel):
    id: int
    title: str
    subject: str
    description: str | None
    studied_on: date
    source: str | None
    difficulty: str
    notes: str | None
    created_at: datetime
    updated_at: datetime
    total_revisions: int
    completed_revisions: int
    next_revision: date | None
    next_revision_number: int | None
    status: RevStatus


class TopicDetail(TopicOut):
    revisions: list["RevisionOut"]


from app.schemas.revision import RevisionOut  # noqa: E402

TopicDetail.model_rebuild()