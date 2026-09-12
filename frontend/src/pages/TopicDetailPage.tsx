import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { completeRevision, deleteTopic, getTopic } from "@/api/topics";
import { Button, Spinner } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DifficultyBadge } from "@/components/ui/Badge";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { CheckIcon, ExternalLinkIcon, TrashIcon } from "@/components/layout/icons";
import { useToast } from "@/context/ToastContext";
import { extractErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Revision, TopicDetail } from "@/types";

export function TopicDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const [topic, setTopic] = useState<TopicDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTopic = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getTopic(Number(id));
      setTopic(data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTopic();
  }, [fetchTopic]);

  const handleComplete = async (revision: Revision) => {
    if (!topic) return;
    try {
      await completeRevision(revision.id);
      toast(`Revision ${revision.revision_number} marked as completed`, "success");
      setTopic((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          completed_revisions: prev.completed_revisions + 1,
          revisions: prev.revisions.map((r) =>
            r.id === revision.id
              ? { ...r, status: "completed" as const, completed_at: new Date().toISOString() }
              : r,
          ),
        };
      });
    } catch (err) {
      toast(extractErrorMessage(err), "error");
    }
  };

  const handleDelete = async () => {
    if (!topic || !window.confirm(`Delete "${topic.title}"? This cannot be undone.`)) return;
    try {
      await deleteTopic(topic.id);
      toast("Topic deleted", "success");
      window.location.href = "/topics";
    } catch (err) {
      toast(extractErrorMessage(err), "error");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (error || !topic) {
    return <ErrorState message={error ?? "Topic not found"} onRetry={fetchTopic} />;
  }

  const statusColors: Record<string, string> = {
    upcoming: "bg-sky-50 text-sky-700",
    due_today: "bg-brand-50 text-brand-700",
    completed: "bg-emerald-50 text-emerald-700",
    overdue: "bg-rose-50 text-rose-700",
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
<div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{topic.title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span>{topic.subject}</span>
            <span>·</span>
            <span>Studied {formatDate(topic.studied_on)}</span>
            <span>·</span>
            <DifficultyBadge difficulty={topic.difficulty} />
          </div>
        </div>
        <Button variant="danger" size="sm" onClick={handleDelete}>
          <TrashIcon width={16} height={16} />
          Delete
        </Button>
      </div>

      {topic.description && (
        <Card>
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Description</h2>
          <p className="text-sm text-slate-600 whitespace-pre-line">{topic.description}</p>
        </Card>
      )}

      {topic.notes && (
        <Card>
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Notes</h2>
          <p className="text-sm text-slate-600 whitespace-pre-line">{topic.notes}</p>
        </Card>
      )}

      {topic.source && (
        <Card className="flex items-center gap-3 px-5 py-4">
          <ExternalLinkIcon className="text-slate-400" />
          <a
            href={topic.source}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-brand-600 underline-offset-2 hover:underline"
          >
            {topic.source}
          </a>
        </Card>
      )}

      <div>
        <h2 className="mb-1 text-sm font-semibold text-slate-900">Revision Progress</h2>
        <p className="mb-3 text-xs text-slate-500">
          {topic.completed_revisions} of {topic.total_revisions} revisions completed
        </p>
        <ProgressBar value={topic.completed_revisions} max={topic.total_revisions} />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">Revision Schedule</h2>
        {topic.revisions.length === 0 ? (
          <EmptyState title="No revisions scheduled" />
        ) : (
          <div className="space-y-2">
            {topic.revisions.map((rev) => {
              const isCompleted = rev.status === "completed";
              const colors = statusColors[rev.status] ?? "bg-slate-50 text-slate-600";
              return (
                <div
                  key={rev.id}
                  className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors ${
                    isCompleted
                      ? "border-emerald-100 bg-emerald-50/60"
                      : "border-slate-100 bg-white"
                  }`}
                >
<div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
                      D{getDayLabel(rev.revision_number)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900">
                        Revision {rev.revision_number}
                      </p>
                      <p className="text-xs text-slate-500">{formatDate(rev.scheduled_date)}</p>
                    </div>
                  </div>
                  <div className="flex w-36 shrink-0 items-center justify-end gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-center text-[11px] font-medium ${colors}`}>
                      {statusLabel(rev.status)}
                    </span>
                    {!isCompleted && (
                      <Button size="sm" variant="success" onClick={() => handleComplete(rev)}>
                        <CheckIcon width={14} height={14} />
                        Mark done
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const DAY_LABELS = [1, 3, 7, 15, 30, 90, 180, 360];

function getDayLabel(revisionNumber: number): number {
  return DAY_LABELS[revisionNumber - 1] ?? revisionNumber;
}

function statusLabel(status: string): string {
  switch (status) {
    case "due_today":
      return "Due today";
    case "completed":
      return "Completed";
    case "overdue":
      return "Overdue";
    default:
      return "Upcoming";
  }
}
export default TopicDetailPage;
