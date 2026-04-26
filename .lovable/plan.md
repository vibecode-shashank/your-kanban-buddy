## Kanban Board with AI Assistant

A beautifully designed, interactive 3-column Kanban board styled after the Voostox / Tasks reference designs — clean, airy, soft shadows, rounded cards, vibrant accent colors, playful motion.

### Board
- **Three fixed columns**: To Do, In Progress, Done — each with task count badge and a "+" button to add a card.
- **Task cards**: title + description, subtle hover lift, smooth drag-and-drop between columns with animated reordering.
- **Inline create / edit**: click "+" to add, click a card to open an edit drawer.
- **Delete** task with confirm.
- Empty-column placeholder ("Drag a card here") matching the reference.

### Visual design
- Light, airy background with soft pastel shapes/blobs in corners (orange, purple, green accents from reference).
- Rounded sidebar with logo, nav items, and a user avatar pill at the bottom.
- Top bar: search field, "My tasks" pill, dark "+ New project" button.
- Big bold page title ("My Board") with edit affordance.
- Cards use rounded-2xl, soft shadow, color-coded category accent strip.
- Smooth Framer-Motion-style animations for drag, hover, add/remove, and column transitions.
- Fully responsive — sidebar collapses on mobile, columns become a horizontal swipe.

### Cloud persistence (no login yet)
- Tasks saved to the cloud database so the board survives reloads and is available from any device on the same URL.
- Schema: a single `tasks` table (id, title, description, status, position, timestamps).
- Optimistic updates so drag-and-drop feels instant; syncs in background.
- Designed so per-user accounts can be layered on later without rework.

### AI Assistant (floating chat)
- Floating chat button (bottom-right) that opens a side panel.
- Streaming responses, markdown rendering, conversation history within the session.
- The assistant can **read, create, update, move, and delete tasks** through tool calls — e.g.:
  - "Add a task to draft the homepage copy in To Do"
  - "Move 'Fix login bug' to Done"
  - "What's still in progress?"
  - "Clear all done tasks"
- Powered by Lovable AI (no setup needed). Changes made by the AI appear on the board live.

### Out of scope (for now)
- Login / per-user boards (deliberately deferred — easy to add later).
- Priorities, due dates, tags, assignees, multiple boards.
- Comments, attachments, calendar/timeline views.

After approval I'll set up Lovable Cloud (database + AI), build the board UI, wire up persistence, and add the AI chat with task-management tools.