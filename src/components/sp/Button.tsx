import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "accent" | "danger" | "success";
type Size = "sm" | "md" | "lg" | "icon";

export interface SpButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap rounded-md " +
  "transition-[background,color,box-shadow,transform] duration-150 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] " +
  "disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-px";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--color-brown-dark)] text-[var(--color-surface-raised)] hover:bg-[var(--color-brown)] bevel",
  secondary:
    "bg-[var(--color-surface-raised)] text-[var(--color-brown-dark)] border border-[var(--color-border-strong)] hover:bg-[var(--color-surface)] bevel",
  ghost:
    "bg-transparent text-[var(--color-brown-dark)] hover:bg-[var(--color-secondary)]",
  accent:
    "bg-[var(--color-accent)] text-[var(--color-accent-foreground)] hover:brightness-105 bevel",
  danger:
    "bg-[var(--color-destructive)] text-[var(--color-destructive-foreground)] hover:brightness-105 bevel",
  success:
    "bg-[var(--color-success)] text-[var(--color-success-foreground)] hover:brightness-105 bevel",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-4 text-sm",
  lg: "h-11 px-6 text-base",
  icon: "h-9 w-9 p-0",
};

export const SpButton = forwardRef<HTMLButtonElement, SpButtonProps>(function SpButton(
  { className, variant = "primary", size = "md", loading, leadingIcon, trailingIcon, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : leadingIcon}
      {children}
      {!loading && trailingIcon}
    </button>
  );
});
