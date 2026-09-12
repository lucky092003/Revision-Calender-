from datetime import date, timedelta
from enum import Enum

# Spaced repetition cycle: offset in days from the study date.
# studied_on + 0  -> Studied
# studied_on + 1  -> Revision 1 (First revision)
# studied_on + 3  -> Revision 2
# studied_on + 7  -> Revision 3
# studied_on + 15 -> Revision 4
# studied_on + 30 -> Revision 5
# studied_on + 90 -> Revision 6
# studied_on + 180 -> Revision 7
# studied_on + 360 -> Revision 8
REVISION_INTERVAL_DAYS: list[int] = [1, 3, 7, 15, 30, 90, 180, 360]


class RevisionStatus(str, Enum):
    UPCOMING = "upcoming"
    DUE_TODAY = "due_today"
    COMPLETED = "completed"
    OVERDUE = "overdue"


def revision_dates(studied_on: date) -> list[tuple[int, date]]:
    """Return [(revision_number, scheduled_date)] for the full revision cycle."""
    return [
        (number, studied_on + timedelta(days=interval))
        for number, interval in enumerate(REVISION_INTERVAL_DAYS, start=1)
    ]


def status_for(scheduled_date: date, completed: bool, today: date | None = None) -> RevisionStatus:
    today = today or date.today()
    if completed:
        return RevisionStatus.COMPLETED
    if scheduled_date < today:
        return RevisionStatus.OVERDUE
    if scheduled_date == today:
        return RevisionStatus.DUE_TODAY
    return RevisionStatus.UPCOMING