import { cn } from "@/lib/utils";

type Tone = "accent" | "success" | "warning" | "error" | "brown";

const toneToVar: Record<Tone, string> = {
  accent: "var(--color-accent)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  error: "var(--color-destructive)",
  brown: "var(--color-brown)",
};

export function ProgressBar({
  value,
  tone = "accent",
  size = "md",
  indeterminate = false,
  className,
  showValue = false,
  label,
}: {
  value?: number; // 0..100
  tone?: Tone;
  size?: "xs" | "sm" | "md";
  indeterminate?: boolean;
  className?: string;
  showValue?: boolean;
  label?: string;
}) {
  const h = size === "xs" ? "h-1" : size === "sm" ? "h-1.5" : "h-2";
  const pct = Math.max(0, Math.min(100, value ?? 0));

  return (
    <div className={cn("w-full", className)}>
      {(label || showValue) && (
        <div className="mb-1 flex items-center justify-between text-[11px] text-[var(--color-brown)]">
          <span className="truncate">{label}</span>
          {showValue && <span className="tabular-nums">{Math.round(pct)}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : pct}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)]",
          h,
        )}
      >
        {indeterminate ? (
          <div className="absolute inset-y-0 w-1/3 rounded-full animate-sp-scan" style={{ background: toneToVar[tone] }}>
            <span className="scan-bar" />
          </div>
        ) : (
          <div
            className="h-full rounded-full transition-[width] duration-500 ease-out"
            style={{ width: `${pct}%`, background: toneToVar[tone] }}
          />
        )}
      </div>
    </div>
  );
}
