import { useState, type DragEvent } from "react";
import { cn } from "@/lib/utils";
import { FileSpreadsheet, Upload } from "lucide-react";
import { SpButton } from "./Button";

export function FileDrop({
  onFile,
  className,
  compact = false,
}: {
  onFile?: (file: { name: string; size: number }) => void;
  className?: string;
  compact?: boolean;
}) {
  const [over, setOver] = useState(false);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onFile?.({ name: f.name, size: f.size });
  };

  const pickDemo = () => onFile?.({ name: "clients_2024_export.xlsx", size: 428_310 });

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={handleDrop}
      className={cn(
        "relative w-full rounded-xl border-2 border-dashed transition-colors duration-200",
        "bg-[var(--color-surface-raised)]",
        over
          ? "border-[var(--color-accent)] bg-[color-mix(in_oklab,var(--color-accent)_6%,var(--color-surface-raised))]"
          : "border-[var(--color-border-strong)] hover:border-[var(--color-brown)]",
        compact ? "p-6" : "p-12",
        className,
      )}
    >
      {/* Subtle graph paper backdrop */}
      <div className="pointer-events-none absolute inset-0 rounded-xl bg-grid-sm opacity-[0.35]" />

      <div className="relative flex flex-col items-center text-center">
        <div
          className={cn(
            "grid place-items-center rounded-lg bevel transition-transform duration-200",
            "bg-[var(--color-surface)] text-[var(--color-brown)]",
            compact ? "h-11 w-11" : "h-14 w-14",
            over && "-translate-y-1 scale-105 text-[var(--color-accent)]",
          )}
        >
          {over ? <Upload className={compact ? "h-5 w-5" : "h-6 w-6"} /> : <FileSpreadsheet className={compact ? "h-5 w-5" : "h-6 w-6"} />}
        </div>

        <h3 className={cn("mt-4 font-semibold text-[var(--color-brown-dark)]", compact ? "text-base" : "text-lg")}>
          {over ? "Déposez le fichier ici" : "Glissez un fichier .xlsx ou .csv"}
        </h3>
        <p className="mt-1 max-w-md text-sm text-[var(--color-brown)]">
          Le fichier est traité localement dans votre navigateur. Rien n'est envoyé, rien n'est stocké.
        </p>

        <div className="mt-5 flex items-center gap-3">
          <SpButton variant="primary" size="md" onClick={pickDemo} leadingIcon={<Upload className="h-4 w-4" />}>
            Choisir un fichier
          </SpButton>
          <SpButton variant="ghost" size="md" onClick={pickDemo}>
            Utiliser un fichier d'exemple
          </SpButton>
        </div>

        <p className="mt-4 text-[11px] uppercase tracking-[0.14em] text-[var(--color-brown)]/70">
          .xlsx · .csv · .tsv — jusqu'à 200 Mo
        </p>
      </div>
    </div>
  );
}
