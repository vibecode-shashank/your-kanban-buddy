import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, Loader2, Mic, MicOff } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useServerFn } from "@tanstack/react-start";
import { aiChat } from "@/server/ai-chat";
import type { Task, TaskStatus } from "@/lib/tasks";
import { createTask, updateTask, deleteTask } from "@/lib/tasks";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { celebrate } from "./Celebration";

type Msg = { role: "user" | "assistant"; content: string };

export function AIChat({ tasks, onChange }: { tasks: Task[]; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hey! I can create, move, update, or delete tasks for you. Just type or tap the mic 🎤 — e.g. *\"add a task to design the homepage\"* or *\"move 'fix login' to done\"*." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chat = useServerFn(aiChat);
  const tasksRef = useRef(tasks);
  useEffect(() => { tasksRef.current = tasks; }, [tasks]);

  const sendText = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setLoading(true);

    try {
      const currentTasks = tasksRef.current;
      const res = await chat({
        data: {
          messages: next,
          tasks: currentTasks.map((t) => ({ id: t.id, title: t.title, description: t.description, status: t.status })),
        },
      });

      if ("error" in res && res.error) {
        setMessages((m) => [...m, { role: "assistant", content: `⚠️ ${res.error}` }]);
        return;
      }

      let executed = 0;
      let movedToDone = false;
      for (const tc of (res as any).toolCalls ?? []) {
        try {
          if (tc.name === "create_task") {
            const created = await createTask({
              title: tc.args.title,
              description: tc.args.description ?? "",
              status: tc.args.status as TaskStatus,
            });
            if (created.status === "done") movedToDone = true;
          } else if (tc.name === "update_task") {
            const { id, ...patch } = tc.args;
            const before = currentTasks.find((t) => t.id === id);
            await updateTask(id, patch);
            if (patch.status === "done" && before && before.status !== "done") movedToDone = true;
          } else if (tc.name === "delete_task") {
            await deleteTask(tc.args.id);
          }
          executed++;
        } catch (e) {
          console.error("tool exec failed", tc, e);
        }
      }
      if (executed > 0) onChange();
      if (movedToDone) celebrate();

      const content = (res as any).content || (executed > 0 ? `Done — ${executed} change${executed > 1 ? "s" : ""} applied.` : "Hmm, I'm not sure how to help with that.");
      setMessages((m) => [...m, { role: "assistant", content }]);
    } catch (e) {
      console.error(e);
      setMessages((m) => [...m, { role: "assistant", content: "Something went wrong. Try again?" }]);
    } finally {
      setLoading(false);
    }
  }, [messages, loading, chat, onChange]);

  const { listening, supported, start, stop } = useSpeechRecognition({
    onInterim: (text) => setInput(text),
    onFinal: (text) => {
      setInput("");
      sendText(text);
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  function toggleMic() {
    if (listening) stop();
    else start();
  }

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-gradient-to-br from-brand to-brand-purple text-white shadow-[var(--shadow-soft)] flex items-center justify-center"
        aria-label="Open AI assistant"
      >
        <Sparkles className="h-6 w-6" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 32 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[420px] bg-surface shadow-[var(--shadow-soft)] flex flex-col"
          >
            <div className="flex items-center justify-between p-5 border-b border-border/50">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand to-brand-purple text-white flex items-center justify-center">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-bold text-sm">AI Assistant</div>
                  <div className="text-xs text-muted-foreground">Ask me to manage your board</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="p-2 rounded-full hover:bg-surface-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                      m.role === "user"
                        ? "bg-foreground text-background rounded-br-md"
                        : "bg-surface-muted text-foreground rounded-bl-md"
                    }`}
                  >
                    <div className="prose prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 [&_strong]:font-semibold">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-surface-muted rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking...
                  </div>
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendText(input);
              }}
              className="p-4 border-t border-border/50 flex gap-2 items-center"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={listening ? "Listening..." : "Ask me anything..."}
                className={`flex-1 rounded-xl bg-surface-muted px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand/50 ${listening ? "ring-2 ring-red-400/60" : ""}`}
              />
              <button
                type="button"
                onClick={toggleMic}
                disabled={!supported}
                title={supported ? (listening ? "Stop listening" : "Speak your command") : "Voice not supported in this browser"}
                className={`h-11 w-11 rounded-xl flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  listening
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-surface-muted text-foreground hover:bg-foreground/10"
                }`}
                aria-label={listening ? "Stop listening" : "Start voice input"}
              >
                {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="h-11 w-11 rounded-xl bg-foreground text-background flex items-center justify-center disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
