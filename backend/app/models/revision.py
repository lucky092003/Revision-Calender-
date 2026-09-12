from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class RevisionSchedule(Base):
    __tablename__ = "revision_schedules"
    __table_args__ = (
        UniqueConstraint("topic_id", "revision_number", name="uq_revision_topic_number"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    topic_id: Mapped[int] = mapped_column(
        ForeignKey("topics.id", ondelete="CASCADE"), index=True, nullable=False
    )
    revision_number: Mapped[int] = mapped_column(Integer, nullable=False)
    scheduled_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    topic: Mapped["Topic"] = relationship("Topic", back_populates="revisions")
    completion: Mapped["RevisionCompletion | None"] = relationship(
        "RevisionCompletion",
        back_populates="revision",
        cascade="all, delete-orphan",
        uselist=False,
    )


class RevisionCompletion(Base):
    __tablename__ = "revision_completions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    revision_id: Mapped[int] = mapped_column(
        ForeignKey("revision_schedules.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )
    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    revision: Mapped["RevisionSchedule"] = relationship(
        "RevisionSchedule", back_populates="completion"
    )