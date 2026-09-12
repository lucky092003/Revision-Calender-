import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { calendarMonth } from "@/api/topics";
import { CheckIcon } from "@/components/layout/icons";
import { ChevronLeft, ChevronRight, RefreshIcon } from "@/components/layout/icons";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { extractErrorMessage } from "@/lib/api";
import { formatDate, monthName, todayISO } from "@/lib/format";
import type { CalendarMonth, RevisionStatus, RevisionWithTopic } from "@/types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATUS_CHIP: Record<RevisionStatus, string> = {
  due_today: "border-brand-200 bg-brand-50 text-brand-700",
  upcoming: "border-sky-200 bg-sky-50 text-sky-700",
  overdue: "border-rose-200 bg-rose-50 text-rose-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-600",
};

const STATUS_DOT: Record<RevisionStatus, string> = {
  due_today: "bg-brand-500",
  upcoming: "bg-sky-400",
  overdue: "bg-rose-500",
  completed: "bg-emerald-500",
};

const LEGEND: { status: RevisionStatus; label: string }[] = [
  { status: "due_today", label: "Due today" },
  { status: "upcoming", label: "Upcoming" },
  { status: "overdue", label: "Overdue" },
  { status: "completed", label: "Completed" },
];

interface DayCell {
  iso: string | null;
  day: number | null;
  revisions: RevisionWithTopic[];
}

export function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<CalendarMonth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCalendar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await calendarMonth(year, month);
      setData(result);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  const goToMonth = (offset: number) => {
    const date = new Date(year, month - 1 + offset, 1);
    setYear(date.getFullYear());
    setMonth(date.getMonth() + 1);
  };

  const goToToday = () => {
    const date = new Date();
    setYear(date.getFullYear());
    setMonth(date.getMonth() + 1);
  };

  const todayISOString = todayISO();
  const cells = useMemo<DayCell[]>(() => buildGrid(year, month, data), [year, month, data]);
  const weeks = useMemo(() => chunk(cells, 7), [cells]);

  const agendaDays = useMemo(
    () =>
      (data?.days ?? [])
        .filter((day) => day.revisions.length > 0)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [data],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Calendar</h1>
          <p className="text-sm text-slate-500">Your revision schedule by day.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => goToMonth(-1)}
            aria-label="Previous month"
          >
            <ChevronLeft width={16} height={16} />
          </Button>
          <Button variant="secondary" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="secondary" size="sm" onClick={() => goToMonth(1)} aria-label="Next month">
            <ChevronRight width={16} height={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchCalendar}
            aria-label="Refresh"
            className="ml-1"
          >
            <RefreshIcon width={16} height={16} />
          </Button>
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-lg font-semibold text-slate-900">
          {monthName(month)} {year}
        </h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchCalendar} />
      ) : data && data.days.length === 0 ? (
        <EmptyState title="No revisions this month" description="Add a topic to generate a revision schedule." />
      ) : (
        <>
          {/* Desktop / tablet grid */}
          <div className="hidden rounded-3xl bg-white p-4 shadow-card ring-1 ring-slate-100 sm:block">
            <div className="grid grid-cols-7 gap-2">
              {WEEKDAYS.map((weekday) => (
                <div
                  key={weekday}
                  className="pb-1 text-center text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  {weekday}
                </div>
              ))}
            </div>
            {weeks.map((week, index) => (
              <div key={index} className="grid grid-cols-7 gap-2">
                {week.map((cell) => renderDesktopCell(cell, todayISOString))}
              </div>
            ))}
          </div>

          {/* Mobile agenda */}
          <div className="md:hidden">
            {agendaDays.length === 0 ? (
              <EmptyState
                title="Nothing scheduled this month"
                description="Add a topic to generate a revision schedule."
              />
            ) : (
              <div className="space-y-4">
                {agendaDays.map((day) => (
                  <div
                    key={day.date}
                    className={`rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-100 ${
                      day.date === todayISOString ? "ring-brand-300" : ""
                    }`}
                  >
                    <p className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-900">
                      {formatDate(day.date)}
                      {day.date === todayISOString && (
                        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700">
                          Today
                        </span>
                      )}
                    </p>
                    <div className="space-y-1.5">
                      {day.revisions.map((revision) => renderRevisionRow(revision))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
            <span className="font-medium text-slate-500">Legend:</span>
            {LEGEND.map(({ status, label }) => (
              <span key={status} className="inline-flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT[status]}`} />
                {label}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function renderDesktopCell(cell: DayCell, todayISOString: string) {
  const isToday = cell.iso === todayISOString;
  if (!cell.day) {
    return <div key={cell.iso ?? `empty-${Math.random()}`} aria-hidden="true" />;
  }
  return (
    <div
      key={cell.iso}
      className={`flex min-h-28 flex-col rounded-2xl border p-2.5 transition-colors ${
        isToday
          ? "border-brand-300 bg-brand-50/70 ring-2 ring-brand-200"
          : cell.revisions.some((r) => r.status === "overdue")
            ? "border-rose-100 bg-rose-50/40"
            : "border-slate-100 bg-slate-50/60"
      }`}
    >
      <div className="mb-1.5 flex items-center justify-between">
        <span
          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
            isToday ? "bg-brand-600 text-white" : "text-slate-600"
          }`}
        >
          {cell.day}
        </span>
        {cell.revisions.length > 0 && (
          <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 ring-1 ring-slate-200">
            {cell.revisions.length}
          </span>
        )}
      </div>
      <div className="space-y-1">
        {cell.revisions.slice(0, 3).map((revision) => renderRevisionRow(revision, true))}
        {cell.revisions.length > 3 && (
          <p className="text-[11px] font-medium text-slate-400">
            +{cell.revisions.length - 3} more
          </p>
        )}
      </div>
    </div>
  );
}

function renderRevisionRow(revision: RevisionWithTopic, compact = false) {
  const isCompleted = revision.status === "completed";
  return (
    <Link
      key={revision.id}
      to={`/topics/${revision.topic_id}`}
      className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors hover:opacity-80 ${STATUS_CHIP[revision.status]} ${
        compact ? "" : "w-max"
      }`}
    >
      {isCompleted ? <CheckIcon width={11} height={11} /> : <span>☐</span>}
      <span className="truncate">{revision.topic.title}</span>
    </Link>
  );
}

function buildGrid(year: number, month: number, data: CalendarMonth | null): DayCell[] {
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const revisionsByDay = new Map<string, RevisionWithTopic[]>();
  for (const day of data?.days ?? []) {
    revisionsByDay.set(day.date, day.revisions);
  }

  const cells: DayCell[] = [];
  for (let i = 0; i < firstWeekday; i++) {
    cells.push({ iso: null, day: null, revisions: [] });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({ iso, day, revisions: revisionsByDay.get(iso) ?? [] });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ iso: null, day: null, revisions: [] });
  }
  return cells;
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}
export default CalendarPage;
