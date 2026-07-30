import { Link, useRouterState } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Settings, Info, LayoutGrid, HomeIcon, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Accueil", icon: HomeIcon },
  { to: "/workspace", label: "Workspace", icon: LayoutGrid },
  { to: "/settings", label: "Paramètres", icon: Settings },
  { to: "/about", label: "À propos", icon: Info },
  { to: "/design-system", label: "Design system", icon: Sparkles },
] as const;

export function AppHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]/85 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-surface-raised)]/75">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-2.5 sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <Link to="/" className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] rounded-md">
            <Logo />
          </Link>
          <nav className="hidden md:flex items-center gap-0.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-sunken)] p-0.5">
            {nav.map((n) => {
              const active = pathname === n.to || (n.to !== "/" && pathname.startsWith(n.to));
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  title={n.label}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[12.5px] font-medium transition-colors",
                    active
                      ? "bg-[var(--color-surface-raised)] text-[var(--color-brown-dark)] bevel"
                      : "text-[var(--color-brown)] hover:text-[var(--color-brown-dark)] hover:bg-[var(--color-surface-raised)]/60",
                  )}
                >
                  <n.icon className="h-3.5 w-3.5 shrink-0" />
                  <span className={cn(active ? "inline" : "hidden lg:inline")}>{n.label}</span>
                </Link>

              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-[var(--color-brown)]">
          <span className="hidden lg:inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-2 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
            Traitement 100% local
          </span>
          <span className="hidden sm:inline text-[var(--color-brown)]/70 tabular-nums">v0.1</span>
        </div>
      </div>
    </header>
  );
}
