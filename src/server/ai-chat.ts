import { createServerFn } from "@tanstack/react-start";

type ChatMessage = { role: "user" | "assistant" | "system" | "tool"; content: string; tool_call_id?: string; tool_calls?: any };

const TOOLS = [
  {
    type: "function",
    function: {
      name: "create_task",
      description: "Create a new task on the kanban board.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          status: { type: "string", enum: ["todo", "in_progress", "done"] },
        },
        required: ["title", "status"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_task",
      description: "Update the title, description, or status of an existing task by its id.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          status: { type: "string", enum: ["todo", "in_progress", "done"] },
        },
        required: ["id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_task",
      description: "Delete a task by id.",
      parameters: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
        additionalProperties: false,
      },
    },
  },
];

export const aiChat = createServerFn({ method: "POST" })
  .inputValidator((data: { messages: ChatMessage[]; tasks: Array<{ id: string; title: string; description: string; status: string }> }) => data)
  .handler(async ({ data }) => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a helpful assistant embedded in a kanban board app. You help the user manage their tasks.

Current tasks on the board (JSON):
${JSON.stringify(data.tasks, null, 2)}

Columns are: "todo" (To Do), "in_progress" (In Progress), "done" (Done).

When the user asks to create, update, move, or delete tasks, use the provided tools. To "move" a task, call update_task with the new status. Use the task id from the list above. After using tools, give a brief friendly confirmation. Be concise and warm.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...data.messages],
        tools: TOOLS,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return { error: "Rate limit hit, try again in a moment." };
      if (response.status === 402) return { error: "AI credits exhausted. Add funds in Settings → Workspace → Usage." };
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return { error: "AI service error." };
    }

    const json = await response.json();
    const msg = json.choices?.[0]?.message;
    return {
      content: msg?.content ?? "",
      toolCalls: (msg?.tool_calls ?? []).map((tc: any) => ({
        id: tc.id,
        name: tc.function.name,
        args: JSON.parse(tc.function.arguments || "{}"),
      })),
    };
  });
