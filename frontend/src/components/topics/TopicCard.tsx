import { Link } from "react-router-dom";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { DifficultyBadge, StatusBadge } from "@/components/ui/Badge";
import { formatDate, relativeDay } from "@/lib/format";
import type { Topic } from "@/types";

export function TopicCard({ topic }: { topic: Topic }) {
  return (
    <Link
      to={`/topics/${topic.id}`}
      className="group block rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100 transition-all hover:-translate-y-0.5 hover:shadow-raised hover:ring-brand-100"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-slate-900 group-hover:text-brand-700">
            {topic.title}
          </h3>
          <p className="mt-0.5 truncate text-xs font-medium text-slate-400">{topic.subject}</p>
        </div>
        <StatusBadge status={topic.status} />
      </div>

      <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">
        <span>Studied {formatDate(topic.studied_on)}</span>
        <span aria-hidden="true" className="text-slate-300">
          ·
        </span>
        <span>
          Next revision:{" "}
          {topic.next_revision ? (
            <span className="font-semibold text-brand-600">{relativeDay(topic.next_revision)}</span>
          ) : (
            <span className="font-semibold text-emerald-600">Complete</span>
          )}
        </span>
      </div>

      <ProgressBar value={topic.completed_revisions} max={topic.total_revisions} />

      <div className="mt-3">
        <DifficultyBadge difficulty={topic.difficulty} />
      </div>
    </Link>
  );
}