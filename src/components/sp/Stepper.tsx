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
}: {
  steps: Step[];
  currentIndex: number;
  className?: string;
}) {
  return (
    <ol className={cn("flex items-center gap-2 text-[12px]", className)}>
      {steps.map((s, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <li key={s.key} className="flex items-center gap-2">
            <div
              className={cn(
                "grid h-5 w-5 place-items-center rounded-full text-[10px] font-semibold transition-colors",
                done && "bg-[var(--color-success)] text-[var(--color-success-foreground)]",
                active && "bg-[var(--color-accent)] text-[var(--color-accent-foreground)] animate-sp-pulse-soft",
                !done && !active && "bg-[var(--color-surface-sunken)] text-[var(--color-brown)] border border-[var(--color-border-strong)]",
              )}
            >
              {done ? <Check className="h-3 w-3" /> : i + 1}
            </div>
            <span className={cn("font-medium", active ? "text-[var(--color-brown-dark)]" : "text-[var(--color-brown)]")}>
              {s.label}
            </span>
            {i < steps.length - 1 && <span className="mx-1 h-px w-6 bg-[var(--color-border-strong)]" />}
          </li>
        );
      })}
    </ol>
  );
}
