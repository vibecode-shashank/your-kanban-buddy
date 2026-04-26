import { supabase } from "@/integrations/supabase/client";

export type TaskStatus = "todo" | "in_progress" | "done";

export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  position: number;
  created_at: string;
  updated_at: string;
};

export const STATUSES: TaskStatus[] = ["todo", "in_progress", "done"];

export const STATUS_META: Record<TaskStatus, { label: string; dot: string; accent: string }> = {
  todo: { label: "To Do", dot: "bg-amber-400", accent: "from-amber-200/60 to-transparent" },
  in_progress: { label: "In Progress", dot: "bg-sky-500", accent: "from-sky-200/60 to-transparent" },
  done: { label: "Done", dot: "bg-emerald-500", accent: "from-emerald-200/60 to-transparent" },
};

export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase.from("tasks").select("*").order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Task[];
}

export async function createTask(input: { title: string; description?: string; status: TaskStatus; position?: number }) {
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title: input.title,
      description: input.description ?? "",
      status: input.status,
      position: input.position ?? Date.now(),
    })
    .select()
    .single();
  if (error) throw error;
  return data as Task;
}

export async function updateTask(id: string, patch: Partial<Pick<Task, "title" | "description" | "status" | "position">>) {
  const { data, error } = await supabase.from("tasks").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data as Task;
}

export async function deleteTask(id: string) {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}
