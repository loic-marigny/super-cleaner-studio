import { useRef, useState, type DragEvent } from "react";
import { FileSpreadsheet, Upload } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { SpButton } from "./Button";

export function FileDrop({
  onFile,
  onDemo,
  className,
  compact = false,
  disabled = false,
}: {
  onFile?: (file: File) => void;
  onDemo?: () => void;
  className?: string;
  compact?: boolean;
  disabled?: boolean;
}) {
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { t } = useI18n();

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    if (disabled) return;
    setOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) onFile?.(file);
  };

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={handleDrop}
      className={cn(
        "relative w-full rounded-xl border-2 border-dashed transition-colors duration-200",
        "bg-[var(--color-surface-raised)]",
        disabled
          ? "border-[var(--color-border)] opacity-70"
          : over
            ? "border-[var(--color-accent)] bg-[color-mix(in_oklab,var(--color-accent)_6%,var(--color-surface-raised))]"
            : "border-[var(--color-border-strong)] hover:border-[var(--color-brown)]",
        compact ? "p-6" : "p-12",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 rounded-xl bg-grid-sm opacity-[0.35]" />

      <div className="relative flex flex-col items-center text-center">
        <div
          className={cn(
            "grid place-items-center rounded-lg bevel transition-transform duration-200",
            "bg-[var(--color-surface)] text-[var(--color-brown)]",
            compact ? "h-11 w-11" : "h-14 w-14",
            over && !disabled && "-translate-y-1 scale-105 text-[var(--color-accent)]",
          )}
        >
          {over ? <Upload className={compact ? "h-5 w-5" : "h-6 w-6"} /> : <FileSpreadsheet className={compact ? "h-5 w-5" : "h-6 w-6"} />}
        </div>

        <h3 className={cn("mt-4 font-semibold text-[var(--color-brown-dark)]", compact ? "text-base" : "text-lg")}>
          {over ? t("fileDrop.overTitle") : t("fileDrop.idleTitle")}
        </h3>
        <p className="mt-1 max-w-md text-sm text-[var(--color-brown)]">{t("fileDrop.description")}</p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <SpButton
            variant="primary"
            size="md"
            onClick={() => inputRef.current?.click()}
            leadingIcon={<Upload className="h-4 w-4" />}
            disabled={disabled}
          >
            {t("fileDrop.chooseFile")}
          </SpButton>
          <SpButton variant="ghost" size="md" onClick={onDemo} disabled={disabled}>
            {t("fileDrop.useDemo")}
          </SpButton>
        </div>

        <p className="mt-4 text-[11px] uppercase tracking-[0.14em] text-[var(--color-brown)]/70">
          {t("fileDrop.footer")}
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            onFile?.(file);
          }
          event.currentTarget.value = "";
        }}
      />
    </div>
  );
}
