import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function CollapsiblePanel({
  title,
  subtitle,
  defaultOpen = false,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] shadow-panel",
        className,
      )}
    >
      <div className="flex items-center gap-3 px-4 py-2.5">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex flex-1 items-center gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] rounded"
        >
          <ChevronDown className={cn("h-4 w-4 text-[var(--color-brown)] transition-transform", open && "rotate-180")} />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[var(--color-brown-dark)]">{title}</div>
            {subtitle && <div className="text-[11.5px] text-[var(--color-brown)]">{subtitle}</div>}
          </div>
        </button>
        {action}
      </div>
      {open && (
        <div className="border-t border-[var(--color-border)] px-4 py-3 animate-sp-fade-in">{children}</div>
      )}
    </div>
  );
}
