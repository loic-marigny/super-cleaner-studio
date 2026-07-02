import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, className, leadingIcon, trailingIcon, id, ...props },
  ref,
) {
  const uid = id || `tf-${Math.random().toString(36).slice(2, 9)}`;
  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label htmlFor={uid} className="mb-1 block text-[12.5px] font-medium text-[var(--color-brown-dark)]">
          {label}
        </label>
      )}
      <div
        className={cn(
          "relative flex items-center rounded-md border bg-[var(--color-surface-raised)] transition-colors",
          "border-[var(--color-border-strong)] focus-within:border-[var(--color-accent)] focus-within:ring-2 focus-within:ring-[var(--color-accent)]/25",
          error && "border-[var(--color-destructive)] focus-within:ring-[var(--color-destructive)]/25",
        )}
      >
        {leadingIcon && <span className="pl-2.5 text-[var(--color-brown)]">{leadingIcon}</span>}
        <input
          ref={ref}
          id={uid}
          className={cn(
            "w-full bg-transparent px-3 py-2 text-sm text-[var(--color-brown-dark)] placeholder:text-[var(--color-brown)]/50 focus:outline-none",
            leadingIcon && "pl-2",
            trailingIcon && "pr-2",
          )}
          {...props}
        />
        {trailingIcon && <span className="pr-2.5 text-[var(--color-brown)]">{trailingIcon}</span>}
      </div>
      {(hint || error) && (
        <p className={cn("mt-1 text-[11.5px]", error ? "text-[var(--color-destructive)]" : "text-[var(--color-brown)]")}>
          {error || hint}
        </p>
      )}
    </div>
  );
});
