import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { ProgressBar } from "./ProgressBar";
import { StatusBadge } from "./StatusBadge";
import { AlertTriangle, CheckCircle2, Hash, Calendar, Type, Mail } from "lucide-react";

export type ColumnType = "text" | "number" | "date" | "email";

export interface ColumnDef {
  key: string;
  name: string;
  type: ColumnType;
  progress: number; // 0..100
  issues: number;
  nulls: number;
  width?: number;
}

export interface CellFlag {
  invalid?: boolean;
  warning?: boolean;
  empty?: boolean;
}

export interface RowData {
  [key: string]: { value: string; flag?: CellFlag };
}

const typeIcon: Record<ColumnType, React.ReactNode> = {
  text: <Type className="h-3 w-3" />,
  number: <Hash className="h-3 w-3" />,
  date: <Calendar className="h-3 w-3" />,
  email: <Mail className="h-3 w-3" />,
};

const typeLabel: Record<ColumnType, string> = {
  text: "Texte",
  number: "Nombre",
  date: "Date",
  email: "Email",
};

export function Spreadsheet({
  columns,
  rows,
  className,
}: {
  columns: ColumnDef[];
  rows: RowData[];
  className?: string;
}) {
  const [selected, setSelected] = useState<{ r: number; c: number } | null>({ r: 0, c: 0 });
  const [widths, setWidths] = useState<Record<string, number>>(
    () => Object.fromEntries(columns.map((c) => [c.key, c.width ?? 168])),
  );

  const colTemplate = useMemo(
    () => `48px ${columns.map((c) => `${widths[c.key] ?? 168}px`).join(" ")}`,
    [columns, widths],
  );

  const startResize = (key: string, startX: number, startW: number) => {
    const move = (e: MouseEvent) => {
      const w = Math.max(80, startW + (e.clientX - startX));
      setWidths((prev) => ({ ...prev, [key]: w }));
    };
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-auto rounded-lg border border-[var(--color-border-strong)]",
        "bg-[var(--color-surface-raised)] shadow-panel",
        className,
      )}
    >
      <div className="min-w-max" style={{ display: "grid", gridTemplateColumns: colTemplate }}>
        {/* Corner */}
        <div className="sticky top-0 left-0 z-30 flex h-11 items-center justify-center border-b border-r border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] text-[10px] font-medium text-[var(--color-brown)]/70">
          #
        </div>

        {/* Column headers */}
        {columns.map((col) => (
          <div
            key={col.key}
            className="sticky top-0 z-20 flex flex-col justify-between border-b border-r border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] px-2 py-1.5"
            style={{ height: 44 }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="text-[var(--color-brown)]">{typeIcon[col.type]}</span>
                <span className="truncate text-[12.5px] font-semibold text-[var(--color-brown-dark)]">{col.name}</span>
              </div>
              {col.issues > 0 ? (
                <span className="flex shrink-0 items-center gap-0.5 text-[10px] font-medium text-[var(--color-warning)]">
                  <AlertTriangle className="h-3 w-3" />
                  {col.issues}
                </span>
              ) : col.progress >= 100 ? (
                <CheckCircle2 className="h-3 w-3 shrink-0 text-[var(--color-success)]" />
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9.5px] uppercase tracking-wider text-[var(--color-brown)]/70">
                {typeLabel[col.type]}
              </span>
              <ProgressBar
                value={col.progress}
                size="xs"
                tone={col.issues > 0 ? "warning" : col.progress >= 100 ? "success" : "accent"}
                className="flex-1"
              />
            </div>
            {/* Resize handle */}
            <div
              onMouseDown={(e) => startResize(col.key, e.clientX, widths[col.key] ?? 168)}
              className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize hover:bg-[var(--color-accent)]/40"
            />
          </div>
        ))}

        {/* Rows */}
        {rows.map((row, r) => (
          <RowLine key={r} r={r} row={row} columns={columns} selected={selected} setSelected={setSelected} />
        ))}
      </div>
    </div>
  );
}

function RowLine({
  r,
  row,
  columns,
  selected,
  setSelected,
}: {
  r: number;
  row: RowData;
  columns: ColumnDef[];
  selected: { r: number; c: number } | null;
  setSelected: (v: { r: number; c: number }) => void;
}) {
  return (
    <>
      <div className="sticky left-0 z-10 flex h-8 items-center justify-center border-b border-r border-[var(--color-border)] bg-[var(--color-surface-sunken)]/70 text-[10.5px] font-medium tabular-nums text-[var(--color-brown)]/70">
        {r + 1}
      </div>
      {columns.map((col, c) => {
        const cell = row[col.key];
        const flag = cell?.flag;
        const isSel = selected?.r === r && selected?.c === c;
        return (
          <button
            key={col.key}
            onClick={() => setSelected({ r, c })}
            className={cn(
              "relative h-8 truncate border-b border-r border-[var(--color-border)] px-2 text-left text-[12.5px] leading-none",
              "text-[var(--color-brown-dark)] hover:bg-[color-mix(in_oklab,var(--color-accent)_6%,transparent)]",
              flag?.invalid && "bg-[color-mix(in_oklab,var(--color-destructive)_10%,transparent)] text-[var(--color-destructive)]",
              flag?.warning && "bg-[color-mix(in_oklab,var(--color-warning)_12%,transparent)]",
              flag?.empty && "text-[var(--color-brown)]/40 italic",
              isSel && "outline outline-2 -outline-offset-2 outline-[var(--color-accent)] z-10",
            )}
          >
            {flag?.empty ? "—" : cell?.value ?? ""}
          </button>
        );
      })}
    </>
  );
}

/** Mock data generator for the design surface */
export function mockData(rowCount = 60): { columns: ColumnDef[]; rows: RowData[] } {
  const columns: ColumnDef[] = [
    { key: "id", name: "ID", type: "number", progress: 100, issues: 0, nulls: 0, width: 80 },
    { key: "first_name", name: "Prénom", type: "text", progress: 100, issues: 2, nulls: 0, width: 140 },
    { key: "last_name", name: "Nom", type: "text", progress: 100, issues: 0, nulls: 3, width: 160 },
    { key: "email", name: "Email", type: "email", progress: 82, issues: 5, nulls: 1, width: 240 },
    { key: "phone", name: "Téléphone", type: "text", progress: 65, issues: 4, nulls: 6, width: 160 },
    { key: "birthdate", name: "Date de naissance", type: "date", progress: 74, issues: 3, nulls: 2, width: 180 },
    { key: "signup", name: "Inscription", type: "date", progress: 100, issues: 0, nulls: 0, width: 160 },
    { key: "orders", name: "Commandes", type: "number", progress: 100, issues: 0, nulls: 0, width: 120 },
    { key: "revenue", name: "Chiffre d'affaires (€)", type: "number", progress: 92, issues: 2, nulls: 0, width: 180 },
    { key: "country", name: "Pays", type: "text", progress: 100, issues: 1, nulls: 0, width: 140 },
    { key: "city", name: "Ville", type: "text", progress: 88, issues: 0, nulls: 4, width: 160 },
    { key: "segment", name: "Segment", type: "text", progress: 100, issues: 0, nulls: 0, width: 140 },
  ];

  const first = ["Marie", "Louis", "Emma", "Hugo", "Léa", "Nathan", "Chloé", "Jules", "Manon", "Arthur"];
  const last = ["Martin", "Bernard", "Dubois", "Thomas", "Robert", "Petit", "Durand", "Leroy", "Moreau", "Simon"];
  const cities = ["Paris", "Lyon", "Marseille", "Toulouse", "Nice", "Nantes", "Bordeaux", "Lille"];
  const segments = ["Standard", "Premium", "Pro", "VIP"];
  const countries = ["France", "Belgique", "Suisse", "Canada"];

  const rows: RowData[] = Array.from({ length: rowCount }).map((_, i) => {
    const invalidEmail = i % 13 === 0;
    const emptyPhone = i % 9 === 0;
    const badDate = i % 17 === 0;
    return {
      id: { value: String(1000 + i) },
      first_name: { value: first[i % first.length] },
      last_name: { value: i % 21 === 0 ? "" : last[i % last.length], flag: i % 21 === 0 ? { empty: true } : undefined },
      email: {
        value: invalidEmail ? "jean.dupont[at]mail" : `${first[i % first.length].toLowerCase()}.${last[i % last.length].toLowerCase()}@mail.fr`,
        flag: invalidEmail ? { invalid: true } : undefined,
      },
      phone: emptyPhone
        ? { value: "", flag: { empty: true } }
        : { value: `+33 6 ${String(10_000_000 + i * 137).slice(0, 8).match(/.{2}/g)!.join(" ")}` },
      birthdate: badDate
        ? { value: "31/02/1990", flag: { invalid: true } }
        : { value: `${String((i % 27) + 1).padStart(2, "0")}/0${(i % 9) + 1}/19${70 + (i % 30)}` },
      signup: { value: `2024-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 27) + 1).padStart(2, "0")}` },
      orders: { value: String((i * 3) % 47) },
      revenue: {
        value: i % 19 === 0 ? "12 450,00 €" : `${(i * 87.4).toFixed(2)} €`,
        flag: i % 19 === 0 ? { warning: true } : undefined,
      },
      country: { value: countries[i % countries.length] },
      city: i % 14 === 0 ? { value: "", flag: { empty: true } } : { value: cities[i % cities.length] },
      segment: { value: segments[i % segments.length] },
    };
  });

  return { columns, rows };
}
