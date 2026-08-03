import { Link, useRouterState } from "@tanstack/react-router";
import { Settings, Info, LayoutGrid, HomeIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";

const nav = [
  { to: "/", labelKey: "nav.home", icon: HomeIcon },
  { to: "/workspace", labelKey: "nav.workspace", icon: LayoutGrid },
  { to: "/settings", labelKey: "nav.settings", icon: Settings },
  { to: "/about", labelKey: "nav.about", icon: Info },
] as const;

export function AppHeader() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { locale, setLocale, t } = useI18n();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]/85 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-surface-raised)]/75">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-2.5 sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <Link to="/" className="shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-0.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-sunken)] p-0.5 md:flex">
            {nav.map((item) => {
              const active = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
              const label = t(item.labelKey);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  title={label}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[12.5px] font-medium transition-colors",
                    active
                      ? "bg-[var(--color-surface-raised)] text-[var(--color-brown-dark)] bevel"
                      : "text-[var(--color-brown)] hover:bg-[var(--color-surface-raised)]/60 hover:text-[var(--color-brown-dark)]",
                  )}
                >
                  <item.icon className="h-3.5 w-3.5 shrink-0" />
                  <span className={cn(active ? "inline" : "hidden lg:inline")}>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center justify-end">
          <div
            className="inline-flex items-center gap-1 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-sunken)] p-0.5"
            aria-label={t("common.language")}
            title={t("common.language")}
          >
            {(["fr", "en", "ru", "zh"] as const).map((nextLocale) => {
              const active = locale === nextLocale;
              return (
                <button
                  key={nextLocale}
                  type="button"
                  onClick={() => setLocale(nextLocale)}
                  className={cn(
                    "rounded px-2.5 py-1 text-[12px] font-medium transition-colors",
                    active
                      ? "bg-[var(--color-surface-raised)] text-[var(--color-brown-dark)] bevel"
                      : "text-[var(--color-brown)] hover:bg-[var(--color-surface-raised)]/60 hover:text-[var(--color-brown-dark)]",
                  )}
                >
                  {t(`common.locale.${nextLocale}`)}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
