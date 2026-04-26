import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import type { Task, TaskStatus } from "@/lib/tasks";
import { STATUS_META } from "@/lib/tasks";
import { TaskCard } from "./TaskCard";

export function Column({
  status,
  tasks,
  onAdd,
  onEdit,
  onDelete,
}: {
  status: TaskStatus;
  tasks: Task[];
  onAdd: () => void;
  onEdit: (t: Task) => void;
  onDelete: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status, data: { type: "column", status } });
  const meta = STATUS_META[status];

  return (
    <div className="flex flex-col min-w-[280px] flex-1">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
          <h2 className="font-bold text-base">{meta.label}</h2>
          <span className="text-xs font-semibold text-muted-foreground bg-surface-muted px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={onAdd}
          className="h-7 w-7 rounded-lg hover:bg-surface-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
          aria-label={`Add task to ${meta.label}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 rounded-2xl p-2 space-y-3 transition-colors min-h-[200px] ${
          isOver ? "bg-brand/5 ring-2 ring-brand/40 ring-dashed" : ""
        }`}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence>
            {tasks.map((t) => (
              <TaskCard key={t.id} task={t} onClick={() => onEdit(t)} onDelete={() => onDelete(t.id)} />
            ))}
          </AnimatePresence>
        </SortableContext>

        {tasks.length === 0 && (
          <motion.button
            onClick={onAdd}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full rounded-2xl border-2 border-dashed border-border/60 py-10 text-sm text-muted-foreground hover:border-brand/50 hover:text-foreground transition-colors"
          >
            Drop here or click to add
          </motion.button>
        )}
      </div>
    </div>
  );
}
