import { useCallback, useEffect, useMemo, useState } from "react";
import { listTopics } from "@/api/topics";
import { RefreshIcon, SearchIcon } from "@/components/layout/icons";
import { TopicCard } from "@/components/topics/TopicCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { SkeletonGrid } from "@/components/ui/Skeleton";
import { extractErrorMessage } from "@/lib/api";
import type { Difficulty, Topic, TopicListParams, TopicStatus } from "@/types";

export function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty | "">("");
  const [status, setStatus] = useState<TopicStatus | "">("");
  const [sort, setSort] = useState<TopicListParams["sort"]>("studied_on");
  const [order, setOrder] = useState<TopicListParams["order"]>("desc");

  useEffect(() => {
    listTopics({})
      .then((data) => {
        const unique = Array.from(new Set(data.map((topic) => topic.subject))).sort();
        setSubjects(unique);
      })
      .catch(() => {
        // Subject dropdown is best-effort; listing errors surface below.
      });
  }, []);

  const hasFilters = useMemo(
    () => search.trim() !== "" || subject !== "" || difficulty !== "" || status !== "",
    [search, subject, difficulty, status],
  );

  const fetchTopics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: TopicListParams = { sort, order };
      if (search.trim()) params.q = search.trim();
      if (subject) params.subject = subject;
      if (difficulty) params.difficulty = difficulty;
      if (status) params.status = status;
      const data = await listTopics(params);
      setTopics(data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, subject, difficulty, status, sort, order]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    fetchTopics();
  };

  const resetFilters = () => {
    setSearch("");
    setSubject("");
    setDifficulty("");
    setStatus("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Topics</h1>
          <p className="text-sm text-slate-500">Manage and search all the topics you've studied.</p>
        </div>
        <div className="flex items-center gap-2">
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <RefreshIcon width={14} height={14} />
              Reset
            </Button>
          )}
          <Button size="sm" onClick={() => window.location.assign("/topics/new")}>
            + Add Topic
          </Button>
        </div>
      </div>

      <form
        onSubmit={handleSearchSubmit}
        className="flex flex-nowrap items-center gap-3 rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-100"
      >
        <div className="relative min-w-0 shrink-1 flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <SearchIcon width={16} height={16} />
          </span>
          <Input
            placeholder="Search by topic or subject…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-nowrap items-center gap-3">
          <Select
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className="w-44"
            aria-label="Filter by subject"
          >
            <option value="">Subject: All</option>
            {subjects.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
          <Select
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value as Difficulty | "")}
            className="w-40"
            aria-label="Filter by difficulty"
          >
            <option value="">Difficulty: All</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </Select>
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value as TopicStatus | "")}
            className="w-40"
            aria-label="Filter by status"
          >
            <option value="">Status: All</option>
            <option value="upcoming">Upcoming</option>
            <option value="due_today">Due today</option>
            <option value="overdue">Overdue</option>
            <option value="completed">Completed</option>
          </Select>
          <Select
            value={sort}
            onChange={(event) => setSort(event.target.value as TopicListParams["sort"])}
            className="w-44"
            aria-label="Sort by"
          >
            <option value="studied_on">Sort: Studied on</option>
            <option value="next_revision">Sort: Next revision</option>
            <option value="created_at">Sort: Created at</option>
          </Select>
          <Select
            value={order}
            onChange={(event) => setOrder(event.target.value as "asc" | "desc")}
            className="w-32"
            aria-label="Sort order"
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </Select>
        </div>
      </form>

      {loading ? (
        <SkeletonGrid />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchTopics} />
      ) : topics.length === 0 ? (
        <EmptyState
          title={hasFilters ? "No matching topics" : "No topics yet"}
          description={
            hasFilters
              ? "Try adjusting your search or filters."
              : "Start by adding a topic you've studied so it can plan your revision schedule."
          }
          actionLabel={hasFilters ? undefined : "Add topic"}
          onAction={hasFilters ? undefined : () => window.location.assign("/topics/new")}
        />
      ) : (
        <>
          <p className="text-sm text-slate-500">
            {topics.length} topic{topics.length !== 1 ? "s" : ""}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {topics.map((topic) => (
              <TopicCard key={topic.id} topic={topic} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default TopicsPage;