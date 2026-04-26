import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Activity } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { Sidebar } from "@/components/kanban/Sidebar";
import { fetchTasks, STATUSES, STATUS_META, type Task, type TaskStatus } from "@/lib/tasks";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Kanvas" },
      { name: "description", content: "Live insights into your kanban board: counts, percentages, and timeline." },
    ],
  }),
  component: AnalyticsPage,
});

const RANGES = [
  { label: "7d", days: 7 },
  { label: "14d", days: 14 },
  { label: "30d", days: 30 },
];

function AnalyticsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(14);

  async function reload() {
    const data = await fetchTasks();
    setTasks(data);
  }

  useEffect(() => {
    reload().finally(() => setLoading(false));

    const channel = supabase
      .channel("analytics-tasks")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => {
        reload();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const total = tasks.length;
  const counts = useMemo(() => {
    const c: Record<TaskStatus, number> = { todo: 0, in_progress: 0, done: 0 };
    for (const t of tasks) c[t.status]++;
    return c;
  }, [tasks]);

  const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 100));

  const timeline = useMemo(() => buildTimeline(tasks, days), [tasks, days]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="blob bg-brand-amber" style={{ width: 380, height: 380, top: -120, left: -100 }} />
      <div className="blob bg-brand-purple" style={{ width: 320, height: 320, top: -80, right: -80 }} />
      <div className="blob bg-brand-green" style={{ width: 260, height: 260, bottom: -100, left: 200 }} />

      <div className="relative z-10 flex gap-5 p-4 lg:p-6 min-h-screen">
        <Sidebar />

        <main className="flex-1 flex flex-col rounded-3xl bg-surface/80 backdrop-blur-xl p-5 lg:p-8 shadow-[var(--shadow-soft)] min-w-0">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-2">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to board
              </Link>
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">Analytics</h1>
              <p className="text-muted-foreground mt-2 flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Live · {total} task{total === 1 ? "" : "s"} tracked
              </p>
            </div>
            <div className="flex gap-1 rounded-2xl bg-surface-muted p-1">
              {RANGES.map((r) => (
                <button
                  key={r.label}
                  onClick={() => setDays(r.days)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    days === r.days ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">Loading analytics...</div>
          ) : (
            <div className="flex-1 grid gap-5">
              {/* KPI cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {STATUSES.map((s, i) => (
                  <KpiCard
                    key={s}
                    status={s}
                    count={counts[s]}
                    pct={pct(counts[s])}
                    delay={i * 0.08}
                  />
                ))}
              </div>

              {/* Donut + progress */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="rounded-3xl bg-surface p-6 shadow-[var(--shadow-card)] flex flex-col items-center justify-center">
                  <DonutRing counts={counts} total={total} />
                  <div className="mt-3 text-sm font-semibold">Completion</div>
                  <div className="text-xs text-muted-foreground">{pct(counts.done)}% done</div>
                </div>

                <div className="lg:col-span-2 rounded-3xl bg-surface p-6 shadow-[var(--shadow-card)]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold">Distribution</h3>
                    <span className="text-xs text-muted-foreground">{total} total</span>
                  </div>
                  <div className="h-3 w-full rounded-full overflow-hidden flex bg-surface-muted">
                    {STATUSES.map((s) => {
                      const w = pct(counts[s]);
                      if (w === 0) return null;
                      const color = s === "todo" ? "bg-amber-400" : s === "in_progress" ? "bg-sky-500" : "bg-emerald-500";
                      return (
                        <motion.div
                          key={s}
                          initial={{ width: 0 }}
                          animate={{ width: `${w}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className={color}
                        />
                      );
                    })}
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-3">
                    {STATUSES.map((s) => (
                      <div key={s} className="rounded-2xl bg-surface-muted p-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className={`h-2 w-2 rounded-full ${STATUS_META[s].dot}`} />
                          {STATUS_META[s].label}
                        </div>
                        <div className="mt-1 flex items-baseline gap-2">
                          <span className="text-2xl font-bold">{counts[s]}</span>
                          <span className="text-xs font-semibold text-muted-foreground">{pct(counts[s])}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="rounded-3xl bg-surface p-6 shadow-[var(--shadow-card)] flex-1 min-h-[320px] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-brand" />
                    <h3 className="font-bold">Timeline · last {days} days</h3>
                  </div>
                  <div className="text-xs text-muted-foreground">Created · Completed · Active</div>
                </div>
                <div className="flex-1 min-h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gCreated" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#a855f7" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gDone" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gActive" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 260)" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="oklch(0.6 0.02 260)" />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="oklch(0.6 0.02 260)" />
                      <Tooltip
                        contentStyle={{
                          background: "white",
                          border: "1px solid oklch(0.92 0.013 255)",
                          borderRadius: 12,
                          fontSize: 12,
                          boxShadow: "0 10px 40px -12px oklch(0.4 0.04 260 / 0.18)",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Area type="monotone" dataKey="Created" stroke="#a855f7" strokeWidth={2} fill="url(#gCreated)" />
                      <Area type="monotone" dataKey="Completed" stroke="#10b981" strokeWidth={2} fill="url(#gDone)" />
                      <Area type="monotone" dataKey="Active" stroke="#f59e0b" strokeWidth={2} fill="url(#gActive)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function KpiCard({ status, count, pct, delay }: { status: TaskStatus; count: number; pct: number; delay: number }) {
  const meta = STATUS_META[status];
  const color = status === "todo" ? "from-amber-400/20 to-amber-200/0" : status === "in_progress" ? "from-sky-500/20 to-sky-200/0" : "from-emerald-500/20 to-emerald-200/0";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`relative overflow-hidden rounded-3xl bg-surface p-6 shadow-[var(--shadow-card)]`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${color} pointer-events-none`} />
      <div className="relative">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
          {meta.label}
        </div>
        <div className="mt-3 flex items-baseline gap-3">
          <motion.span
            key={count}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 280, damping: 20 }}
            className="text-5xl font-bold tracking-tight"
          >
            {count}
          </motion.span>
          <span className="text-lg font-bold text-muted-foreground">{pct}%</span>
        </div>
      </div>
    </motion.div>
  );
}

function DonutRing({ counts, total }: { counts: Record<TaskStatus, number>; total: number }) {
  const size = 160;
  const stroke = 18;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  const segments: Array<{ frac: number; color: string }> = [
    { frac: total ? counts.todo / total : 0, color: "#f59e0b" },
    { frac: total ? counts.in_progress / total : 0, color: "#0ea5e9" },
    { frac: total ? counts.done / total : 0, color: "#10b981" },
  ];

  let offset = 0;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="oklch(0.94 0.005 260)" strokeWidth={stroke} fill="none" />
        {segments.map((seg, i) => {
          const len = seg.frac * c;
          const dash = `${len} ${c - len}`;
          const dashOffset = -offset;
          offset += len;
          return (
            <motion.circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={seg.color}
              strokeWidth={stroke}
              fill="none"
              strokeLinecap="round"
              initial={{ strokeDasharray: `0 ${c}` }}
              animate={{ strokeDasharray: dash }}
              transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.1 }}
              style={{ strokeDashoffset: dashOffset }}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-bold">{total}</div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</div>
      </div>
    </div>
  );
}

function buildTimeline(tasks: Task[], days: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const buckets: Array<{ date: Date; label: string; Created: number; Completed: number; Active: number }> = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    buckets.push({
      date: d,
      label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      Created: 0,
      Completed: 0,
      Active: 0,
    });
  }

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  for (const t of tasks) {
    const created = new Date(t.created_at);
    const updated = new Date(t.updated_at);
    for (const b of buckets) {
      if (sameDay(created, b.date)) b.Created++;
      if (t.status === "done" && sameDay(updated, b.date)) b.Completed++;
    }
  }

  // Active = running count of not-done tasks created on or before each bucket
  for (const b of buckets) {
    let active = 0;
    const eod = new Date(b.date);
    eod.setHours(23, 59, 59, 999);
    for (const t of tasks) {
      const created = new Date(t.created_at);
      if (created <= eod) {
        if (t.status !== "done") active++;
        else if (new Date(t.updated_at) > eod) active++;
      }
    }
    b.Active = active;
  }

  return buckets.map(({ date, ...rest }) => rest);
}
