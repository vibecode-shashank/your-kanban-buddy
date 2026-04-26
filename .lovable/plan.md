# Plan: Celebration, Voice, and Live Analytics

## 1. 🎉 Celebration effect when a task moves to Done

- Install `canvas-confetti` (`bun add canvas-confetti @types/canvas-confetti`).
- Create `src/components/kanban/Celebration.tsx`:
  - Imperative helper `celebrate()` that fires a multi-burst confetti show: stars (`shapes: ['star']`), circles, and emoji-style "balloons" via two side-cannons + a center burst.
  - Uses brand colors (amber, purple, sky, emerald, pink) to match the app palette.
  - Also overlays a brief Framer Motion layer of floating balloon (🎈) and sparkle (✨) emojis (~1.5s) so it feels festive even if confetti is blocked.
- Trigger points in `src/routes/index.tsx`:
  - In `onDragEnd`: when `targetStatus === "done"` AND the task was not already in `done`, call `celebrate()`.
  - In `handleSave`: if editing an existing task and status changes to `done`, call `celebrate()`.
- Trigger from AI as well: in `AIChat.tsx`, after executing tool calls, if any `update_task` set `status: "done"` for a task that wasn't already done, call `celebrate()`.

## 2. 🎤 Voice command in the AI chatbot

- Add a microphone button inside the chat input row in `src/components/kanban/AIChat.tsx`.
- Use the browser's built-in **Web Speech API** (`window.SpeechRecognition || webkitSpeechRecognition`) — no extra deps, no API key.
- Behavior:
  - Click mic → start listening, button pulses red, show "Listening…" placeholder.
  - Interim results stream into the input; on final result, auto-send the message.
  - Click mic again (or press Esc) to stop.
  - Graceful fallback: if API unavailable (e.g. Safari/Firefox without it), hide the button and show a small tooltip "Voice not supported in this browser" on hover of a disabled mic.
- Wrap logic in a small `useSpeechRecognition` hook in `src/hooks/use-speech-recognition.ts` for clarity.

## 3. 📊 Live Analytics page

- Create new route `src/routes/analytics.tsx` (`/analytics`).
- Update `Sidebar.tsx` to use TanStack `<Link>` so "Dashboard" → `/` and "Analytics" → `/analytics`, with `activeProps` for highlighting (replaces the hardcoded `active: true`).
- Analytics page contents (live, reads from the same `tasks` table):
  - **KPI cards** for each status showing **count** and **percentage** of total, with the column's accent color and dot.
  - **Donut/Progress ring** showing the share of done vs in-progress vs todo.
  - **Stacked horizontal progress bar** ("0% ────── 100%") visualizing completion.
  - **Timeline chart** (line/area) using `recharts` (already installed via shadcn `chart.tsx`):
    - X-axis: dates from the earliest task `created_at` to today (daily buckets, last 14 days by default with a 7d/14d/30d toggle).
    - Three series: tasks **created**, tasks **completed** (status changed to done — approximated by `updated_at` of done tasks per day), and **active** (running total of not-done).
- **Live updates**: subscribe to Postgres changes on `public.tasks` via Supabase Realtime so the page updates instantly when cards are moved on the board (or by the AI). Requires a small migration: `ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;` and `ALTER TABLE public.tasks REPLICA IDENTITY FULL;`.
- Reuse existing design tokens (rounded-3xl surface, soft shadow, decorative blobs) for visual consistency with the board.

## 4. Files touched

- **New**: `src/components/kanban/Celebration.tsx`, `src/hooks/use-speech-recognition.ts`, `src/routes/analytics.tsx`
- **Edited**: `src/routes/index.tsx` (trigger celebration), `src/components/kanban/AIChat.tsx` (mic + celebration on AI done), `src/components/kanban/Sidebar.tsx` (real navigation links)
- **Migration**: enable realtime for `tasks` table
- **Dependencies**: `canvas-confetti`, `@types/canvas-confetti`

## 5. Out of scope (can do next)

- Per-user analytics (needs auth)
- Persisting a true status-change history (currently we infer "completed at" from `updated_at` of done tasks — accurate for typical flows, but a dedicated `task_events` table would be more precise; happy to add if you want).
