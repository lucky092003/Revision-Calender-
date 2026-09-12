import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { listTopics, revisionsToday, revisionsUpcoming } from "@/api/topics";
import {
  CalendarIcon,
  CheckTaskIcon,
  ChevronRight,
  FlameIcon,
  LayersIcon,
  TargetIcon,
} from "@/components/layout/icons";
import { TopicCard } from "@/components/topics/TopicCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { Skeleton, SkeletonStatRow } from "@/components/ui/Skeleton";
import { useAuth } from "@/context/AuthContext";
import { extractErrorMessage } from "@/lib/api";
import { formatDate, relativeDay, todayISO } from "@/lib/format";
import type { RevisionWithTopic, Topic } from "@/types";

const BAR_COLORS = ["#6366f1", "#a78bfa", "#8b5cf6", "#ec4899", "#f43f5e", "#f59e0b", "#10b981"];

export function DashboardPage() {
  const { user } = useAuth();

  const [topics, setTopics] = useState<Topic[]>([]);
  const [todayRevisions, setTodayRevisions] = useState<RevisionWithTopic[]>([]);
  const [upcoming, setUpcoming] = useState<RevisionWithTopic[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [topicsData, todayData, upcomingData] = await Promise.all([
        listTopics({}),
        revisionsToday(),
        revisionsUpcoming(100),
      ]);
      setTopics(topicsData);
      setTodayRevisions(todayData);
      setUpcoming(upcomingData);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = useMemo(() => {
    const totalRevisions = topics.reduce((sum, topic) => sum + topic.total_revisions, 0);
    const completedRevisions = topics.reduce(
      (sum, topic) => sum + topic.completed_revisions,
      0,
    );
    return {
      totalTopics: topics.length,
      dueToday: todayRevisions.length,
      completedTopics: topics.filter((topic) => topic.status === "completed").length,
      totalRevisions,
      completedRevisions,
      streak: 7, // Placeholder until activity tracking is implemented
    };
  }, [topics, todayRevisions]);

  const chartData = useMemo(() => buildChartData(upcoming), [upcoming]);
  const recentTopics = useMemo(
    () =>
      [...topics]
        .sort(
          (a, b) => new Date(b.studied_on).getTime() - new Date(a.studied_on).getTime(),
        )
        .slice(0, 6),
    [topics],
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <SkeletonStatRow />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-72 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />;
  }

  const today = new Date(todayISO());

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-brand-600">
            {today.toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight text-slate-900">
            Welcome back, {user?.full_name || user?.username}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {stats.dueToday > 0
              ? `You have ${stats.dueToday} revision${stats.dueToday > 1 ? "s" : ""} due today.`
              : "You're all caught up for today."}
          </p>
        </div>
        <Link
          to="/topics/new"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-brand-600 hover:to-brand-700 hover:shadow-raised"
        >
          <LayersIcon width={16} height={16} />
          Add Topic
        </Link>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<LayersIcon className="text-brand-600" />}
          title="Total Topics"
          value={stats.totalTopics}
          tint="bg-brand-50"
        />
        <StatCard
          icon={<CheckTaskIcon className="text-amber-600" />}
          title="Due Today"
          value={stats.dueToday}
          tint="bg-amber-50"
        />
        <StatCard
          icon={<CalendarIcon className="text-emerald-600" />}
          title="Completed Topics"
          value={stats.completedTopics}
          tint="bg-emerald-50"
        />
        <StatCard
          icon={<FlameIcon className="text-rose-600" />}
          title="Day Streak"
          value={stats.streak}
          tint="bg-rose-50"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Revision activity"
            subtitle="Next 14 days"
            action={
              <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                {chartData.reduce((sum, day) => sum + day.count, 0)} planned
              </span>
            }
          />
          {chartData.every((day) => day.count === 0) ? (
            <div className="py-10">
              <EmptyState
                title="No revisions planned"
                description="Add a topic to start your spaced repetition cycle."
              />
            </div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(99,102,241,0.06)" }}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #eef2ff",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      fontSize: 12,
                    }}
                    formatter={(value) => [`${value} revision${Number(value) > 1 ? "s" : ""}`, "Due"]}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={26}>
                    {chartData.map((_, index) => (
                      <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Overall progress" subtitle="Completed vs total" />
          <div className="flex flex-col items-center py-2">
            <RingProgress value={stats.completedRevisions} max={stats.totalRevisions} />
            <p className="mt-4 text-center text-sm text-slate-500">
              <span className="font-semibold text-slate-900">{stats.completedRevisions}</span> of{" "}
              {stats.totalRevisions} revisions completed
            </p>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Today's Revisions"
            subtitle="Review these to keep on schedule"
            action={
              todayRevisions.length > 0 ? (
                <Link
                  to="/today"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline"
                >
                  Open review <ChevronRight width={12} />
                </Link>
              ) : undefined
            }
          />
          {todayRevisions.length === 0 ? (
            <EmptyState
              icon={<CheckTaskIcon className="text-emerald-500" />}
              title="Nothing due today"
              description="Great job staying on track!"
            />
          ) : (
            <div className="space-y-3">
              {todayRevisions.slice(0, 4).map((revision) => (
                <RevisionRow key={revision.id} revision={revision} />
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Upcoming"
            subtitle="Next few revisions"
            action={
              <Link
                to="/calendar"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline"
              >
                Calendar <ChevronRight width={12} />
              </Link>
            }
          />
          {upcoming.length === 0 ? (
            <EmptyState
              icon={<TargetIcon className="text-brand-500" />}
              title="All caught up"
              description="No upcoming revisions."
            />
          ) : (
            <div className="space-y-2.5">
              {upcoming.slice(0, 5).map((revision) => (
                <RevisionRow key={revision.id} revision={revision} compact />
              ))}
            </div>
          )}
        </Card>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Recently studied</h2>
          <Link
            to="/topics"
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline"
          >
            All topics <ChevronRight width={12} />
          </Link>
        </div>
        {recentTopics.length === 0 ? (
          <Card className="py-10">
            <EmptyState
              title="No topics yet"
              description="Start by adding a topic you've studied."
              actionLabel="Add your first topic"
              onAction={() => window.location.assign("/topics/new")}
            />
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {recentTopics.map((topic) => (
              <TopicCard key={topic.id} topic={topic} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  tint,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
  tint: string;
}) {
  return (
    <Card className="group flex items-center gap-4 transition-all hover:-translate-y-0.5 hover:shadow-raised">
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform group-hover:scale-105 ${tint}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500">{title}</p>
        <p className="text-2xl font-extrabold tracking-tight text-slate-900">{value}</p>
      </div>
    </Card>
  );
}

function RingProgress({ value, max }: { value: number; max: number }) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative h-36 w-36">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="10"
          className="stroke-slate-100"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          stroke="url(#progress-gradient)"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)" }}
        />
        <defs>
          <linearGradient id="progress-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold tracking-tight text-slate-900">{percent}%</span>
        <span className="text-xs text-slate-400">complete</span>
      </div>
    </div>
  );
}

function RevisionRow({
  revision,
  compact = false,
}: {
  revision: RevisionWithTopic;
  compact?: boolean;
}) {
  return (
    <Link
      to={`/topics/${revision.topic_id}`}
      className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white p-3 transition-all hover:border-brand-100 hover:bg-brand-50/40"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            revision.status === "overdue"
              ? "bg-rose-50 text-rose-600"
              : revision.status === "due_today"
                ? "bg-brand-100 text-brand-700"
                : "bg-slate-100 text-slate-500"
          }`}
        >
          R{revision.revision_number}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">
            {revision.topic.title}
          </p>
          <p className="text-xs text-slate-400">
            {compact ? `${revision.topic.subject} · ` : ""}
            {formatDate(revision.scheduled_date)}
          </p>
        </div>
      </div>
      <span
        className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${
          revision.status === "overdue"
            ? "bg-rose-50 text-rose-600"
            : revision.status === "due_today"
              ? "bg-brand-50 text-brand-700"
              : "bg-emerald-50 text-emerald-600"
        }`}
      >
        {revision.status === "due_today"
          ? "Today"
          : revision.status === "overdue"
            ? "Overdue"
            : relativeDay(revision.scheduled_date)}
      </span>
    </Link>
  );
}

function buildChartData(upcoming: RevisionWithTopic[]): { label: string; count: number }[] {
  const today = new Date(todayISO());
  const days: { label: string; count: number }[] = [];
  for (let i = 0; i < 14; i++) {
    const date = new Date(today.getTime() + i * 86_400_000);
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
      date.getDate(),
    ).padStart(2, "0")}`;
    const count = upcoming.filter((revision) => revision.scheduled_date === iso).length;
    days.push({
      label:
        i === 0
          ? "Today"
          : date.toLocaleDateString("en-GB", { weekday: "short" }).slice(0, 2),
      count,
    });
  }
  return days;
}
export default DashboardPage;
