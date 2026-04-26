import { Link } from "@tanstack/react-router";
import { LayoutGrid, Home, BarChart3, MessageSquare, Clock, Settings } from "lucide-react";

const items = [
  { icon: Home, label: "Home", to: "/" as const },
  { icon: LayoutGrid, label: "Dashboard", to: "/" as const },
  { icon: BarChart3, label: "Analytics", to: "/analytics" as const },
  { icon: MessageSquare, label: "Chat", to: "/" as const },
  { icon: Clock, label: "Time Manage", to: "/" as const },
  { icon: Settings, label: "Settings", to: "/" as const },
];

export function Sidebar() {
  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col rounded-3xl bg-surface p-6 shadow-[var(--shadow-soft)]">
      <Link to="/" className="flex items-center gap-2 mb-10">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand to-brand-purple flex items-center justify-center text-white font-bold">
          K
        </div>
        <span className="font-display font-bold text-lg">Kanvas</span>
      </Link>

      <nav className="flex flex-col gap-1">
        {items.map(({ icon: Icon, label, to }) => (
          <Link
            key={label}
            to={to}
            activeOptions={{ exact: true }}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors text-muted-foreground hover:bg-surface-muted hover:text-foreground"
            activeProps={{ className: "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium bg-foreground text-background hover:bg-foreground hover:text-background" }}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
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
