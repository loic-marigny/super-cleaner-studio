import { cn } from "@/lib/utils";

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <label className={cn("flex items-start gap-3 cursor-pointer select-none", disabled && "opacity-50 cursor-not-allowed")}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 h-5 w-9 shrink-0 rounded-full border transition-colors bevel",
          checked
            ? "bg-[var(--color-accent)] border-[var(--color-accent)]"
            : "bg-[var(--color-surface-sunken)] border-[var(--color-border-strong)]",
        )}
      >
        <span
          className={cn(
            "absolute top-[1px] left-[1px] h-[16px] w-[16px] rounded-full bg-[var(--color-surface-raised)] shadow transition-transform",
            checked && "translate-x-4",
          )}
        />
      </button>
      {(label || description) && (
        <div className="min-w-0">
          {label && <div className="text-sm font-medium text-[var(--color-brown-dark)]">{label}</div>}
          {description && <div className="text-[12px] text-[var(--color-brown)]">{description}</div>}
        </div>
      )}
    </label>
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <label className={cn("flex items-start gap-3 cursor-pointer select-none", disabled && "opacity-50 cursor-not-allowed")}>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-[4px] border transition-colors bevel",
          checked
            ? "bg-[var(--color-accent)] border-[var(--color-accent)] text-[var(--color-accent-foreground)]"
            : "bg-[var(--color-surface-raised)] border-[var(--color-border-strong)]",
        )}
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M2 6.5l2.5 2.5L10 3.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      {(label || description) && (
        <div className="min-w-0">
          {label && <div className="text-sm text-[var(--color-brown-dark)]">{label}</div>}
          {description && <div className="text-[12px] text-[var(--color-brown)]">{description}</div>}
        </div>
      )}
    </label>
  );
}
