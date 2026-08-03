import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
}

/**
 * Super Cleaner logo.
 * A small monogrammed tile ("SC") reminiscent of a desktop app icon,
 * paired with the wordmark. Uses only design-system tokens.
 */
export function Logo({ className, size = "md", showWordmark = true }: LogoProps) {
  const tileSize = size === "sm" ? "h-7 w-7 text-[11px]" : size === "lg" ? "h-11 w-11 text-lg" : "h-9 w-9 text-sm";
  const wordSize = size === "sm" ? "text-sm" : size === "lg" ? "text-xl" : "text-base";

  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <div
        aria-hidden
        className={cn(
          "relative grid place-items-center rounded-md font-mono font-bold tracking-tight",
          "bg-[var(--color-brown-dark)] text-[var(--color-surface-raised)] bevel",
          tileSize,
        )}
      >
        <span className="leading-none">SC</span>
        <span className="absolute right-0.5 bottom-0.5 h-1 w-1 rounded-full bg-[var(--color-accent)]" />
      </div>
      {showWordmark && (
        <div className={cn("flex flex-col leading-none", wordSize)}>
          <span className="font-semibold text-[var(--color-brown-dark)]">Super Cleaner</span>
          <span className="mt-0.5 text-[10px] font-normal uppercase tracking-[0.14em] text-[var(--color-brown)]/70">
            Data janitor
          </span>
        </div>
      )}
    </div>
  );
}
