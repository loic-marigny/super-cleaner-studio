import { useEffect, useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { ColumnType, CustomColumnTypeDefinition, StructuredStringSegment, StructuredStringSegmentTokenKind } from "@/lib/workspace";

const MISSING_TEXT = new Set(["", "n/a", "na", "null", "none", "-"]);

function isMissingLikeValue(value: string) {
  const trimmed = value.trim();
  return trimmed.length === 0 || MISSING_TEXT.has(trimmed.toLowerCase());
}

function normalizeChoiceValue(value: string) {
  return value.trim().toLowerCase();
}

function parseBoolean(value: string) {
  const normalized = value.trim().toLowerCase();
  if (["true", "false", "vrai", "faux", "yes", "no", "oui", "non", "0", "1"].includes(normalized)) {
    return normalized;
  }
  return null;
}

function parseNumeric(value: string) {
  const normalized = value.trim().replace(/\s/g, "").replace(",", ".");
  if (!normalized || !/^-?\d+(\.\d+)?$/.test(normalized)) {
    return null;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildNormalizedDate(year: string, month: string, day: string, time = "") {
  const paddedMonth = month.padStart(2, "0");
  const paddedDay = day.padStart(2, "0");
  const yearNumber = Number(year);
  const monthNumber = Number(paddedMonth);
  const dayNumber = Number(paddedDay);
  if (!Number.isInteger(yearNumber) || !Number.isInteger(monthNumber) || !Number.isInteger(dayNumber)) {
    return null;
  }
  const parsed = new Date(Date.UTC(yearNumber, monthNumber - 1, dayNumber));
  if (
    parsed.getUTCFullYear() !== yearNumber ||
    parsed.getUTCMonth() !== monthNumber - 1 ||
    parsed.getUTCDate() !== dayNumber
  ) {
    return null;
  }

  return {
    type: time ? ("datetime" as const) : ("date" as const),
  };
}

function normalizeDateValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  let match =
    trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})[ tT](\d{1,2}):(\d{2})(?::(\d{2}))?$/) ??
    trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})[ tT](\d{1,2}):(\d{2})(?::(\d{2}))?$/);

  if (match) {
    if (match[1].length === 4) {
      const [, year, month, day] = match;
      return buildNormalizedDate(year, month, day, "time");
    }
    const [, day, month, year] = match;
    return buildNormalizedDate(year, month, day, "time");
  }

  match =
    trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/) ??
    trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);

  if (match) {
    if (match[1].length === 4) {
      const [, year, month, day] = match;
      return buildNormalizedDate(year, month, day);
    }
    const [, day, month, year] = match;
    return buildNormalizedDate(year, month, day);
  }

  match = trimmed.match(/^(\d{4})[-/.](\d{1,2})$/);
  if (match) {
    const [, year, month] = match;
    return buildNormalizedDate(year, month, "1");
  }

  match = trimmed.match(/^(\d{1,2})[-/.](\d{4})$/);
  if (match) {
    const [, month, year] = match;
    return buildNormalizedDate(year, month, "1");
  }

  match = trimmed.match(/^(\d{4})$/);
  if (match) {
    const [, year] = match;
    return buildNormalizedDate(year, "1", "1");
  }

  return null;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getStructuredTokenRegex(tokenKind: StructuredStringSegmentTokenKind) {
  const tokenMap: Record<StructuredStringSegmentTokenKind, string> = {
    text: "[A-Za-z0-9._%+-]",
    letters: "[A-Za-z]",
    uppercase: "[A-Z]",
    lowercase: "[a-z]",
    digits: "\\d",
    alphanumeric: "[A-Za-z0-9]",
  };

  return tokenMap[tokenKind];
}

function buildStructuredSegmentRegex(segment: StructuredStringSegment) {
  if (segment.mode === "literal") {
    return segment.literal ? escapeRegex(segment.literal) : "";
  }

  const tokenKind = segment.tokenKind ?? "text";
  const basePattern = getStructuredTokenRegex(tokenKind);
  const exactLength = segment.exactLength && segment.exactLength > 0 ? segment.exactLength : null;
  return `${basePattern}${exactLength ? `{${exactLength}}` : "+"}`;
}

function validateStructuredStringValue(value: string, customType: CustomColumnTypeDefinition | null) {
  if (!customType || customType.kind !== "pattern") return false;
  const pattern = customType.segments
    .map((segment) => buildStructuredSegmentRegex(segment))
    .filter(Boolean)
    .join("");
  return pattern ? new RegExp(`^${pattern}$`).test(value.trim()) : false;
}

function isChoiceType(type: ColumnType) {
  return type.startsWith("choice:");
}

function isPatternType(type: ColumnType) {
  return type.startsWith("pattern:");
}

function isCompatibleWithType(
  value: string,
  type: ColumnType,
  customTypes: CustomColumnTypeDefinition[],
  choiceOptions?: string[],
) {
  if (isMissingLikeValue(value)) return true;

  if (isChoiceType(type)) {
    const options =
      choiceOptions ?? customTypes.find((customType) => customType.kind === "choice" && customType.id === type)?.options;
    if (!options) return false;
    const normalizedValue = normalizeChoiceValue(value);
    return options.some((option) => normalizeChoiceValue(option) === normalizedValue);
  }

  if (isPatternType(type)) {
    const customType = customTypes.find((entry) => entry.kind === "pattern" && entry.id === type) ?? null;
    return validateStructuredStringValue(value, customType);
  }

  if (type === "text") return true;
  if (type === "null") return isMissingLikeValue(value);
  if (type === "boolean") return parseBoolean(value) != null;
  if (type === "integer") {
    const numeric = parseNumeric(value);
    return numeric != null && Number.isInteger(numeric);
  }
  if (type === "decimal") return parseNumeric(value) != null;
  if (type === "date") return normalizeDateValue(value)?.type === "date";
  if (type === "datetime") {
    const dateType = normalizeDateValue(value)?.type;
    return dateType === "date" || dateType === "datetime";
  }

  return false;
}

export function InlineCellEditor({
  type,
  choiceOptions,
  customTypes = [],
  initialValue,
  onSubmit,
  onCancel,
  className,
}: {
  type: ColumnType;
  choiceOptions?: string[];
  customTypes?: CustomColumnTypeDefinition[];
  initialValue: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
  className?: string;
}) {
  const { t } = useI18n();
  const [draft, setDraft] = useState(initialValue);

  useEffect(() => {
    setDraft(initialValue);
  }, [initialValue]);

  const isChoice = isChoiceType(type);
  const valid = useMemo(
    () => isCompatibleWithType(draft, type, customTypes, choiceOptions),
    [choiceOptions, customTypes, draft, type],
  );

  return (
    <div
      className={cn("flex items-center gap-1", className)}
      onClick={(event) => event.stopPropagation()}
      onContextMenu={(event) => event.stopPropagation()}
    >
      {isChoice ? (
        <select
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              onCancel();
            }
          }}
          autoFocus
          className="h-6 min-w-0 flex-1 rounded border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] px-1.5 text-[11px] text-[var(--color-brown-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/25"
        >
          <option value="">{t("workspace.editor.nullOption")}</option>
          {(choiceOptions ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && valid) {
              event.preventDefault();
              onSubmit(draft);
            }
            if (event.key === "Escape") {
              event.preventDefault();
              onCancel();
            }
          }}
          autoFocus
          className={cn(
            "h-6 min-w-0 flex-1 rounded border bg-[var(--color-surface-raised)] px-1.5 text-[11px] text-[var(--color-brown-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/25",
            valid
              ? "border-[var(--color-border-strong)]"
              : "border-[var(--color-destructive)] text-[var(--color-destructive)]",
          )}
          placeholder={
            type === "date"
              ? t("workspace.editor.datePlaceholder")
              : type === "datetime"
                ? t("workspace.editor.datetimePlaceholder")
                : t("workspace.editor.nullOption")
          }
        />
      )}
      <button
        type="button"
        onClick={() => onCancel()}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-brown)] hover:bg-[var(--color-surface-raised)]"
        title={t("common.actions.cancel")}
      >
        <X className="h-3 w-3" />
      </button>
      <button
        type="button"
        onClick={() => valid && onSubmit(draft)}
        disabled={!valid}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
          valid
            ? "border-[var(--color-accent)] bg-[color-mix(in_oklab,var(--color-accent)_10%,var(--color-surface-raised))] text-[var(--color-accent)]"
            : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-brown)]/35",
        )}
        title={t("common.actions.apply")}
      >
        <Check className="h-3 w-3" />
      </button>
    </div>
  );
}
