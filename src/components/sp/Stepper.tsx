import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface Step {
  key: string;
  label: string;
}

export function Stepper({
  steps,
  currentIndex,
  className,
  /** "auto" masque les libellés inactifs sur les écrans étroits. */
  density = "auto",
}: {
  steps: Step[];
  currentIndex: number;
  className?: string;
  density?: "auto" | "full" | "compact";
}) {
  return (
    <ol className={cn("flex min-w-0 items-center gap-1.5 text-[12px]", className)}>
      {steps.map((s, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <li key={s.key} className="flex min-w-0 items-center gap-1.5">
            <div
              className={cn(
                "grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-semibold transition-colors",
                done && "bg-[var(--color-success)] text-[var(--color-success-foreground)]",
                active && "bg-[var(--color-accent)] text-[var(--color-accent-foreground)] animate-sp-pulse-soft",
                !done && !active && "bg-[var(--color-surface-sunken)] text-[var(--color-brown)] border border-[var(--color-border-strong)]",
              )}
              title={s.label}
            >
              {done ? <Check className="h-3 w-3" /> : i + 1}
            </div>
            <span
              className={cn(
                "truncate font-medium",
                active ? "text-[var(--color-brown-dark)]" : "text-[var(--color-brown)]",
                density === "compact" && "sr-only",
                density === "auto" && !active && "hidden xl:inline",
                density === "auto" && active && "hidden lg:inline",
              )}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <span className="mx-0.5 h-px w-3 shrink-0 bg-[var(--color-border-strong)] xl:w-6" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
