import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  closestCorners,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Search, Bell, Plus } from "lucide-react";
import { Sidebar } from "@/components/kanban/Sidebar";
import { Column } from "@/components/kanban/Column";
import { TaskCard } from "@/components/kanban/TaskCard";
import { TaskDialog } from "@/components/kanban/TaskDialog";
import { AIChat } from "@/components/kanban/AIChat";
import {
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
  STATUSES,
  type Task,
  type TaskStatus,
} from "@/lib/tasks";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kanvas — Beautiful Kanban with AI" },
      {
        name: "description",
        content: "A gorgeous, interactive kanban board with an AI assistant that manages your tasks for you.",
      },
    ],
  }),
  component: BoardPage,
});

function BoardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [dialog, setDialog] = useState<{ open: boolean; task: Task | null; status: TaskStatus }>({
    open: false,
    task: null,
    status: "todo",
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function reload() {
    const data = await fetchTasks();
    setTasks(data);
  }

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => {
    const g: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], done: [] };
    for (const t of tasks) g[t.status].push(t);
    for (const k of STATUSES) g[k].sort((a, b) => a.position - b.position);
    return g;
  }, [tasks]);

  function onDragStart(e: DragStartEvent) {
    const t = tasks.find((x) => x.id === e.active.id);
    setActiveTask(t ?? null);
  }

  async function onDragEnd(e: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = e;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    // Determine target column
    let targetStatus: TaskStatus = activeTask.status;
    if (STATUSES.includes(overId as TaskStatus)) {
      targetStatus = overId as TaskStatus;
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) targetStatus = overTask.status;
    }

    // Build new ordering
    const sameColumn = activeTask.status === targetStatus;
    const sourceList = grouped[activeTask.status];
    const targetList = sameColumn ? sourceList : grouped[targetStatus];

    let newTargetList: Task[];
    if (sameColumn) {
      const oldIndex = sourceList.findIndex((t) => t.id === activeId);
      const newIndex = sourceList.findIndex((t) => t.id === overId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
      newTargetList = arrayMove(sourceList, oldIndex, newIndex);
    } else {
      const overIndex = targetList.findIndex((t) => t.id === overId);
      const insertAt = overIndex === -1 ? targetList.length : overIndex;
      newTargetList = [
        ...targetList.slice(0, insertAt),
        { ...activeTask, status: targetStatus },
        ...targetList.slice(insertAt),
      ];
    }

    // Optimistic update
    const updates: Array<{ id: string; status: TaskStatus; position: number }> = [];
    const newTasks = tasks.map((t) => {
      if (!sameColumn && t.id === activeId) {
        return { ...t, status: targetStatus };
      }
      return t;
    });

    newTargetList.forEach((t, idx) => {
      const pos = idx * 1000;
      const original = tasks.find((x) => x.id === t.id);
      if (!original || original.position !== pos || original.status !== targetStatus) {
        updates.push({ id: t.id, status: targetStatus, position: pos });
      }
    });

    const finalTasks = newTasks.map((t) => {
      const u = updates.find((x) => x.id === t.id);
      return u ? { ...t, status: u.status, position: u.position } : t;
    });

    setTasks(finalTasks);

    await Promise.all(updates.map((u) => updateTask(u.id, { status: u.status, position: u.position })));
  }

  async function handleSave(input: { title: string; description: string; status: TaskStatus }) {
    if (dialog.task) {
      const updated = await updateTask(dialog.task.id, input);
      setTasks((ts) => ts.map((t) => (t.id === updated.id ? updated : t)));
    } else {
      const maxPos = Math.max(0, ...grouped[input.status].map((t) => t.position));
      const created = await createTask({ ...input, position: maxPos + 1000 });
      setTasks((ts) => [...ts, created]);
    }
    setDialog({ open: false, task: null, status: "todo" });
  }

  async function handleDelete(id: string) {
    setTasks((ts) => ts.filter((t) => t.id !== id));
    try {
      await deleteTask(id);
    } catch {
      reload();
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Decorative blobs */}
      <div className="blob bg-brand-amber" style={{ width: 380, height: 380, top: -120, left: -100 }} />
      <div className="blob bg-brand-purple" style={{ width: 320, height: 320, top: -80, right: -80 }} />
      <div className="blob bg-brand-green" style={{ width: 260, height: 260, bottom: -100, left: 200 }} />
      <div className="blob bg-brand" style={{ width: 300, height: 300, bottom: -80, right: 100, opacity: 0.35 }} />

      <div className="relative z-10 flex gap-5 p-4 lg:p-6 min-h-screen">
        <Sidebar />

        <main className="flex-1 flex flex-col rounded-3xl bg-surface/80 backdrop-blur-xl p-5 lg:p-8 shadow-[var(--shadow-soft)] min-w-0">
          {/* Top bar */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Search tasks..."
                className="w-full h-11 pl-11 pr-4 rounded-2xl bg-surface-muted text-sm outline-none focus:ring-2 focus:ring-brand/40"
              />
            </div>
            <button
              onClick={() => setDialog({ open: true, task: null, status: "todo" })}
              className="hidden sm:inline-flex items-center gap-2 h-11 px-5 rounded-2xl bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" /> New task
            </button>
            <button className="h-11 w-11 rounded-2xl bg-surface-muted flex items-center justify-center relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-brand" />
            </button>
          </div>

          {/* Title */}
          <div className="mb-8">
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">My Board</h1>
            <p className="text-muted-foreground mt-2">
              {tasks.length} task{tasks.length === 1 ? "" : "s"} · drag cards between columns, or ask the AI ✨
            </p>
          </div>

          {/* Board */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">Loading your board...</div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            >
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-5 overflow-x-auto pb-4">
                {STATUSES.map((s) => (
                  <Column
                    key={s}
                    status={s}
                    tasks={grouped[s]}
                    onAdd={() => setDialog({ open: true, task: null, status: s })}
                    onEdit={(t) => setDialog({ open: true, task: t, status: t.status })}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
              <DragOverlay>
                {activeTask ? (
                  <div className="rotate-2">
                    <TaskCard task={activeTask} onClick={() => {}} onDelete={() => {}} />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </main>
      </div>

      <TaskDialog
        open={dialog.open}
        task={dialog.task}
        defaultStatus={dialog.status}
        onClose={() => setDialog({ open: false, task: null, status: "todo" })}
        onSave={handleSave}
      />

      <AIChat tasks={tasks} onChange={reload} />
    </div>
  );
}
