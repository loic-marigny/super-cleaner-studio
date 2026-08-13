import { useEffect, useMemo, useRef, useState, useTransition, type MouseEvent as ReactMouseEvent } from "react";
import { AlertTriangle, Binary, Calendar, CheckCircle2, ChevronDown, ChevronUp, Clock3, Hash, KeyRound, Menu, Pencil, Type, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ProgressBar } from "./ProgressBar";
import { InlineCellEditor } from "./InlineCellEditor";
import type { ColumnAnalysis, ColumnType, CustomColumnTypeDefinition } from "@/lib/workspace";

export interface ColumnDef extends Pick<ColumnAnalysis, "key" | "name" | "type" | "missingCount" | "choiceOptions"> {
  progress: number;
  issues: number;
  isPrimaryKey?: boolean;
  incompatibleCount?: number;
  integerAutoCorrectableCount?: number;
  width?: number;
  inferredType?: ColumnType;
  isTypeOverridden?: boolean;
  trackSpread?: boolean;
  trackNulls?: boolean;
  positiveOnly?: boolean;
  nonCanonicalBooleanCount?: number;
  booleanDisplayMismatchCount?: number;
  nonCanonicalDateCount?: number;
  autoCorrectableDateCount?: number;
  nonPreferredDecimalCount?: number;
  negativeValueCount?: number;
  lowerBound?: number;
  upperBound?: number;
}

export interface CellFlag {
  invalid?: boolean;
  warning?: boolean;
  empty?: boolean;
  message?: string;
  reasons?: string[];
}

export interface RowData {
  [key: string]: { value: string; flag?: CellFlag };
}

const builtinTypeIcon = {
  text: <Type className="h-3 w-3" />,
  integer: <Hash className="h-3 w-3" />,
  decimal: <Hash className="h-3 w-3" />,
  boolean: <Binary className="h-3 w-3" />,
  date: <Calendar className="h-3 w-3" />,
  datetime: <Clock3 className="h-3 w-3" />,
  null: <Type className="h-3 w-3" />,
};

type ColumnFilterState = {
  errorsOnly: boolean;
  warningsOnly: boolean;
  nullsOnly: boolean;
  textQuery: string;
  exactValue: string;
  minValue: string;
  maxValue: string;
  dateFrom: string;
  dateTo: string;
  booleanValue: "all" | "true" | "false";
};

const defaultFilterState = (): ColumnFilterState => ({
  errorsOnly: false,
  warningsOnly: false,
  nullsOnly: false,
  textQuery: "",
  exactValue: "",
  minValue: "",
  maxValue: "",
  dateFrom: "",
  dateTo: "",
  booleanValue: "all",
});

function normalizeLooseBoolean(value: string) {
  const normalized = value.trim().toLowerCase();
  if (["true", "yes", "oui", "vrai", "1"].includes(normalized)) return "true";
  if (["false", "no", "non", "faux", "0"].includes(normalized)) return "false";
  return null;
}

function parseLooseNumber(value: string) {
  const normalized = value.trim().replace(/\s/g, "").replace(",", ".");
  if (!normalized || !/^-?\d+(\.\d+)?$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatBoundInput(value: number | undefined) {
  if (value == null || !Number.isFinite(value)) return "";
  return value.toFixed(4).replace(/\.?0+$/, "");
}

function parseLooseDate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const direct = Date.parse(trimmed.replace(" ", "T"));
  if (!Number.isNaN(direct)) return direct;

  let match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (match) {
    const [, year, month, day, hour = "00", minute = "00", second = "00"] = match;
    return Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
  }

  match = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) {
    const [, first, second, year] = match;
    const day = Number(first) > 12 ? Number(first) : Number(second);
    const month = Number(first) > 12 ? Number(second) : Number(first);
    return Date.UTC(Number(year), month - 1, day);
  }

  return null;
}

function isChoiceType(type: ColumnType) {
  return type.startsWith("choice:");
}

function isPatternType(type: ColumnType) {
  return type.startsWith("pattern:");
}

function hasActiveFilter(filter: ColumnFilterState | undefined) {
  if (!filter) return false;
  return Boolean(
    filter.errorsOnly ||
      filter.warningsOnly ||
      filter.nullsOnly ||
      filter.textQuery ||
      filter.exactValue ||
      filter.minValue ||
      filter.maxValue ||
      filter.dateFrom ||
      filter.dateTo ||
      filter.booleanValue !== "all",
  );
}

function matchesColumnFilter(row: RowData, column: ColumnDef, filter: ColumnFilterState | undefined) {
  if (!filter || !hasActiveFilter(filter)) return true;

  const cell = row[column.key];
  const value = cell?.value ?? "";
  const flag = cell?.flag;

  if (filter.errorsOnly && !flag?.invalid) return false;
  if (filter.warningsOnly && !flag?.warning) return false;
  if (filter.nullsOnly && !flag?.empty) return false;

  if (filter.exactValue) {
    if (value.trim().toLowerCase() !== filter.exactValue.trim().toLowerCase()) return false;
  }

  if (column.type === "boolean") {
    if (filter.booleanValue !== "all" && normalizeLooseBoolean(value) !== filter.booleanValue) return false;
    return true;
  }

  if (column.type === "integer" || column.type === "decimal") {
    if (filter.minValue || filter.maxValue) {
      const numeric = parseLooseNumber(value);
      if (numeric == null) return false;
      const min = filter.minValue ? Number(filter.minValue) : null;
      const max = filter.maxValue ? Number(filter.maxValue) : null;
      if (min != null && numeric < min) return false;
      if (max != null && numeric > max) return false;
    }
    return true;
  }

  if (column.type === "date" || column.type === "datetime") {
    if (filter.dateFrom || filter.dateTo) {
      const parsed = parseLooseDate(value);
      if (parsed == null) return false;
      const from = filter.dateFrom ? Date.parse(`${filter.dateFrom}T00:00:00`) : null;
      const to = filter.dateTo ? Date.parse(`${filter.dateTo}T23:59:59`) : null;
      if (from != null && parsed < from) return false;
      if (to != null && parsed > to) return false;
    }
    return true;
  }

  if (filter.textQuery) {
    if (!value.toLowerCase().includes(filter.textQuery.toLowerCase())) return false;
  }

  if (isChoiceType(column.type) || isPatternType(column.type) || column.type === "text" || column.type === "null") {
    return true;
  }

  return true;
}

export function Spreadsheet({
  columns,
  rows,
  className,
  customTypes,
  onColumnNameChange,
  onColumnTypeChange,
  onColumnSpreadTrackingChange,
  onColumnSpreadBoundsChange,
  onColumnNullTrackingChange,
  onColumnPositiveTrackingChange,
  onNormalizeBooleanColumn,
  normalizeBooleanTitle,
  onBusyChange,
  onFiltersChange,
  onNormalizeDateColumn,
  onClearColumnErrors,
  onRoundIntegerColumn,
  onTruncateIntegerColumn,
  onRemoveColumn,
  onRemoveRow,
  onPromoteRowToHeader,
  editingCell,
  onStartEditCell,
  onSubmitEditCell,
  onCancelEditCell,
}: {
  columns: ColumnDef[];
  rows: RowData[];
  className?: string;
  customTypes?: CustomColumnTypeDefinition[];
  onColumnNameChange?: (key: string, name: string) => void;
  onColumnTypeChange?: (key: string, type: ColumnType) => void;
  onColumnSpreadTrackingChange?: (key: string, enabled: boolean) => void;
  onColumnSpreadBoundsChange?: (key: string, bounds: { lowerBound?: number | null; upperBound?: number | null }) => void;
  onColumnNullTrackingChange?: (key: string, enabled: boolean) => void;
  onColumnPositiveTrackingChange?: (key: string, enabled: boolean) => void;
  onNormalizeBooleanColumn?: (key: string) => void;
  normalizeBooleanTitle?: string;
  onBusyChange?: (busy: boolean) => void;
  onFiltersChange?: () => void;
  onNormalizeDateColumn?: (key: string) => void;
  onClearColumnErrors?: (key: string) => void;
  onRoundIntegerColumn?: (key: string) => void;
  onTruncateIntegerColumn?: (key: string) => void;
  onRemoveColumn?: (key: string) => void;
  onRemoveRow?: (rowIndex: number) => void;
  onPromoteRowToHeader?: (rowIndex: number) => void;
  editingCell?: { rowIndex: number; columnKey: string } | null;
  onStartEditCell?: (rowIndex: number, columnKey: string, currentValue: string) => void;
  onSubmitEditCell?: (rowIndex: number, columnKey: string, value: string) => void;
  onCancelEditCell?: () => void;
}) {
  const { t } = useI18n();
  const [selected, setSelected] = useState<{ r: number; c: number } | null>({ r: 0, c: 0 });
  const [controlsVisible, setControlsVisible] = useState(true);
  const [editingHeaderKey, setEditingHeaderKey] = useState<string | null>(null);
  const [headerDraft, setHeaderDraft] = useState("");
  const [openFilterColumn, setOpenFilterColumn] = useState<string | null>(null);
  const [rowMenu, setRowMenu] = useState<{ rowIndex: number; x: number; y: number } | null>(null);
  const [filterMenuPosition, setFilterMenuPosition] = useState<{ left: number; top: number } | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, ColumnFilterState>>({});
  const [boundInputs, setBoundInputs] = useState<Record<string, { min: string; max: string }>>({});
  const [isFilterPending, startFilterTransition] = useTransition();
  const rowMenuRef = useRef<HTMLDivElement | null>(null);
  const filterMenuRef = useRef<HTMLDivElement | null>(null);
  const [widths, setWidths] = useState<Record<string, number>>(
    () => Object.fromEntries(columns.map((column) => [column.key, column.width ?? 168])),
  );

  const colTemplate = useMemo(
    () => `48px ${columns.map((column) => `${widths[column.key] ?? 168}px`).join(" ")}`,
    [columns, widths],
  );

  const startResize = (key: string, startX: number, startW: number) => {
    const move = (event: MouseEvent) => {
      const nextWidth = Math.max(80, startW + (event.clientX - startX));
      setWidths((current) => ({ ...current, [key]: nextWidth }));
    };
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const builtinTypeLabelMap: Record<string, string> = {
    text: t("workspace.types.text"),
    integer: t("workspace.types.integer"),
    decimal: t("workspace.types.decimal"),
    boolean: t("workspace.types.boolean"),
    date: t("workspace.types.date"),
    datetime: t("workspace.types.datetime"),
    null: t("workspace.types.null"),
  };

  const getTypeLabel = (type: ColumnType) =>
    builtinTypeLabelMap[type as keyof typeof builtinTypeLabelMap] ??
    customTypes?.find((customType) => customType.id === type)?.name ??
    type;

  const getTypeIcon = (type: ColumnType) => builtinTypeIcon[type as keyof typeof builtinTypeIcon] ?? <Type className="h-3 w-3" />;
  const submitHeaderEdit = (columnKey: string) => {
    if (editingHeaderKey !== columnKey) return;
    onColumnNameChange?.(columnKey, headerDraft);
    setEditingHeaderKey(null);
    setHeaderDraft("");
  };

  const cancelHeaderEdit = () => {
    setEditingHeaderKey(null);
    setHeaderDraft("");
  };

  const headerHeight = controlsVisible ? 228 : 84;
  const openFilterColumnDef = openFilterColumn ? columns.find((column) => column.key === openFilterColumn) ?? null : null;
  const openFilterState = openFilterColumn ? (columnFilters[openFilterColumn] ?? defaultFilterState()) : null;
  const openFilterMenu = (key: string, trigger: HTMLButtonElement) => {
    if (openFilterColumn === key) {
      setOpenFilterColumn(null);
      setFilterMenuPosition(null);
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const menuWidth = 208;
    const viewportPadding = 8;
    const left = Math.min(
      Math.max(viewportPadding, rect.right - menuWidth),
      window.innerWidth - menuWidth - viewportPadding,
    );
    const top = Math.min(rect.bottom + 8, window.innerHeight - viewportPadding);

    setOpenFilterColumn(key);
    setFilterMenuPosition({ left, top });
  };

  const updateFilter = (key: string, patch: Partial<ColumnFilterState>) => {
    startFilterTransition(() => {
      setColumnFilters((current) => ({
        ...current,
        [key]: {
          ...(current[key] ?? defaultFilterState()),
          ...patch,
        },
      }));
      onFiltersChange?.();
    });
  };

  const resetFilter = (key: string) => {
    startFilterTransition(() => {
      setColumnFilters((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
      onFiltersChange?.();
    });
  };

  const filteredRows = useMemo(
    () =>
      rows
        .map((row, index) => ({ row, index }))
        .filter(({ row }) => columns.every((column) => matchesColumnFilter(row, column, columnFilters[column.key]))),
    [columns, columnFilters, rows],
  );

  useEffect(() => {
    onBusyChange?.(isFilterPending);
  }, [isFilterPending, onBusyChange]);

  useEffect(() => {
    if (!controlsVisible && openFilterColumn) {
      setOpenFilterColumn(null);
      setFilterMenuPosition(null);
    }
  }, [controlsVisible, openFilterColumn]);

  useEffect(() => {
    setBoundInputs((current) => {
      const next = { ...current };
      columns.forEach((column) => {
        if (column.type !== "integer" && column.type !== "decimal") return;
        next[column.key] = {
          min: formatBoundInput(column.lowerBound),
          max: formatBoundInput(column.upperBound),
        };
      });
      return next;
    });
  }, [columns]);

  useEffect(() => {
    if (!rowMenu) return;

    const closeMenu = (event: PointerEvent) => {
      if (rowMenuRef.current?.contains(event.target as Node)) {
        return;
      }
      setRowMenu(null);
    };
    window.addEventListener("pointerdown", closeMenu);
    window.addEventListener("scroll", closeMenu, true);

    return () => {
      window.removeEventListener("pointerdown", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
    };
  }, [rowMenu]);

  useEffect(() => {
    if (!openFilterColumn) return;

    const closeFilterMenu = (event: PointerEvent) => {
      if (filterMenuRef.current?.contains(event.target as Node)) {
        return;
      }
      setOpenFilterColumn(null);
      setFilterMenuPosition(null);
    };

    const closeOnViewportChange = () => {
      setOpenFilterColumn(null);
      setFilterMenuPosition(null);
    };

    window.addEventListener("pointerdown", closeFilterMenu);
    window.addEventListener("scroll", closeOnViewportChange, true);
    window.addEventListener("resize", closeOnViewportChange);

    return () => {
      window.removeEventListener("pointerdown", closeFilterMenu);
      window.removeEventListener("scroll", closeOnViewportChange, true);
      window.removeEventListener("resize", closeOnViewportChange);
    };
  }, [openFilterColumn]);

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-auto rounded-lg border border-[var(--color-border-strong)]",
        "bg-[var(--color-surface-raised)] shadow-panel",
        className,
      )}
    >
      <div className="min-w-max" style={{ display: "grid", gridTemplateColumns: colTemplate }}>
        <div
          className="sticky top-0 left-0 z-30 flex flex-col items-center justify-between border-b border-r border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] px-1 py-1.5 text-[11px] font-medium text-[var(--color-brown)]/70"
          style={{ height: headerHeight }}
        >
          <span className="h-5" />
          <span>#</span>
          <button
            type="button"
            onClick={() => setControlsVisible((current) => !current)}
            className="flex h-5 w-5 items-center justify-center rounded border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-brown)] hover:bg-[var(--color-surface)]"
            title={controlsVisible ? t("workspace.table.hideHeaderControls") : t("workspace.table.showHeaderControls")}
          >
            {controlsVisible ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>

        {columns.map((column) => (
          (() => {
            const filter = columnFilters[column.key] ?? defaultFilterState();
            const filterActive = hasActiveFilter(columnFilters[column.key]);
            const isChoice = isChoiceType(column.type);
            const isPattern = isPatternType(column.type);
            const isBoolean = column.type === "boolean";
            const isNumeric = column.type === "integer" || column.type === "decimal";
            const isDate = column.type === "date" || column.type === "datetime";
            const choiceValues = column.choiceOptions ?? [];
            const boundInput = boundInputs[column.key] ?? {
              min: formatBoundInput(column.lowerBound),
              max: formatBoundInput(column.upperBound),
            };
            return (
          <div
            key={column.key}
            className={cn(
              "sticky top-0 z-20 flex flex-col justify-between border-b border-r border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] px-2 py-1.5",
              !controlsVisible &&
                filterActive &&
                "bg-[color-mix(in_oklab,var(--color-accent)_9%,var(--color-surface-sunken))]",
            )}
            style={{ height: headerHeight }}
          >
            <button
              type="button"
              onClick={() => onRemoveColumn?.(column.key)}
              className="absolute top-1.5 right-2 z-30 flex h-5 w-5 items-center justify-center rounded border border-[color-mix(in_oklab,var(--color-destructive)_38%,transparent)] bg-[color-mix(in_oklab,var(--color-destructive)_10%,var(--color-surface-raised))] text-[var(--color-destructive)] shadow-sm hover:bg-[color-mix(in_oklab,var(--color-destructive)_16%,var(--color-surface-raised))]"
              title={t("workspace.table.removeColumnTitle", { column: column.name })}
            >
              <X className="h-3 w-3" />
            </button>
            <div
              className={cn(
                "rounded-md pr-7",
                !controlsVisible &&
                  filterActive &&
                  "border border-[var(--color-accent)]/45 bg-[color-mix(in_oklab,var(--color-accent)_8%,var(--color-surface-raised))] px-1.5 py-1",
              )}
            >
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="text-[var(--color-brown)]">{getTypeIcon(column.type)}</span>
                {column.isPrimaryKey ? <KeyRound className="h-3 w-3 shrink-0 text-[var(--color-accent)]" /> : null}
                {editingHeaderKey === column.key ? (
                  <input
                    type="text"
                    value={headerDraft}
                    onChange={(event) => setHeaderDraft(event.target.value)}
                    onBlur={() => submitHeaderEdit(column.key)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        submitHeaderEdit(column.key);
                      } else if (event.key === "Escape") {
                        event.preventDefault();
                        cancelHeaderEdit();
                      }
                    }}
                    autoFocus
                    className="min-w-0 flex-1 bg-transparent text-[12.5px] font-semibold text-[var(--color-brown-dark)] outline-none"
                    aria-label={t("workspace.table.editColumnName")}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingHeaderKey(column.key);
                      setHeaderDraft(column.name);
                    }}
                    className="truncate cursor-text text-left text-[12.5px] font-semibold text-[var(--color-brown-dark)]"
                    title={t("workspace.table.editColumnName")}
                  >
                    {column.name}
                  </button>
                )}
              </div>
            </div>

            <div className="mt-1">
              <select
                aria-label={t("workspace.table.columnTypeAria", { column: column.name })}
                value={column.type}
                onChange={(event) => onColumnTypeChange?.(column.key, event.target.value as ColumnType)}
                className={cn(
                  "w-full min-w-0 rounded border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-brown-dark)]",
                  "focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/25",
                  column.isTypeOverridden && "border-[var(--color-accent)]",
                )}
                title={
                  column.isTypeOverridden && column.inferredType
                    ? t("workspace.table.detectedTypeTitle", { type: getTypeLabel(column.inferredType) })
                    : undefined
                }
              >
                {Object.entries(builtinTypeLabelMap).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
                {(customTypes ?? []).map((customType) => (
                  <option key={customType.id} value={customType.id}>
                    {customType.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <ProgressBar
                value={column.progress}
                size="xs"
                tone={column.issues > 0 ? "warning" : column.progress >= 100 ? "success" : "accent"}
                className="min-w-0 flex-1"
              />
              <div className="flex min-h-[14px] shrink-0 items-center justify-end">
                {column.issues > 0 ? (
                  <span className="flex shrink-0 items-center gap-0.5 text-[10px] font-medium text-[var(--color-warning)]">
                    <AlertTriangle className="h-3 w-3" />
                    {column.issues}
                  </span>
                ) : column.progress >= 100 ? (
                  <span className="flex shrink-0 items-center text-[var(--color-success)]">
                    <CheckCircle2 className="h-3 w-3 shrink-0" />
                  </span>
                ) : (
                  <span className="w-4 shrink-0" />
                )}
              </div>
            </div>
            </div>

            {controlsVisible ? (
              <div className="border-t border-[var(--color-border)] pt-1">
                <div className="flex items-center gap-3">
                  {isNumeric ? (
                    <label className="flex items-center gap-1.5 text-[10px] text-[var(--color-brown)]">
                      <input
                        type="checkbox"
                        checked={column.trackSpread ?? true}
                        onChange={(event) => onColumnSpreadTrackingChange?.(column.key, event.target.checked)}
                        className="h-3 w-3 rounded border-[var(--color-border-strong)] text-[var(--color-accent)] focus:ring-[var(--color-ring)]/25"
                        title={t("workspace.toolbar.showSpread")}
                      />
                      <span>{t("workspace.toolbar.showSpread")}</span>
                    </label>
                  ) : null}
                  {isNumeric ? (
                    <label className="flex items-center gap-1.5 text-[10px] text-[var(--color-brown)]">
                      <input
                        type="checkbox"
                        checked={column.positiveOnly ?? false}
                        onChange={(event) => onColumnPositiveTrackingChange?.(column.key, event.target.checked)}
                        className="h-3 w-3 rounded border-[var(--color-border-strong)] text-[var(--color-accent)] focus:ring-[var(--color-ring)]/25"
                        title={t("workspace.toolbar.positiveOnly")}
                      />
                      <span>{t("workspace.toolbar.positiveOnly")}</span>
                    </label>
                  ) : null}
                  <label className="flex items-center gap-1.5 text-[10px] text-[var(--color-brown)]">
                    <input
                      type="checkbox"
                      checked={column.trackNulls ?? true}
                      onChange={(event) => onColumnNullTrackingChange?.(column.key, event.target.checked)}
                      className="h-3 w-3 rounded border-[var(--color-border-strong)] text-[var(--color-accent)] focus:ring-[var(--color-ring)]/25"
                      title={t("workspace.toolbar.showNulls")}
                    />
                    <span>{t("workspace.toolbar.showNulls")}</span>
                  </label>
                </div>

                <div className="mt-1 flex min-h-[24px] flex-wrap items-start gap-1">
                  {isNumeric && (column.trackSpread ?? true) ? (
                    <div className="flex items-end gap-1">
                      <label className="block">
                        <div className="mb-0.5 text-[10px] text-[var(--color-brown)]/75">{t("workspace.filters.min")}</div>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={boundInput.min}
                          onChange={(event) => {
                            const value = event.target.value;
                            setBoundInputs((current) => ({
                              ...current,
                              [column.key]: {
                                min: value,
                                max: (current[column.key] ?? boundInput).max,
                              },
                            }));
                            const parsed = parseLooseNumber(value);
                            if (value.trim() === "" || parsed != null) {
                              onColumnSpreadBoundsChange?.(column.key, {
                                lowerBound: value.trim() === "" ? null : parsed,
                              });
                            }
                          }}
                          className="w-[72px] rounded border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] px-1.5 py-0.5 text-[10px] text-[var(--color-brown-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/25"
                        />
                      </label>
                      <label className="block">
                        <div className="mb-0.5 text-[10px] text-[var(--color-brown)]/75">{t("workspace.filters.max")}</div>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={boundInput.max}
                          onChange={(event) => {
                            const value = event.target.value;
                            setBoundInputs((current) => ({
                              ...current,
                              [column.key]: {
                                min: (current[column.key] ?? boundInput).min,
                                max: value,
                              },
                            }));
                            const parsed = parseLooseNumber(value);
                            if (value.trim() === "" || parsed != null) {
                              onColumnSpreadBoundsChange?.(column.key, {
                                upperBound: value.trim() === "" ? null : parsed,
                              });
                            }
                          }}
                          className="w-[72px] rounded border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] px-1.5 py-0.5 text-[10px] text-[var(--color-brown-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/25"
                        />
                      </label>
                    </div>
                  ) : null}
                  <div className="flex min-w-full flex-wrap items-center gap-1">
                    {column.type === "integer" ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onRoundIntegerColumn?.(column.key)}
                          disabled={(column.integerAutoCorrectableCount ?? 0) === 0}
                          className={cn(
                            "rounded border px-1.5 py-0.5 text-[10px] font-medium",
                            (column.integerAutoCorrectableCount ?? 0) > 0
                              ? "border-[color-mix(in_oklab,var(--color-warning)_45%,transparent)] bg-[color-mix(in_oklab,var(--color-warning)_16%,var(--color-surface-raised))] text-[color-mix(in_oklab,var(--color-warning)_80%,var(--color-brown-dark))]"
                              : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-brown)]/45",
                          )}
                          title={t("workspace.table.roundIntegersTitle")}
                        >
                          {t("workspace.table.roundIntegers")}
                        </button>
                        <button
                          type="button"
                          onClick={() => onTruncateIntegerColumn?.(column.key)}
                          disabled={(column.integerAutoCorrectableCount ?? 0) === 0}
                          className={cn(
                            "rounded border px-1.5 py-0.5 text-[10px] font-medium",
                            (column.integerAutoCorrectableCount ?? 0) > 0
                              ? "border-[color-mix(in_oklab,var(--color-warning)_45%,transparent)] bg-[color-mix(in_oklab,var(--color-warning)_16%,var(--color-surface-raised))] text-[color-mix(in_oklab,var(--color-warning)_80%,var(--color-brown-dark))]"
                              : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-brown)]/45",
                          )}
                          title={t("workspace.table.truncateIntegersTitle")}
                        >
                          {t("workspace.table.truncateIntegers")}
                        </button>
                      </>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => onClearColumnErrors?.(column.key)}
                      disabled={(column.incompatibleCount ?? 0) === 0}
                      className={cn(
                        "rounded border px-1.5 py-0.5 text-[10px] font-medium",
                        (column.incompatibleCount ?? 0) > 0
                          ? "border-[color-mix(in_oklab,var(--color-destructive)_38%,transparent)] bg-[color-mix(in_oklab,var(--color-destructive)_10%,var(--color-surface-raised))] text-[var(--color-destructive)]"
                          : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-brown)]/45",
                      )}
                      title={t("workspace.table.clearErrorsTitle")}
                    >
                      {t("workspace.table.clearErrors")}
                    </button>
                    {column.type === "boolean" ? (
                      <button
                        type="button"
                        onClick={() => onNormalizeBooleanColumn?.(column.key)}
                        disabled={(column.booleanDisplayMismatchCount ?? 0) === 0}
                        className={cn(
                          "rounded border px-1.5 py-0.5 text-[10px] font-medium",
                          (column.booleanDisplayMismatchCount ?? 0) > 0
                            ? "border-[color-mix(in_oklab,var(--color-warning)_45%,transparent)] bg-[color-mix(in_oklab,var(--color-warning)_16%,var(--color-surface-raised))] text-[color-mix(in_oklab,var(--color-warning)_80%,var(--color-brown-dark))]"
                            : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-brown)]/45",
                        )}
                        title={normalizeBooleanTitle ?? t("workspace.table.normalizeBooleanTitle", { format: "true / false" })}
                      >
                        {t("workspace.table.normalizeBoolean")}
                      </button>
                    ) : (column.type === "date" || column.type === "datetime") && (column.autoCorrectableDateCount ?? 0) > 0 ? (
                      <button
                        type="button"
                        onClick={() => onNormalizeDateColumn?.(column.key)}
                        className="rounded border border-[color-mix(in_oklab,var(--color-warning)_45%,transparent)] bg-[color-mix(in_oklab,var(--color-warning)_16%,var(--color-surface-raised))] px-1.5 py-0.5 text-[10px] font-medium text-[color-mix(in_oklab,var(--color-warning)_80%,var(--color-brown-dark))]"
                        title={t("workspace.table.normalizeDateTitle")}
                      >
                        {t("workspace.table.normalizeDate")}
                      </button>
                    ) : null}
                    <div className="ml-auto">
                      <button
                        type="button"
                        onClick={(event) => openFilterMenu(column.key, event.currentTarget)}
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded border bg-[var(--color-surface-raised)] text-[var(--color-brown)] shadow-sm hover:bg-[var(--color-surface)]",
                          filterActive
                            ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                            : "border-[var(--color-border-strong)]",
                        )}
                        title={t("workspace.filters.openTitle", { column: column.name })}
                      >
                        <Menu className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {controlsVisible ? <div /> : null}

            <div
              onMouseDown={(event) => startResize(column.key, event.clientX, widths[column.key] ?? 168)}
              className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize hover:bg-[var(--color-accent)]/40"
            />
          </div>
            );
          })()
        ))}

        {filteredRows.map(({ row, index }, rowIndex) => (
          <RowLine
            key={index}
            r={rowIndex}
            rowNumber={index + 1}
            sourceRowIndex={index}
            row={row}
            columns={columns}
            selected={selected}
            setSelected={setSelected}
            onContextMenu={(event, sourceRowIndex) => {
              event.preventDefault();
              setRowMenu({ rowIndex: sourceRowIndex, x: event.clientX, y: event.clientY });
            }}
            customTypes={customTypes}
            editingCell={editingCell}
            onStartEditCell={onStartEditCell}
            onSubmitEditCell={onSubmitEditCell}
            onCancelEditCell={onCancelEditCell}
          />
        ))}
      </div>
      {controlsVisible && openFilterColumnDef && openFilterState && filterMenuPosition ? (
        <div
          ref={filterMenuRef}
          className="fixed z-[220] w-52 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] p-2 shadow-panel"
          style={filterMenuPosition}
        >
          <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-brown)]/70">
            {t("workspace.filters.title")}
          </div>
          <div className="mt-2 space-y-1.5 text-[11px] text-[var(--color-brown-dark)]">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={openFilterState.errorsOnly}
                onChange={(event) => updateFilter(openFilterColumnDef.key, { errorsOnly: event.target.checked })}
                className="h-3 w-3"
              />
              <span>{t("workspace.filters.errorsOnly")}</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={openFilterState.warningsOnly}
                onChange={(event) => updateFilter(openFilterColumnDef.key, { warningsOnly: event.target.checked })}
                className="h-3 w-3"
              />
              <span>{t("workspace.filters.warningsOnly")}</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={openFilterState.nullsOnly}
                onChange={(event) => updateFilter(openFilterColumnDef.key, { nullsOnly: event.target.checked })}
                className="h-3 w-3"
              />
              <span>{t("workspace.filters.nullsOnly")}</span>
            </label>
            {openFilterColumnDef.type === "boolean" ? (
              <div>
                <div className="mb-1 text-[10px] text-[var(--color-brown)]/75">{t("workspace.filters.value")}</div>
                <select
                  value={openFilterState.booleanValue}
                  onChange={(event) => updateFilter(openFilterColumnDef.key, { booleanValue: event.target.value as ColumnFilterState["booleanValue"] })}
                  className="h-7 w-full rounded border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2 text-[11px]"
                >
                  <option value="all">{t("workspace.filters.all")}</option>
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              </div>
            ) : openFilterColumnDef.type === "integer" || openFilterColumnDef.type === "decimal" ? (
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <div className="mb-1 text-[10px] text-[var(--color-brown)]/75">{t("workspace.filters.min")}</div>
                  <input
                    type="number"
                    value={openFilterState.minValue}
                    onChange={(event) => updateFilter(openFilterColumnDef.key, { minValue: event.target.value })}
                    className="h-7 w-full rounded border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2 text-[11px]"
                  />
                </div>
                <div>
                  <div className="mb-1 text-[10px] text-[var(--color-brown)]/75">{t("workspace.filters.max")}</div>
                  <input
                    type="number"
                    value={openFilterState.maxValue}
                    onChange={(event) => updateFilter(openFilterColumnDef.key, { maxValue: event.target.value })}
                    className="h-7 w-full rounded border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2 text-[11px]"
                  />
                </div>
              </div>
            ) : openFilterColumnDef.type === "date" || openFilterColumnDef.type === "datetime" ? (
              <div className="grid grid-cols-1 gap-1.5">
                <div>
                  <div className="mb-1 text-[10px] text-[var(--color-brown)]/75">{t("workspace.filters.from")}</div>
                  <input
                    type="date"
                    value={openFilterState.dateFrom}
                    onChange={(event) => updateFilter(openFilterColumnDef.key, { dateFrom: event.target.value })}
                    className="h-7 w-full rounded border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2 text-[11px]"
                  />
                </div>
                <div>
                  <div className="mb-1 text-[10px] text-[var(--color-brown)]/75">{t("workspace.filters.to")}</div>
                  <input
                    type="date"
                    value={openFilterState.dateTo}
                    onChange={(event) => updateFilter(openFilterColumnDef.key, { dateTo: event.target.value })}
                    className="h-7 w-full rounded border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2 text-[11px]"
                  />
                </div>
              </div>
            ) : isChoiceType(openFilterColumnDef.type) ? (
              <div>
                <div className="mb-1 text-[10px] text-[var(--color-brown)]/75">{t("workspace.filters.value")}</div>
                <select
                  value={openFilterState.exactValue}
                  onChange={(event) => updateFilter(openFilterColumnDef.key, { exactValue: event.target.value })}
                  className="h-7 w-full rounded border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2 text-[11px]"
                >
                  <option value="">{t("workspace.filters.all")}</option>
                  {(openFilterColumnDef.choiceOptions ?? []).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <div className="mb-1 text-[10px] text-[var(--color-brown)]/75">
                  {isPatternType(openFilterColumnDef.type) ? t("workspace.filters.pattern") : t("workspace.filters.text")}
                </div>
                <input
                  type="text"
                  value={openFilterState.textQuery}
                  onChange={(event) => updateFilter(openFilterColumnDef.key, { textQuery: event.target.value })}
                  placeholder={isPatternType(openFilterColumnDef.type) ? t("workspace.filters.containsPlaceholder") : t("workspace.filters.searchPlaceholder")}
                  className="h-7 w-full rounded border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2 text-[11px]"
                />
              </div>
            )}
            <div className="mt-1 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => resetFilter(openFilterColumnDef.key)}
                className="rounded border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2 py-1 text-[10px] font-medium text-[var(--color-brown-dark)]"
              >
                {t("workspace.filters.reset")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpenFilterColumn(null);
                  setFilterMenuPosition(null);
                }}
                className="rounded border border-[var(--color-accent)] bg-[color-mix(in_oklab,var(--color-accent)_10%,var(--color-surface-raised))] px-2 py-1 text-[10px] font-medium text-[var(--color-accent)]"
              >
                {t("common.actions.ok")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {rowMenu ? (
        <div
          ref={rowMenuRef}
          className="fixed z-[140] min-w-[180px] rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] p-1 shadow-panel"
          style={{ left: rowMenu.x, top: rowMenu.y }}
        >
          <button
            type="button"
            onClick={() => {
              onPromoteRowToHeader?.(rowMenu.rowIndex);
              setRowMenu(null);
            }}
            className="flex w-full items-center rounded px-2 py-1.5 text-left text-[11px] text-[var(--color-brown-dark)] hover:bg-[var(--color-surface)]"
          >
            {t("workspace.table.useAsHeaders")}
          </button>
          <button
            type="button"
            onClick={() => {
              onRemoveRow?.(rowMenu.rowIndex);
              setRowMenu(null);
            }}
            className="flex w-full items-center rounded px-2 py-1.5 text-left text-[11px] text-[var(--color-destructive)] hover:bg-[color-mix(in_oklab,var(--color-destructive)_10%,var(--color-surface))]"
          >
            {t("workspace.table.removeRow")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function RowLine({
  r,
  rowNumber,
  sourceRowIndex,
  row,
  columns,
  customTypes,
  selected,
  setSelected,
  onContextMenu,
  editingCell,
  onStartEditCell,
  onSubmitEditCell,
  onCancelEditCell,
}: {
  r: number;
  rowNumber: number;
  sourceRowIndex: number;
  row: RowData;
  columns: ColumnDef[];
  customTypes?: CustomColumnTypeDefinition[];
  selected: { r: number; c: number } | null;
  setSelected: (value: { r: number; c: number }) => void;
  onContextMenu: (event: ReactMouseEvent, rowIndex: number) => void;
  editingCell?: { rowIndex: number; columnKey: string } | null;
  onStartEditCell?: (rowIndex: number, columnKey: string, currentValue: string) => void;
  onSubmitEditCell?: (rowIndex: number, columnKey: string, value: string) => void;
  onCancelEditCell?: () => void;
}) {
  const { t } = useI18n();

  return (
    <>
      <div
        onContextMenu={(event) => onContextMenu(event, sourceRowIndex)}
        className="sticky left-0 z-10 flex h-8 items-center justify-center border-b border-r border-[var(--color-border)] bg-[var(--color-surface-sunken)]/70 text-[10.5px] font-medium tabular-nums text-[var(--color-brown)]/70"
      >
        {rowNumber}
      </div>
      {columns.map((column, columnIndex) => {
        const cell = row[column.key];
        const flag = cell?.flag;
        const isSelected = selected?.r === r && selected?.c === columnIndex;
        const isEditing = editingCell?.rowIndex === sourceRowIndex && editingCell.columnKey === column.key;
        return (
          <div
            key={column.key}
            onClick={() => setSelected({ r, c: columnIndex })}
            onContextMenu={(event) => onContextMenu(event, sourceRowIndex)}
            title={flag?.message}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setSelected({ r, c: columnIndex });
              }
            }}
            className={cn(
              "group relative flex h-8 items-center truncate border-b border-r border-[var(--color-border)] px-2 pr-5 text-left text-[12.5px] leading-none",
              "text-[var(--color-brown-dark)] hover:bg-[color-mix(in_oklab,var(--color-accent)_6%,transparent)]",
              flag?.invalid &&
                "bg-[color-mix(in_oklab,var(--color-destructive)_10%,transparent)] text-[var(--color-destructive)]",
              flag?.warning && "bg-[color-mix(in_oklab,var(--color-warning)_12%,transparent)]",
              flag?.empty && "justify-end text-right text-[var(--color-brown)]/45 italic",
              isSelected && "outline outline-2 -outline-offset-2 outline-[var(--color-accent)] z-10",
            )}
          >
            {flag?.warning ? (
              <AlertTriangle className="pointer-events-none absolute top-1 right-1 h-2.5 w-2.5 text-[var(--color-warning)]" />
            ) : null}
            {flag?.invalid ? (
              <X className="pointer-events-none absolute top-1 right-1 h-2.5 w-2.5 text-[var(--color-destructive)]" />
            ) : null}
            {isEditing ? (
              <InlineCellEditor
                type={column.type}
                choiceOptions={column.choiceOptions}
                customTypes={customTypes}
                initialValue={cell?.value ?? ""}
                className="w-full"
                onCancel={() => onCancelEditCell?.()}
                onSubmit={(value) => onSubmitEditCell?.(sourceRowIndex, column.key, value)}
              />
            ) : (
              <>
                {flag?.empty ? "null" : cell?.value ?? ""}
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onStartEditCell?.(sourceRowIndex, column.key, cell?.value ?? "");
                  }}
                  className="absolute right-1 bottom-1 flex h-3.5 w-3.5 items-center justify-center rounded text-[var(--color-brown)]/45 transition hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-brown-dark)] group-hover:text-[var(--color-brown)]"
                  title={t("workspace.table.editCell")}
                >
                  <Pencil className="h-2.5 w-2.5" />
                </button>
              </>
            )}
          </div>
        );
      })}
    </>
  );
}
