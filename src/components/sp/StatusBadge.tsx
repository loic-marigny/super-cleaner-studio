import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, AlertOctagon, Info, Loader2, Circle } from "lucide-react";

type Tone = "neutral" | "success" | "warning" | "error" | "info" | "loading";

const styles: Record<Tone, { wrap: string; icon: ReactNode }> = {
  neutral: {
    wrap: "bg-[var(--color-secondary)] text-[var(--color-brown-dark)] border-[var(--color-border-strong)]",
    icon: <Circle className="h-3 w-3" />,
  },
  success: {
    wrap: "bg-[color-mix(in_oklab,var(--color-success)_14%,var(--color-surface-raised))] text-[var(--color-success)] border-[color-mix(in_oklab,var(--color-success)_35%,transparent)]",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  warning: {
    wrap: "bg-[color-mix(in_oklab,var(--color-warning)_16%,var(--color-surface-raised))] text-[color-mix(in_oklab,var(--color-warning)_75%,var(--color-brown-dark))] border-[color-mix(in_oklab,var(--color-warning)_40%,transparent)]",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
  error: {
    wrap: "bg-[color-mix(in_oklab,var(--color-destructive)_12%,var(--color-surface-raised))] text-[var(--color-destructive)] border-[color-mix(in_oklab,var(--color-destructive)_35%,transparent)]",
    icon: <AlertOctagon className="h-3.5 w-3.5" />,
  },
  info: {
    wrap: "bg-[color-mix(in_oklab,var(--color-accent)_12%,var(--color-surface-raised))] text-[var(--color-accent)] border-[color-mix(in_oklab,var(--color-accent)_35%,transparent)]",
    icon: <Info className="h-3.5 w-3.5" />,
  },
  loading: {
    wrap: "bg-[var(--color-secondary)] text-[var(--color-brown)] border-[var(--color-border-strong)]",
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
  },
};

export function StatusBadge({
  tone = "neutral",
  children,
  className,
  showIcon = true,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  showIcon?: boolean;
}) {
  const s = styles[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-none",
        s.wrap,
        className,
      )}
    >
      {showIcon && s.icon}
      {children}
    </span>
  );
}
