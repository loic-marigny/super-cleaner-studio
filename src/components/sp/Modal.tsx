import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SpButton } from "./Button";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const sizeCls =
    size === "sm" ? "max-w-sm" : size === "md" ? "max-w-lg" : size === "lg" ? "max-w-2xl" : "max-w-4xl";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 animate-sp-fade-in">
      <div className="absolute inset-0 bg-[var(--color-brown-dark)]/25 backdrop-blur-[2px]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] shadow-floating",
          sizeCls,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] px-5 py-3.5">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-[var(--color-brown-dark)]">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-[var(--color-brown)]">{description}</p>}
          </div>
          <SpButton variant="ghost" size="icon" onClick={onClose} aria-label="Fermer">
            <X className="h-4 w-4" />
          </SpButton>
        </div>
        <div className="max-h-[70vh] overflow-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
