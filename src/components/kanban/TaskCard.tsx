import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { GripVertical, Trash2 } from "lucide-react";
import type { Task, TaskStatus } from "@/lib/tasks";
import { STATUS_META } from "@/lib/tasks";

const TAG_BY_STATUS: Record<TaskStatus, { text: string; cls: string }> = {
  todo: { text: "TO DO", cls: "text-amber-700 bg-amber-100" },
  in_progress: { text: "IN PROGRESS", cls: "text-sky-700 bg-sky-100" },
  done: { text: "DONE", cls: "text-emerald-700 bg-emerald-100" },
};

export function TaskCard({
  task,
  onClick,
  onDelete,
}: {
  task: Task;
  onClick: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "task", task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const tag = TAG_BY_STATUS[task.status];
  const accent = STATUS_META[task.status];

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 350, damping: 30 }}
      onClick={onClick}
      className="group relative cursor-pointer rounded-2xl bg-surface p-4 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-soft)] transition-shadow overflow-hidden"
    >
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent.accent}`} />
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={`text-[10px] font-bold tracking-wider px-2 py-1 rounded-md ${tag.cls}`}>
          {tag.text}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
            aria-label="Delete task"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded-md hover:bg-surface-muted text-muted-foreground cursor-grab active:cursor-grabbing"
            aria-label="Drag handle"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <h3 className="font-semibold text-[15px] leading-snug mb-1 line-clamp-2">{task.title}</h3>
      {task.description && (
        <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
      )}
    </motion.div>
  );
}
