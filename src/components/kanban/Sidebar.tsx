import { LayoutGrid, Home, BarChart3, MessageSquare, Clock, Settings } from "lucide-react";

const items = [
  { icon: Home, label: "Home" },
  { icon: LayoutGrid, label: "Dashboard", active: true },
  { icon: BarChart3, label: "Analytics" },
  { icon: MessageSquare, label: "Chat" },
  { icon: Clock, label: "Time Manage" },
  { icon: Settings, label: "Settings" },
];

export function Sidebar() {
  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col rounded-3xl bg-surface p-6 shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-2 mb-10">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand to-brand-purple flex items-center justify-center text-white font-bold">
          K
        </div>
        <span className="font-display font-bold text-lg">Kanvas</span>
      </div>

      <nav className="flex flex-col gap-1">
        {items.map(({ icon: Icon, label, active }) => (
          <button
            key={label}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>

      <div className="mt-auto flex items-center gap-3 rounded-2xl bg-surface-muted p-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-amber to-brand ring-2 ring-brand/40" />
        <div className="text-sm">
          <div className="font-semibold leading-tight">You</div>
          <div className="text-xs text-muted-foreground">Board owner</div>
        </div>
      </div>
    </aside>
  );
}
