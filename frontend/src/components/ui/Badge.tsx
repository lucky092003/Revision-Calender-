import type { ReactNode } from "react";
import type { Difficulty, RevisionStatus, TopicStatus } from "@/types";

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  easy: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  medium: "bg-amber-50 text-amber-700 ring-amber-200",
  hard: "bg-rose-50 text-rose-700 ring-rose-200",
};

const STATUS_STYLES: Record<RevisionStatus, string> = {
  upcoming: "bg-sky-50 text-sky-700 ring-sky-200",
  due_today: "bg-brand-50 text-brand-700 ring-brand-200",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  overdue: "bg-rose-50 text-rose-700 ring-rose-200",
};

interface BadgeProps {
  children: ReactNode;
  className?: string;
}

export function Badge({ children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${className}`}
    >
      {children}
    </span>
  );
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <Badge className={DIFFICULTY_STYLES[difficulty]}>
      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
    </Badge>
  );
}

function shortLabel(status: TopicStatus): string {
  switch (status) {
    case "due_today":
      return "Due Today";
    case "completed":
      return "Completed";
    case "overdue":
      return "Overdue";
    case "upcoming":
      return "Upcoming";
    default:
      return "All";
  }
}

export function StatusBadge({ status }: { status: TopicStatus }) {
  const style =
    status === "all"
      ? "bg-slate-50 text-slate-600 ring-slate-200"
      : STATUS_STYLES[status as RevisionStatus];
  return <Badge className={style}>{shortLabel(status)}</Badge>;
}

export function revisionStatusLabel(status: RevisionStatus): string {
  switch (status) {
    case "due_today":
      return "Due Today";
    case "completed":
      return "Completed";
    case "overdue":
      return "Overdue";
    default:
      return "Upcoming";
  }
}