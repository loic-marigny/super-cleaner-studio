import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { withBase } from "./app-base";
import { translateGlobal } from "./i18n";

export type BuiltinColumnType =
  | "text"
  | "integer"
  | "decimal"
  | "boolean"
  | "date"
  | "datetime"
  | "null";
export type ChoiceTypeId = `choice:${string}`;
export type PatternTypeId = `pattern:${string}`;
export type CustomColumnTypeId = ChoiceTypeId | PatternTypeId;
export type ColumnType = BuiltinColumnType | CustomColumnTypeId;

export type Severity = "info" | "warning" | "error";

export interface Dataset {
  headers: string[];
  rows: Array<Record<string, string>>;
}

export interface ImportSummary {
  fileName: string;
  fileSize: number;
  separator: string;
  format: "csv" | "xlsx";
  sheetName?: string;
}

export interface ChoiceTypeDefinition {
  kind: "choice";
  id: ChoiceTypeId;
  name: string;
  options: string[];
}

export type StructuredStringSegmentTokenKind =
  | "text"
  | "letters"
  | "uppercase"
  | "lowercase"
  | "digits"
  | "alphanumeric";

export interface StructuredStringSegment {
  mode: "token" | "literal";
  tokenKind?: StructuredStringSegmentTokenKind;
  literal?: string;
  exactLength?: number | null;
}

export interface StructuredStringTypeDefinition {
  kind: "pattern";
  id: PatternTypeId;
  name: string;
  segments: StructuredStringSegment[];
  description: string;
}

export type CustomColumnTypeDefinition = ChoiceTypeDefinition | StructuredStringTypeDefinition;

export type DateFormat = "yyyy-mm-dd" | "dd/mm/yyyy" | "mm/dd/yyyy";
export type DecimalSeparator = "dot" | "comma" | "both";
export type BooleanDisplayFormat = "true-false" | "1-0" | "oui-non" | "yes-no";
export interface NumericBoundsOverride {
  lowerBound?: number | null;
  upperBound?: number | null;
}

export interface AnalysisCellFlag {
  invalid?: boolean;
  warning?: boolean;
  empty?: boolean;
  message?: string;
  reasons?: string[];
}

export interface AnalysisPreviewRow {
  [key: string]: { value: string; flag?: AnalysisCellFlag };
}

export interface ColumnAnalysis {
  key: string;
  name: string;
  type: ColumnType;
  inferredType: ColumnType;
  isTypeOverridden: boolean;
  trackSpread: boolean;
  trackNulls: boolean;
  positiveOnly: boolean;
  compatibilityRate: number;
  incompatibleCount: number;
  integerAutoCorrectableCount?: number;
  negativeValueCount?: number;
  incompatibleSamples: string[];
  missingCount: number;
  missingRate: number;
  presentCount: number;
  completenessRate: number;
  distinctCount: number;
  uniquenessRate: number;
  nullishOnly: boolean;
  isSparse: boolean;
  isEmpty: boolean;
  choiceOptions?: string[];
  nonCanonicalBooleanCount?: number;
  booleanDisplayMismatchCount?: number;
  nonCanonicalDateCount?: number;
  autoCorrectableDateCount?: number;
  nonPreferredDecimalCount?: number;
  numericStats?: {
    min: number;
    max: number;
    decile1: number;
    decile9: number;
    lowerBound: number;
    upperBound: number;
    outlierCount: number;
    outlierRate: number;
    outlierSamples: string[];
  };
}

export interface ActionImpact {
  affectedRows: number;
  affectedCells: number;
  removedRows: number;
  removedColumns: number;
  changedValues: number;
  destructive: boolean;
  beforeSample: string[];
  afterSample: string[];
}

export type OperationKind =
  | "remove-empty-rows"
  | "remove-sparse-rows"
  | "remove-sparse-column"
  | "remove-column"
  | "remove-row"
  | "promote-row-to-header"
  | "update-cell"
  | "nullify-incompatible"
  | "round-incompatible-integers"
  | "truncate-incompatible-integers"
  | "filter-incompatible-rows"
  | "nullify-outliers"
  | "normalize-boolean-values"
  | "normalize-date-values"
  | "dedupe-primary-key";

export interface CleaningOperation {
  id: string;
  label: string;
  kind: OperationKind;
  columnKey?: string;
  primaryKey?: string;
  rowIndex?: number;
  value?: string;
  mode?: "keep-first" | "keep-last" | "drop-all";
}

export interface SuggestedAction extends CleaningOperation {
  description: string;
}

export interface IssueSummary {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  columnKey?: string;
  actions: SuggestedAction[];
}

export interface AnalysisSummary {
  rowCount: number;
  columnCount: number;
  previewOffset: number;
  previewLimit: number;
  emptyRowCount: number;
  sparseRowCount: number;
  sparseColumnCount: number;
  totalMissingCells: number;
  columns: ColumnAnalysis[];
  previewRows: AnalysisPreviewRow[];
  issues: IssueSummary[];
  primaryKeyCandidates: Array<{
    key: string;
    uniquenessRate: number;
    missingCount: number;
    strict: boolean;
  }>;
  selectedPrimaryKey: string | null;
  duplicateSummary:
    | {
        key: string;
        duplicateValueCount: number;
        affectedRowCount: number;
        duplicateRate: number;
        samples: string[];
      }
    | null;
}

type ColumnNameOverrides = Partial<Record<string, string>>;

interface DerivedWorkspace {
  dataset: Dataset;
  analysis: AnalysisSummary;
}

interface WorkspaceState {
  status: "idle" | "importing" | "ready" | "error";
  isBusy: boolean;
  message: string;
  progress: number;
  source: ImportSummary | null;
  pendingSheetNames: string[];
  analysis: AnalysisSummary | null;
  previewDataset: Dataset | null;
  dateFormat: DateFormat;
  decimalSeparator: DecimalSeparator;
  booleanDisplayFormat: BooleanDisplayFormat;
  removeEmptyColumnsOnImport: boolean;
  previewPage: number;
  customTypes: CustomColumnTypeDefinition[];
  canUndo: boolean;
  undoCount: number;
  importFile: (file: File) => Promise<void>;
  selectImportSheet: (sheetName: string) => Promise<void>;
  cancelImportSheetSelection: () => void;
  loadDemo: () => Promise<void>;
  selectPrimaryKey: (key: string | null) => void;
  setColumnName: (key: string, name: string) => void;
  setColumnType: (key: string, type: ColumnType) => void;
  setColumnSpreadTracking: (key: string, enabled: boolean) => void;
  setColumnSpreadBounds: (key: string, bounds: NumericBoundsOverride) => void;
  setColumnNullTracking: (key: string, enabled: boolean) => void;
  setColumnPositiveTracking: (key: string, enabled: boolean) => void;
  setDateFormat: (format: DateFormat) => void;
  setDecimalSeparator: (separator: DecimalSeparator) => void;
  setBooleanDisplayFormat: (format: BooleanDisplayFormat) => void;
  setRemoveEmptyColumnsOnImport: (enabled: boolean) => void;
  resetPreferences: () => void;
  setPreviewPage: (page: number) => void;
  createChoiceType: (name: string, options: string[]) => void;
  createStructuredStringType: (name: string, segments: StructuredStringSegment[]) => void;
  buildPreview: (operation: CleaningOperation) => ActionImpact | null;
  applyOperation: (operation: CleaningOperation) => void;
  undoLast: () => void;
  clear: () => void;
  exportCsv: (fileName?: string) => void;
  exportXlsx: (fileName?: string) => Promise<void>;
  exportAnomalyReport: (fileName?: string) => void;
}

const WorkspaceContext = createContext<WorkspaceState | null>(null);

const FILE_SIZE_WARNING_THRESHOLD = 5 * 1024 * 1024;
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const PREVIEW_LIMIT = 100;
const UNDO_LIMIT = 5;
const MISSING_TEXT = new Set(["", "n/a", "na", "null", "none", "-"]);
const UTF8_BOM = "\uFEFF";
const NO_PRIMARY_KEY = "__none__";
const REMOVE_EMPTY_COLUMNS_PREF_KEY = "super-cleaner.remove-empty-columns-on-import";
const BOOLEAN_DISPLAY_FORMAT_PREF_KEY = "super-cleaner.boolean-display-format";
const NORMALIZED_SPACE_REGEX = /[\u00A0\u1680\u2000-\u200B\u202F\u205F\u2060\u3000]/g;

function waitForNextPaint() {
  if (typeof window === "undefined") return Promise.resolve();
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

function readStoredBooleanPreference(key: string, fallback: boolean) {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    if (value == null) return fallback;
    return value === "true";
  } catch {
    return fallback;
  }
}

function readStoredBooleanDisplayFormatPreference(fallback: BooleanDisplayFormat) {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(BOOLEAN_DISPLAY_FORMAT_PREF_KEY);
    return value === "1-0" || value === "oui-non" || value === "yes-no" || value === "true-false"
      ? value
      : fallback;
  } catch {
    return fallback;
  }
}

function persistBooleanPreference(key: string, value: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // Ignore storage failures and keep the in-memory preference.
  }
}

function clearStoredPreference(key: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage failures and keep the in-memory preference.
  }
}

function isChoiceType(type: ColumnType): type is ChoiceTypeId {
  return type.startsWith("choice:");
}

function isPatternType(type: ColumnType): type is PatternTypeId {
  return type.startsWith("pattern:");
}

function slugifyChoiceTypeName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeChoiceValue(value: string) {
  return value.trim().toLowerCase();
}

function findCustomType(type: ColumnType, customTypes: CustomColumnTypeDefinition[]) {
  if (!isChoiceType(type) && !isPatternType(type)) return null;
  return customTypes.find((customType) => customType.id === type) ?? null;
}

function findChoiceType(type: ColumnType, customTypes: CustomColumnTypeDefinition[]) {
  if (!isChoiceType(type)) return null;
  const customType = findCustomType(type, customTypes);
  return customType?.kind === "choice" ? customType : null;
}

function findStructuredStringType(type: ColumnType, customTypes: CustomColumnTypeDefinition[]) {
  if (!isPatternType(type)) return null;
  const customType = findCustomType(type, customTypes);
  return customType?.kind === "pattern" ? customType : null;
}

function createOperationId() {
  return `op_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeCell(raw: string) {
  return raw.replace(/\r/g, "").replace(NORMALIZED_SPACE_REGEX, " ");
}

function hasSignature(bytes: Uint8Array, signature: number[]) {
  return signature.every((value, index) => bytes[index] === value);
}

function detectUtf16Encoding(bytes: Uint8Array) {
  const sampleLength = Math.min(bytes.length - (bytes.length % 2), 256);
  if (sampleLength < 4) return null;

  let evenZeroes = 0;
  let oddZeroes = 0;
  let pairs = 0;

  for (let index = 0; index < sampleLength; index += 2) {
    if (bytes[index] === 0) evenZeroes += 1;
    if (bytes[index + 1] === 0) oddZeroes += 1;
    pairs += 1;
  }

  if (pairs === 0) return null;

  const evenRatio = evenZeroes / pairs;
  const oddRatio = oddZeroes / pairs;

  if (oddRatio > 0.3 && evenRatio < 0.1) return "utf-16le";
  if (evenRatio > 0.3 && oddRatio < 0.1) return "utf-16be";
  return null;
}

function sanitizeImportedText(text: string) {
  return text.replace(/^\uFEFF/, "").replace(NORMALIZED_SPACE_REGEX, " ");
}

function decodeUploadedCsv(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);

  if (hasSignature(bytes, [0xef, 0xbb, 0xbf])) {
    return sanitizeImportedText(new TextDecoder("utf-8").decode(bytes.subarray(3)));
  }

  if (hasSignature(bytes, [0xff, 0xfe])) {
    return sanitizeImportedText(new TextDecoder("utf-16le").decode(bytes.subarray(2)));
  }

  if (hasSignature(bytes, [0xfe, 0xff])) {
    return sanitizeImportedText(new TextDecoder("utf-16be").decode(bytes.subarray(2)));
  }

  const inferredUtf16 = detectUtf16Encoding(bytes);
  if (inferredUtf16) {
    return sanitizeImportedText(new TextDecoder(inferredUtf16).decode(bytes));
  }

  try {
    return sanitizeImportedText(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    return sanitizeImportedText(new TextDecoder("windows-1252").decode(bytes));
  }
}

function isMissingValue(value: string) {
  const trimmed = value.trim();
  return trimmed.length === 0 || MISSING_TEXT.has(trimmed.toLowerCase());
}

function parseBoolean(value: string) {
  const normalized = value.trim().toLowerCase();
  if (["true", "false", "vrai", "faux", "yes", "no", "oui", "non", "0", "1"].includes(normalized)) {
    return normalized;
  }
  return null;
}

function isTextualBooleanToken(value: string) {
  const normalized = value.trim().toLowerCase();
  return ["true", "false", "vrai", "faux", "yes", "no", "oui", "non"].includes(normalized);
}

function normalizeBooleanValue(value: string) {
  const normalized = value.trim().toLowerCase();
  if (["true", "yes", "oui", "vrai", "1"].includes(normalized)) return "true";
  if (["false", "no", "non", "faux", "0"].includes(normalized)) return "false";
  return null;
}

export function formatBooleanValue(value: string, format: BooleanDisplayFormat) {
  const normalized = normalizeBooleanValue(value);
  if (normalized == null) return value;

  const truthy = format === "1-0" ? "1" : format === "oui-non" ? "oui" : format === "yes-no" ? "yes" : "true";
  const falsy = format === "1-0" ? "0" : format === "oui-non" ? "non" : format === "yes-no" ? "no" : "false";
  return normalized === "true" ? truthy : falsy;
}

export function getBooleanDisplayFormatLabel(format: BooleanDisplayFormat) {
  if (format === "1-0") return "0 / 1";
  if (format === "oui-non") return "oui / non";
  if (format === "yes-no") return "yes / no";
  return "true / false";
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

function describeStructuredSegment(segment: StructuredStringSegment) {
  if (segment.mode === "literal") {
    return segment.literal?.length ? `"${segment.literal}"` : "litteral vide";
  }

  const labels: Record<StructuredStringSegmentTokenKind, string> = {
    text: "texte",
    letters: "lettres",
    uppercase: "majuscules",
    lowercase: "minuscules",
    digits: "chiffres",
    alphanumeric: "alphanumerique",
  };
  const label = labels[segment.tokenKind ?? "text"];
  return segment.exactLength && segment.exactLength > 0 ? `${label} x${segment.exactLength}` : `${label}+`;
}

function buildStructuredStringRegex(segments: StructuredStringSegment[]) {
  const pattern = segments
    .map((segment) => buildStructuredSegmentRegex(segment))
    .filter((segmentRegex) => segmentRegex.length > 0)
    .join("");
  return pattern ? new RegExp(`^${pattern}$`) : null;
}

function validateStructuredStringValue(
  value: string,
  structuredType: StructuredStringTypeDefinition | null,
) {
  if (!structuredType) return false;
  const pattern = buildStructuredStringRegex(structuredType.segments);
  return pattern ? pattern.test(value.trim()) : false;
}

function parseNumeric(value: string) {
  const normalized = value.trim().replace(/\s/g, "").replace(",", ".");
  if (!normalized || !/^-?\d+(\.\d+)?$/.test(normalized)) {
    return null;
  }
  const num = Number(normalized);
  return Number.isFinite(num) ? num : null;
}

function getDecimalSeparatorIssue(value: string, decimalSeparator: DecimalSeparator) {
  if (decimalSeparator === "both") return false;
  const trimmed = value.trim();
  if (!trimmed || parseNumeric(value) == null) return false;
  const hasDotDecimal = /^-?\d+\.\d+$/.test(trimmed.replace(/\s/g, "").replace(",", "."))
    ? trimmed.includes(".")
    : false;
  const hasCommaDecimal = /^-?\d+,\d+$/.test(trimmed.replace(/\s/g, "")) ? trimmed.includes(",") : false;
  if (decimalSeparator === "dot") return hasCommaDecimal;
  return hasDotDecimal;
}

function parseDateLike(value: string) {
  return normalizeDateValue(value)?.type ?? null;
}

function parseDateParts(value: string) {
  const normalized = normalizeDateValue(value);
  if (!normalized) return null;
  return {
    year: normalized.year,
    month: normalized.month,
    day: normalized.day,
    time: normalized.time,
  };
}

function isValidDateParts(year: string, month: string, day: string) {
  const yearNumber = Number(year);
  const monthNumber = Number(month);
  const dayNumber = Number(day);
  if (!Number.isInteger(yearNumber) || !Number.isInteger(monthNumber) || !Number.isInteger(dayNumber)) {
    return false;
  }
  if (monthNumber < 1 || monthNumber > 12 || dayNumber < 1 || dayNumber > 31) {
    return false;
  }
  const parsed = new Date(Date.UTC(yearNumber, monthNumber - 1, dayNumber));
  return (
    parsed.getUTCFullYear() === yearNumber &&
    parsed.getUTCMonth() === monthNumber - 1 &&
    parsed.getUTCDate() === dayNumber
  );
}

function padDateSegment(value: string) {
  return value.padStart(2, "0");
}

function buildNormalizedDate(
  year: string,
  month: string,
  day: string,
  time = "",
  source = "",
) {
  const normalizedMonth = padDateSegment(month);
  const normalizedDay = padDateSegment(day);
  if (!isValidDateParts(year, normalizedMonth, normalizedDay)) {
    return null;
  }

  const trimmedSource = source.trim();
  const normalizedTime = time
    ? time
        .split(":")
        .map((part) => padDateSegment(part))
        .join(":")
    : "";
  const canonical = `${year}-${normalizedMonth}-${normalizedDay}${normalizedTime ? ` ${normalizedTime}` : ""}`;

  return {
    type: normalizedTime ? ("datetime" as const) : ("date" as const),
    canonical,
    year,
    month: normalizedMonth,
    day: normalizedDay,
    time: normalizedTime,
    wasNormalized: trimmedSource !== canonical,
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
      const [, year, month, day, hour, minute, second] = match;
      return buildNormalizedDate(
        year,
        month,
        day,
        `${hour}:${minute}${second ? `:${second}` : ""}`,
        value,
      );
    }
    const [, day, month, year, hour, minute, second] = match;
    return buildNormalizedDate(
      year,
      month,
      day,
      `${hour}:${minute}${second ? `:${second}` : ""}`,
      value,
    );
  }

  match =
    trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/) ??
    trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);

  if (match) {
    if (match[1].length === 4) {
      const [, year, month, day] = match;
      return buildNormalizedDate(year, month, day, "", value);
    }
    const [, day, month, year] = match;
    return buildNormalizedDate(year, month, day, "", value);
  }

  match = trimmed.match(/^(\d{4})[-/.](\d{1,2})$/);
  if (match) {
    const [, year, month] = match;
    return buildNormalizedDate(year, month, "1", "", value);
  }

  match = trimmed.match(/^(\d{1,2})[-/.](\d{4})$/);
  if (match) {
    const [, month, year] = match;
    return buildNormalizedDate(year, month, "1", "", value);
  }

  match = trimmed.match(/^(\d{4})$/);
  if (match) {
    const [, year] = match;
    return buildNormalizedDate(year, "1", "1", "", value);
  }

  return null;
}

function looksLikeDateValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return false;

  return [
    /^\d{4}$/,
    /^\d{4}[-/.]\d{1,2}$/,
    /^\d{1,2}[-/.]\d{4}$/,
    /^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}$/,
    /^\d{1,2}[-/.]\d{1,2}[-/.]\d{4}$/,
    /^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}[ tT]\d{1,2}:\d{2}(?::\d{2})?$/,
    /^\d{1,2}[-/.]\d{1,2}[-/.]\d{4}[ tT]\d{1,2}:\d{2}(?::\d{2})?$/,
  ].some((pattern) => pattern.test(trimmed));
}

function formatDateForPreview(value: string, type: ColumnType, dateFormat: DateFormat) {
  const normalized = normalizeDateValue(value);
  if (!normalized || value.trim() !== normalized.canonical) return value;

  const parts = parseDateParts(value);
  if (!parts) return value;

  const base =
    dateFormat === "dd/mm/yyyy"
      ? `${parts.day}/${parts.month}/${parts.year}`
      : dateFormat === "mm/dd/yyyy"
        ? `${parts.month}/${parts.day}/${parts.year}`
        : `${parts.year}-${parts.month}-${parts.day}`;

  if (type !== "datetime" || !parts.time) {
    return base;
  }

  return `${base} ${parts.time}`;
}

function classifyValueForDistribution(value: string): BuiltinColumnType {
  if (isMissingValue(value)) return "null";
  const numeric = parseNumeric(value);
  if (numeric != null) {
    return Number.isInteger(numeric) ? "integer" : "decimal";
  }
  if (parseBoolean(value) != null) return "boolean";
  const dateType = parseDateLike(value);
  if (dateType === "date") return "date";
  if (dateType === "datetime") return "datetime";
  return "text";
}

function isCompatibleWithType(
  value: string,
  type: ColumnType,
  customTypes: CustomColumnTypeDefinition[],
  choiceOptions?: string[],
) {
  if (isMissingValue(value)) return true;

  if (isChoiceType(type)) {
    const options = choiceOptions ?? findChoiceType(type, customTypes)?.options;
    if (!options) return false;
    const normalizedValue = normalizeChoiceValue(value);
    return options.some((option) => normalizeChoiceValue(option) === normalizedValue);
  }

  if (isPatternType(type)) {
    return validateStructuredStringValue(value, findStructuredStringType(type, customTypes));
  }

  if (type === "text") return true;
  if (type === "boolean") return parseBoolean(value) != null;
  if (type === "integer") {
    const numeric = parseNumeric(value);
    return numeric != null && Number.isInteger(numeric);
  }
  if (type === "decimal") return parseNumeric(value) != null;
  if (type === "date") return parseDateLike(value) === "date";
  if (type === "datetime") {
    const dateType = parseDateLike(value);
    return dateType === "date" || dateType === "datetime";
  }
  return false;
}

function inferColumnType(values: string[]): BuiltinColumnType {
  const presentValues = values.filter((value) => !isMissingValue(value));
  if (presentValues.length === 0) return "null";

  const booleanLikeCount = presentValues.filter((value) => parseBoolean(value) != null).length;
  const integerCount = presentValues.filter((value) => {
    const numeric = parseNumeric(value);
    return numeric != null && Number.isInteger(numeric);
  }).length;
  const decimalCount = presentValues.filter((value) => parseNumeric(value) != null).length;
  const dateCount = presentValues.filter((value) => parseDateLike(value) === "date").length;
  const datetimeCount = presentValues.filter((value) => {
    const dateType = parseDateLike(value);
    return dateType === "date" || dateType === "datetime";
  }).length;

  const hasTextualBoolean = presentValues.some((value) => isTextualBooleanToken(value));
  const hasNumericOutsideBinary = presentValues.some((value) => {
    const numeric = parseNumeric(value);
    return numeric != null && numeric !== 0 && numeric !== 1;
  });

  if (
    booleanLikeCount === presentValues.length &&
    (hasTextualBoolean || !hasNumericOutsideBinary)
  ) {
    return "boolean";
  }
  if (integerCount === presentValues.length) return "integer";
  if (decimalCount === presentValues.length) return "decimal";
  if (datetimeCount === presentValues.length) return "datetime";
  if (dateCount === presentValues.length) return "date";

  const distribution: Record<Exclude<BuiltinColumnType, "null">, number> = {
    text: 0,
    integer: 0,
    decimal: 0,
    boolean: 0,
    date: 0,
    datetime: 0,
  };

  presentValues.forEach((value) => {
    const detectedType = classifyValueForDistribution(value);
    if (detectedType !== "null") {
      distribution[detectedType] += 1;
    }
  });

  return (Object.entries(distribution).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "text") as BuiltinColumnType;
}

function percentile(sorted: number[], p: number) {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function humanSeparator(separator: string) {
  if (separator === "\t") return "tabulation";
  return separator;
}

function formatRate(value: number) {
  return `${(value * 100).toFixed(1)} %`;
}

function formatType(type: ColumnType, customTypes: CustomColumnTypeDefinition[] = []) {
  if (isChoiceType(type)) {
    return findChoiceType(type, customTypes)?.name ?? type.replace(/^choice:/, "");
  }
  if (isPatternType(type)) {
    return findStructuredStringType(type, customTypes)?.name ?? type.replace(/^pattern:/, "");
  }
  const labels: Record<BuiltinColumnType, string> = {
    text: "Texte",
    integer: "Entier",
    decimal: "Décimal",
    boolean: "Booléen",
    date: "Date",
    datetime: "Date/heure",
    null: "Null",
  };
  return labels[type];
}

function parseCsv(text: string, separator: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === separator) {
      row.push(normalizeCell(field));
      field = "";
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      row.push(normalizeCell(field));
      rows.push(row);
      field = "";
      row = [];
      continue;
    }

    field += char;
  }

  row.push(normalizeCell(field));
  if (row.length > 1 || row[0]?.length) {
    rows.push(row);
  }
  return rows;
}

function detectSeparator(text: string) {
  const sample = text.split(/\r?\n/).slice(0, 20).join("\n");
  const candidates = [",", ";", "\t", "|"];
  const scored = candidates
    .map((candidate) => {
      const parsed = parseCsv(sample, candidate).filter((row) => row.some((cell) => cell.length > 0));
      const widths = parsed.map((row) => row.length);
      const avgWidth = widths.reduce((sum, width) => sum + width, 0) / Math.max(widths.length, 1);
      const distinctWidths = new Set(widths).size;
      return { candidate, avgWidth, distinctWidths };
    })
    .sort((a, b) => b.avgWidth - a.avgWidth || a.distinctWidths - b.distinctWidths);

  if (!scored[0] || scored[0].avgWidth < 2) {
    throw new Error(translateGlobal("workspace.engine.errors.separatorDetection"));
  }
  return scored[0].candidate;
}

function toDataset(text: string, separator: string): Dataset {
  const rows = parseCsv(text, separator).filter((row) => row.some((cell) => cell.trim().length > 0));
  return rowsToDataset(rows);
}

export function rowsToDataset(rows: string[][]): Dataset {
  if (rows.length === 0) {
    throw new Error(translateGlobal("workspace.engine.errors.emptyFile"));
  }

  const [rawHeaders, ...dataRows] = rows;
  const headers = rawHeaders.map((header) => header.trim());
  if (headers.length === 0 || headers.every((header) => header.length === 0)) {
    throw new Error(translateGlobal("workspace.engine.errors.invalidHeader"));
  }
  if (headers.some((header) => header.length === 0)) {
    throw new Error(translateGlobal("workspace.engine.errors.emptyColumnName"));
  }
  if (new Set(headers).size !== headers.length) {
    throw new Error(translateGlobal("workspace.engine.errors.duplicateColumnNames"));
  }

  const invalidRow = dataRows.find((row) => row.length !== headers.length);
  if (invalidRow) {
    throw new Error(translateGlobal("workspace.engine.errors.inconsistentColumns"));
  }
  if (dataRows.length === 0) {
    throw new Error(translateGlobal("workspace.engine.errors.noDataRows"));
  }

  return {
    headers,
    rows: dataRows.map((row) =>
      Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])),
      ),
  };
}

export function normalizeWorksheetRow(row: unknown[]) {
  return row.map((cell) => normalizeCell(String(cell ?? "")));
}

export function worksheetRowsToDataset(rows: unknown[][]) {
  const normalizedRows = rows
    .filter((row): row is unknown[] => Array.isArray(row))
    .map((row) => normalizeWorksheetRow(row))
    .filter((row) => row.some((cell) => cell.trim().length > 0));

  if (normalizedRows.length === 0) {
    throw new Error(translateGlobal("workspace.engine.errors.emptySheet"));
  }

  return rowsToDataset(normalizedRows);
}

export function selectWorkbookSheet(
  sheets: Array<{ sheet: string; data: unknown[][] }>,
  sheetName: string,
) {
  const sheet = sheets.find((entry) => entry.sheet === sheetName);
  if (!sheet) {
    throw new Error(translateGlobal("workspace.engine.errors.sheetNotFound"));
  }
  return worksheetRowsToDataset(sheet.data);
}

function buildDerivedCsvName(fileName: string, suffix: string) {
  const baseName = fileName.replace(/\.(csv|xlsx|xls)$/i, "");
  return `${baseName}${suffix}`;
}

function getImportCompletionMessage(fileSize: number) {
  if (fileSize > FILE_SIZE_WARNING_THRESHOLD) {
    return translateGlobal("workspace.engine.status.largeFileWarning");
  }
  return translateGlobal("workspace.engine.status.ready");
}

export function datasetToSheetRows(dataset: Dataset, columnNameOverrides: ColumnNameOverrides) {
  return [
    dataset.headers.map((header) => getColumnDisplayName(header, columnNameOverrides)),
    ...dataset.rows.map((row) => dataset.headers.map((header) => row[header] ?? "")),
  ];
}

export function analyzeDataset(
  dataset: Dataset,
  selectedPrimaryKey: string | null,
  columnNameOverrides: ColumnNameOverrides,
  typeOverrides: Partial<Record<string, ColumnType>>,
  customTypes: CustomColumnTypeDefinition[],
  spreadTracking: Partial<Record<string, boolean>>,
  spreadBounds: Partial<Record<string, NumericBoundsOverride>>,
  nullTracking: Partial<Record<string, boolean>>,
  positiveTracking: Partial<Record<string, boolean>>,
  dateFormat: DateFormat,
  decimalSeparator: DecimalSeparator,
  booleanDisplayFormat: BooleanDisplayFormat,
  previewPage = 0,
): AnalysisSummary {
  const { headers, rows } = dataset;
  const rowCount = rows.length;
  const columnCount = headers.length;
  const emptyRowIndices = new Set<number>();
  const sparseRowIndices = new Set<number>();
  const columnIssues = new Map<string, Set<"type" | "missing" | "outlier">>();
  const invalidCells = new Map<string, Set<number>>();
  const warningCells = new Map<string, Set<number>>();
  const emptyCells = new Map<string, Set<number>>();
  const cellMessages = new Map<string, Map<number, string[]>>();
  const cellReasons = new Map<string, Map<number, Set<string>>>();
  const columns: ColumnAnalysis[] = [];

  const appendCellMessage = (header: string, rowIndex: number, message: string) => {
    const messagesByRow = cellMessages.get(header) ?? new Map<number, string[]>();
    const messages = messagesByRow.get(rowIndex) ?? [];
    messages.push(message);
    messagesByRow.set(rowIndex, messages);
    cellMessages.set(header, messagesByRow);
  };

  const appendCellReason = (header: string, rowIndex: number, reason: string) => {
    const reasonsByRow = cellReasons.get(header) ?? new Map<number, Set<string>>();
    const reasons = reasonsByRow.get(rowIndex) ?? new Set<string>();
    reasons.add(reason);
    reasonsByRow.set(rowIndex, reasons);
    cellReasons.set(header, reasonsByRow);
  };

  headers.forEach((header) => {
    const values = rows.map((row) => row[header] ?? "");
    let missingCount = 0;
    const distinct = new Set<string>();
    const compatibleRows = new Set<number>();
    const incompatibleRows = new Set<number>();
    const numericValues: Array<{ value: number; rowIndex: number }> = [];
    const trackNulls = nullTracking[header] ?? true;
    const positiveOnly = positiveTracking[header] ?? false;

    values.forEach((value, rowIndex) => {
      if (isMissingValue(value)) {
        missingCount += 1;
        if (trackNulls) {
          emptyCells.set(header, (emptyCells.get(header) ?? new Set<number>()).add(rowIndex));
          appendCellMessage(header, rowIndex, "Valeur manquante ou vide.");
          appendCellReason(header, rowIndex, "missing");
        }
        return;
      }

      distinct.add(value);
      const numeric = parseNumeric(value);
      if (numeric != null) {
        numericValues.push({ value: numeric, rowIndex });
      }
    });

    const inferredType = inferColumnType(values);
    const majorityType = typeOverrides[header] ?? inferredType;

    const incompatibleSamples: string[] = [];
    let integerAutoCorrectableCount = 0;
    let negativeValueCount = 0;
    let nonCanonicalBooleanCount = 0;
    let booleanDisplayMismatchCount = 0;
    let nonCanonicalDateCount = 0;
    let autoCorrectableDateCount = 0;
    let nonPreferredDecimalCount = 0;
    values.forEach((value, rowIndex) => {
      if (isCompatibleWithType(value, majorityType, customTypes)) {
        compatibleRows.add(rowIndex);
        if ((majorityType === "integer" || majorityType === "decimal") && getDecimalSeparatorIssue(value, decimalSeparator)) {
          nonPreferredDecimalCount += 1;
          warningCells.set(header, (warningCells.get(header) ?? new Set<number>()).add(rowIndex));
          appendCellReason(header, rowIndex, "decimal-separator");
          appendCellMessage(
            header,
            rowIndex,
            decimalSeparator === "dot"
              ? "Séparateur décimal inattendu. Forme attendue avec un point."
              : "Séparateur décimal inattendu. Forme attendue avec une virgule.",
          );
        }
        if ((majorityType === "integer" || majorityType === "decimal") && positiveOnly) {
          const numeric = parseNumeric(value);
          if (numeric != null && numeric < 0) {
            negativeValueCount += 1;
            warningCells.set(header, (warningCells.get(header) ?? new Set<number>()).add(rowIndex));
            appendCellReason(header, rowIndex, "positive-only");
            appendCellMessage(header, rowIndex, "Valeur négative alors que la colonne est réglée sur positifs uniquement.");
          }
        }
        if (majorityType === "boolean") {
          const normalizedBoolean = normalizeBooleanValue(value);
          const expectedDisplay = formatBooleanValue(value, booleanDisplayFormat);
          if (normalizedBoolean != null && value.trim().toLowerCase() !== expectedDisplay.toLowerCase()) {
            nonCanonicalBooleanCount += 1;
            booleanDisplayMismatchCount += 1;
            warningCells.set(header, (warningCells.get(header) ?? new Set<number>()).add(rowIndex));
            appendCellReason(header, rowIndex, "boolean-normalize");
            appendCellMessage(header, rowIndex, `Valeur booléenne non normalisée. Forme proposée : ${expectedDisplay}.`);
          }
        }
        if (majorityType === "date" || majorityType === "datetime") {
          const normalizedDate = normalizeDateValue(value);
          if (normalizedDate && value.trim() !== normalizedDate.canonical) {
            nonCanonicalDateCount += 1;
            autoCorrectableDateCount += 1;
            warningCells.set(header, (warningCells.get(header) ?? new Set<number>()).add(rowIndex));
            appendCellReason(header, rowIndex, "date-normalize");
            appendCellMessage(header, rowIndex, `Date non normalisée. Forme proposée : ${normalizedDate.canonical}.`);
          } else if (!normalizedDate && looksLikeDateValue(value)) {
            nonCanonicalDateCount += 1;
            invalidCells.set(header, (invalidCells.get(header) ?? new Set<number>()).add(rowIndex));
            columnIssues.set(header, (columnIssues.get(header) ?? new Set()).add("type"));
            appendCellReason(header, rowIndex, "type");
            appendCellMessage(header, rowIndex, "Date détectée mais invalide ou ambiguë. Correction automatique impossible.");
          }
        }
      } else {
        incompatibleRows.add(rowIndex);
        appendCellReason(header, rowIndex, "type");
        if (majorityType === "integer") {
          const numeric = parseNumeric(value);
          if (numeric != null && !Number.isInteger(numeric)) {
            integerAutoCorrectableCount += 1;
          }
        }
        if ((majorityType === "date" || majorityType === "datetime") && looksLikeDateValue(value)) {
          appendCellMessage(header, rowIndex, "Date détectée mais invalide ou ambiguë. Correction automatique impossible.");
        } else {
          appendCellMessage(
            header,
            rowIndex,
            `Valeur incompatible avec le type majoritaire ${formatType(majorityType, customTypes)}.`,
          );
        }
        if (incompatibleSamples.length < 3) {
          incompatibleSamples.push(value);
        }
      }
    });

    const presentCount = rowCount - missingCount;
    const compatibilityRate = rowCount === 0 ? 1 : compatibleRows.size / rowCount;
    const missingRate = rowCount === 0 ? 0 : missingCount / rowCount;
    const completenessRate = rowCount === 0 ? 1 : presentCount / rowCount;
    const isSparse = missingRate > 0.8;
    const isZeroOnly =
      presentCount > 0 &&
      values.every((value) => {
        if (isMissingValue(value)) return true;
        const numeric = parseNumeric(value);
        return numeric === 0;
      });
    const isEmpty = missingCount === rowCount || isZeroOnly;

    if (incompatibleRows.size > 0) {
      invalidCells.set(header, incompatibleRows);
      columnIssues.set(header, (columnIssues.get(header) ?? new Set()).add("type"));
    }
    if (trackNulls && missingCount > 0) {
      columnIssues.set(header, (columnIssues.get(header) ?? new Set()).add("missing"));
    }

    let numericStats: ColumnAnalysis["numericStats"];
    const trackSpread = spreadTracking[header] ?? true;

    if ((majorityType === "integer" || majorityType === "decimal") && trackSpread) {
      const sorted = numericValues.map((entry) => entry.value).sort((a, b) => a - b);
      const decile1 = percentile(sorted, 0.1);
      const decile9 = percentile(sorted, 0.9);
      const interval = decile9 - decile1;
      const defaultLowerBound = decile1 - 0.25 * interval;
      const defaultUpperBound = decile9 + 0.25 * interval;
      const configuredBounds = spreadBounds[header];
      const lowerBound = configuredBounds?.lowerBound ?? defaultLowerBound;
      const upperBound = configuredBounds?.upperBound ?? defaultUpperBound;
      const outliers = numericValues.filter((entry) => entry.value < lowerBound || entry.value > upperBound);
      if (outliers.length > 0) {
        const currentWarnings = warningCells.get(header) ?? new Set<number>();
        outliers.forEach((entry) => currentWarnings.add(entry.rowIndex));
        warningCells.set(header, currentWarnings);
        columnIssues.set(header, (columnIssues.get(header) ?? new Set()).add("outlier"));
        outliers.forEach((entry) => {
          appendCellReason(header, entry.rowIndex, "outlier");
          appendCellMessage(
            header,
            entry.rowIndex,
            `Valeur potentiellement aberrante hors bornes [${lowerBound.toFixed(2)} ; ${upperBound.toFixed(2)}].`,
          );
        });
      }
      numericStats = {
        min: sorted[0] ?? 0,
        max: sorted[sorted.length - 1] ?? 0,
        decile1,
        decile9,
        lowerBound,
        upperBound,
        outlierCount: outliers.length,
        outlierRate: rowCount === 0 ? 0 : outliers.length / rowCount,
        outlierSamples: outliers.slice(0, 3).map((entry) => rows[entry.rowIndex]?.[header] ?? ""),
      };
    }

    columns.push({
      key: header,
      name: columnNameOverrides[header]?.trim() || header,
      type: majorityType,
      inferredType,
      isTypeOverridden: typeOverrides[header] != null,
      trackSpread,
      trackNulls,
      positiveOnly,
      compatibilityRate,
      incompatibleCount: incompatibleRows.size,
      integerAutoCorrectableCount: majorityType === "integer" ? integerAutoCorrectableCount : undefined,
      negativeValueCount:
        majorityType === "integer" || majorityType === "decimal" ? negativeValueCount : undefined,
      incompatibleSamples,
      missingCount,
      missingRate,
      presentCount,
      completenessRate,
      distinctCount: distinct.size,
      uniquenessRate: rowCount === 0 ? 0 : distinct.size / rowCount,
      nullishOnly: missingCount === rowCount,
      isSparse,
      isEmpty,
      choiceOptions: isChoiceType(majorityType) ? (findChoiceType(majorityType, customTypes)?.options ?? []) : undefined,
      nonCanonicalBooleanCount: majorityType === "boolean" ? nonCanonicalBooleanCount : undefined,
      booleanDisplayMismatchCount: majorityType === "boolean" ? booleanDisplayMismatchCount : undefined,
      nonCanonicalDateCount: majorityType === "date" || majorityType === "datetime" ? nonCanonicalDateCount : undefined,
      autoCorrectableDateCount: majorityType === "date" || majorityType === "datetime" ? autoCorrectableDateCount : undefined,
      nonPreferredDecimalCount:
        majorityType === "integer" || majorityType === "decimal" ? nonPreferredDecimalCount : undefined,
      numericStats,
    });
  });

  rows.forEach((row, rowIndex) => {
    const missingCellsCount = headers.reduce(
      (count, header) => count + (isMissingValue(row[header] ?? "") ? 1 : 0),
      0,
    );
    if (missingCellsCount === columnCount) {
      emptyRowIndices.add(rowIndex);
      return;
    }
    if (columnCount > 0 && missingCellsCount / columnCount > 0.8) {
      sparseRowIndices.add(rowIndex);
    }
  });

  const primaryKeyCandidates = columns
    .map((column) => ({
      key: column.key,
      uniquenessRate: column.uniquenessRate,
      missingCount: column.missingCount,
      strict: column.missingCount === 0 && column.uniquenessRate === 1,
    }))
    .filter(
      (candidate) =>
        (candidate.strict || (candidate.missingCount === 0 && candidate.uniquenessRate >= 0.95)) &&
        candidate.key.length > 0,
    )
    .sort((a, b) => Number(b.strict) - Number(a.strict) || b.uniquenessRate - a.uniquenessRate);

  const effectivePrimaryKey =
    selectedPrimaryKey === NO_PRIMARY_KEY
      ? null
      : ((selectedPrimaryKey && headers.includes(selectedPrimaryKey) ? selectedPrimaryKey : null) ??
        primaryKeyCandidates[0]?.key ??
        null);

  let duplicateSummary: AnalysisSummary["duplicateSummary"] = null;
  if (effectivePrimaryKey) {
    const counts = new Map<string, number[]>();
    rows.forEach((row, index) => {
      const value = row[effectivePrimaryKey] ?? "";
      if (isMissingValue(value)) return;
      counts.set(value, [...(counts.get(value) ?? []), index]);
    });
    const duplicates = [...counts.entries()].filter(([, indices]) => indices.length > 1);
    if (duplicates.length > 0) {
      const allRows = new Set(duplicates.flatMap(([, indices]) => indices));
      duplicateSummary = {
        key: effectivePrimaryKey,
        duplicateValueCount: duplicates.length,
        affectedRowCount: allRows.size,
        duplicateRate: rowCount === 0 ? 0 : allRows.size / rowCount,
        samples: duplicates.slice(0, 3).map(([value]) => value),
      };
    }
  }

  const issues: IssueSummary[] = [];
  columns.forEach((column) => {
    if (column.incompatibleCount > 0) {
      issues.push({
        id: `type-${column.key}`,
        title: translateGlobal("workspace.engine.issues.incompatible.title", { column: column.name }),
        description: translateGlobal("workspace.engine.issues.incompatible.description", {
          count: column.incompatibleCount,
          type: formatType(column.type, customTypes),
        }),
        severity: "warning",
        columnKey: column.key,
        actions: [
          ...((column.type === "integer" && (column.integerAutoCorrectableCount ?? 0) > 0)
            ? [
                {
                  id: createOperationId(),
                  kind: "round-incompatible-integers" as const,
                  label: translateGlobal("workspace.engine.issues.incompatible.actions.round.label"),
                  description: translateGlobal("workspace.engine.issues.incompatible.actions.round.description"),
                  columnKey: column.key,
                },
                {
                  id: createOperationId(),
                  kind: "truncate-incompatible-integers" as const,
                  label: translateGlobal("workspace.engine.issues.incompatible.actions.truncate.label"),
                  description: translateGlobal("workspace.engine.issues.incompatible.actions.truncate.description"),
                  columnKey: column.key,
                },
              ]
            : []),
          {
            id: createOperationId(),
            kind: "nullify-incompatible",
            label: translateGlobal("workspace.engine.issues.incompatible.actions.nullify.label"),
            description: translateGlobal("workspace.engine.issues.incompatible.actions.nullify.description"),
            columnKey: column.key,
          },
          {
            id: createOperationId(),
            kind: "filter-incompatible-rows",
            label: translateGlobal("workspace.engine.issues.incompatible.actions.filter.label"),
            description: translateGlobal("workspace.engine.issues.incompatible.actions.filter.description"),
            columnKey: column.key,
          },
        ],
      });
    }

    if (column.trackNulls && column.isSparse) {
      issues.push({
        id: `sparse-column-${column.key}`,
        title: translateGlobal("workspace.engine.issues.sparseColumn.title", { column: column.name }),
        description: translateGlobal("workspace.engine.issues.sparseColumn.description", { rate: formatRate(column.missingRate) }),
        severity: column.isEmpty ? "error" : "warning",
        columnKey: column.key,
        actions: [
          {
            id: createOperationId(),
            kind: "remove-sparse-column",
            label: translateGlobal("workspace.engine.issues.sparseColumn.actions.remove.label"),
            description: translateGlobal("workspace.engine.issues.sparseColumn.actions.remove.description"),
            columnKey: column.key,
          },
        ],
      });
    }

    if ((column.booleanDisplayMismatchCount ?? 0) > 0) {
      issues.push({
        id: `normalize-bool-${column.key}`,
        title: translateGlobal("workspace.engine.issues.booleanNormalize.title", { column: column.name }),
        description: translateGlobal("workspace.engine.issues.booleanNormalize.description", {
          count: column.booleanDisplayMismatchCount ?? 0,
          format: getBooleanDisplayFormatLabel(booleanDisplayFormat),
        }),
        severity: "info",
        columnKey: column.key,
        actions: [
          {
            id: createOperationId(),
            kind: "normalize-boolean-values",
            label: translateGlobal("workspace.engine.issues.booleanNormalize.actions.normalize.label", {
              format: getBooleanDisplayFormatLabel(booleanDisplayFormat),
            }),
            description: translateGlobal("workspace.engine.issues.booleanNormalize.actions.normalize.description", {
              format: getBooleanDisplayFormatLabel(booleanDisplayFormat),
            }),
            columnKey: column.key,
          },
        ],
      });
    }

    if ((column.nonCanonicalDateCount ?? 0) > 0) {
      issues.push({
        id: `normalize-date-${column.key}`,
        title: translateGlobal("workspace.engine.issues.dateNormalize.title", { column: column.name }),
        description: translateGlobal("workspace.engine.issues.dateNormalize.description", { count: column.nonCanonicalDateCount ?? 0 }),
        severity: "info",
        columnKey: column.key,
        actions: [
          ...((column.autoCorrectableDateCount ?? 0) > 0
            ? [{
            id: createOperationId(),
            kind: "normalize-date-values",
            label: translateGlobal("workspace.engine.issues.dateNormalize.actions.normalize.label"),
            description: translateGlobal("workspace.engine.issues.dateNormalize.actions.normalize.description"),
            columnKey: column.key,
          }]
            : []),
        ],
      });
    }

    if (column.numericStats && column.numericStats.outlierCount > 0) {
      issues.push({
        id: `outlier-${column.key}`,
        title: translateGlobal("workspace.engine.issues.outliers.title", { column: column.name }),
        description: translateGlobal("workspace.engine.issues.outliers.description", { count: column.numericStats.outlierCount, lower: column.numericStats.lowerBound.toFixed(2), upper: column.numericStats.upperBound.toFixed(2) }),
        severity: "info",
        columnKey: column.key,
        actions: [
          {
            id: createOperationId(),
            kind: "nullify-outliers",
            label: translateGlobal("workspace.engine.issues.outliers.actions.nullify.label"),
            description: translateGlobal("workspace.engine.issues.outliers.actions.nullify.description"),
            columnKey: column.key,
          },
        ],
      });
    }

    if (column.type === "boolean" && (column.booleanDisplayMismatchCount ?? 0) > 0) {
      issues.push({
        id: `boolean-normalization-${column.key}`,
        title: translateGlobal("workspace.engine.issues.booleanNormalize.title", { column: column.name }),
        description: translateGlobal("workspace.engine.issues.booleanNormalize.description", {
          count: column.booleanDisplayMismatchCount ?? 0,
          format: getBooleanDisplayFormatLabel(booleanDisplayFormat),
        }),
        severity: "info",
        columnKey: column.key,
        actions: [
          {
            id: createOperationId(),
            kind: "normalize-boolean-values",
            label: translateGlobal("workspace.engine.issues.booleanNormalize.actions.canonical.label", {
              format: getBooleanDisplayFormatLabel(booleanDisplayFormat),
            }),
            description: translateGlobal("workspace.engine.issues.booleanNormalize.actions.canonical.description", {
              format: getBooleanDisplayFormatLabel(booleanDisplayFormat),
            }),
            columnKey: column.key,
          },
        ],
      });
    }
  });

  if (emptyRowIndices.size > 0) {
    issues.push({
      id: "empty-rows",
      title: translateGlobal("workspace.engine.issues.emptyRows.title"),
      description: translateGlobal("workspace.engine.issues.emptyRows.description", { count: emptyRowIndices.size }),
      severity: "warning",
      actions: [
        {
          id: createOperationId(),
          kind: "remove-empty-rows",
          label: translateGlobal("workspace.engine.issues.emptyRows.actions.remove.label"),
          description: translateGlobal("workspace.engine.issues.emptyRows.actions.remove.description"),
        },
      ],
    });
  }

  if (sparseRowIndices.size > 0) {
    issues.push({
      id: "sparse-rows",
      title: translateGlobal("workspace.engine.issues.sparseRows.title"),
      description: translateGlobal("workspace.engine.issues.sparseRows.description", { count: sparseRowIndices.size }),
      severity: "warning",
      actions: [
        {
          id: createOperationId(),
          kind: "remove-sparse-rows",
          label: translateGlobal("workspace.engine.issues.sparseRows.actions.remove.label"),
          description: translateGlobal("workspace.engine.issues.sparseRows.actions.remove.description"),
        },
      ],
    });
  }

  if (duplicateSummary) {
    issues.push({
      id: "duplicates",
      title: translateGlobal("workspace.engine.issues.duplicates.title", { key: duplicateSummary.key }),
      description: translateGlobal("workspace.engine.issues.duplicates.description", { count: duplicateSummary.affectedRowCount }),
      severity: "warning",
      actions: [
        {
          id: createOperationId(),
          kind: "dedupe-primary-key",
          label: translateGlobal("workspace.engine.issues.duplicates.actions.keepFirst.label"),
          description: translateGlobal("workspace.engine.issues.duplicates.actions.keepFirst.description"),
          primaryKey: duplicateSummary.key,
          mode: "keep-first",
        },
        {
          id: createOperationId(),
          kind: "dedupe-primary-key",
          label: translateGlobal("workspace.engine.issues.duplicates.actions.keepLast.label"),
          description: translateGlobal("workspace.engine.issues.duplicates.actions.keepLast.description"),
          primaryKey: duplicateSummary.key,
          mode: "keep-last",
        },
      ],
    });
  }

  const previewOffset = Math.max(0, previewPage) * PREVIEW_LIMIT;
  const previewRows = rows.slice(previewOffset, previewOffset + PREVIEW_LIMIT).map((row, previewIndex) =>
    Object.fromEntries(
      headers.map((header) => {
        const value = row[header] ?? "";
        const rowIndex = previewOffset + previewIndex;
        const column = columns.find((entry) => entry.key === header);
        const displayValue =
          column && (column.type === "date" || column.type === "datetime")
            ? formatDateForPreview(value, column.type, dateFormat)
            : value;
        const flag: AnalysisCellFlag = {};
        if (emptyCells.get(header)?.has(rowIndex)) flag.empty = true;
        if (invalidCells.get(header)?.has(rowIndex)) flag.invalid = true;
        if (warningCells.get(header)?.has(rowIndex)) flag.warning = true;
        const messages = cellMessages.get(header)?.get(rowIndex);
        if (messages && messages.length > 0) {
          flag.message = messages.join(" ");
        }
        const reasons = cellReasons.get(header)?.get(rowIndex);
        if (reasons && reasons.size > 0) {
          flag.reasons = [...reasons];
        }
        return [header, { value: displayValue, flag: Object.keys(flag).length === 0 ? undefined : flag }];
      }),
    ),
  );

  return {
    rowCount,
    columnCount,
    previewOffset,
    previewLimit: PREVIEW_LIMIT,
    emptyRowCount: emptyRowIndices.size,
    sparseRowCount: sparseRowIndices.size,
    sparseColumnCount: columns.filter((column) => column.isSparse).length,
    totalMissingCells: columns.reduce((sum, column) => sum + (column.trackNulls ? column.missingCount : 0), 0),
    columns,
    previewRows,
    issues,
    primaryKeyCandidates,
    selectedPrimaryKey: effectivePrimaryKey,
    duplicateSummary,
  };
}

export function executeOperation(
  dataset: Dataset,
  analysis: AnalysisSummary,
  operation: CleaningOperation,
  customTypes: CustomColumnTypeDefinition[],
  booleanDisplayFormat: BooleanDisplayFormat,
) {
  const rows = dataset.rows.map((row) => ({ ...row }));
  const headers = [...dataset.headers];
  const baseImpact: ActionImpact = {
    affectedRows: 0,
    affectedCells: 0,
    removedRows: 0,
    removedColumns: 0,
    changedValues: 0,
    destructive: false,
    beforeSample: [],
    afterSample: [],
  };

  switch (operation.kind) {
    case "update-cell": {
      if (
        operation.rowIndex == null ||
        operation.rowIndex < 0 ||
        operation.rowIndex >= rows.length ||
        !operation.columnKey ||
        !headers.includes(operation.columnKey)
      ) {
        return { dataset, impact: baseImpact };
      }

      const currentValue = rows[operation.rowIndex][operation.columnKey] ?? "";
      const nextValue = operation.value ?? "";
      if (currentValue === nextValue) {
        return { dataset, impact: baseImpact };
      }

      const nextRows = rows.map((row, index) =>
        index === operation.rowIndex ? { ...row, [operation.columnKey]: nextValue } : row,
      );

      return {
        dataset: { headers, rows: nextRows },
        impact: {
          ...baseImpact,
          affectedRows: 1,
          affectedCells: 1,
          changedValues: 1,
          beforeSample: [currentValue],
          afterSample: [nextValue],
        },
      };
    }
    case "remove-row": {
      if (operation.rowIndex == null || operation.rowIndex < 0 || operation.rowIndex >= rows.length) {
        return { dataset, impact: baseImpact };
      }
      const kept = rows.filter((_, index) => index !== operation.rowIndex);
      return {
        dataset: { headers, rows: kept },
        impact: {
          ...baseImpact,
          affectedRows: 1,
          affectedCells: headers.length,
          removedRows: 1,
          destructive: true,
        },
      };
    }
    case "promote-row-to-header": {
      if (operation.rowIndex == null || operation.rowIndex < 0 || operation.rowIndex >= rows.length) {
        return { dataset, impact: baseImpact };
      }

      const sourceRow = rows[operation.rowIndex];
      const usedHeaders = new Map<string, number>();
      const nextHeaders = headers.map((header, index) => {
        const rawValue = (sourceRow[header] ?? "").trim();
        const baseValue = rawValue || `column_${index + 1}`;
        const nextCount = (usedHeaders.get(baseValue) ?? 0) + 1;
        usedHeaders.set(baseValue, nextCount);
        return nextCount === 1 ? baseValue : `${baseValue}_${nextCount}`;
      });

      const nextRows = rows.slice(operation.rowIndex + 1).map((row) =>
        Object.fromEntries(nextHeaders.map((nextHeader, index) => [nextHeader, row[headers[index]] ?? ""])),
      );

      return {
        dataset: { headers: nextHeaders, rows: nextRows },
        impact: {
          ...baseImpact,
          affectedRows: operation.rowIndex + 1,
          affectedCells: (operation.rowIndex + 1) * headers.length,
          removedRows: operation.rowIndex + 1,
          changedValues: nextHeaders.length,
          destructive: true,
          beforeSample: headers.slice(0, 3),
          afterSample: nextHeaders.slice(0, 3),
        },
      };
    }
    case "remove-empty-rows": {
      const kept = rows.filter((row) => !headers.every((header) => isMissingValue(row[header] ?? "")));
      const removedRows = rows.length - kept.length;
      return {
        dataset: { headers, rows: kept },
        impact: {
          ...baseImpact,
          affectedRows: removedRows,
          removedRows,
          destructive: removedRows > 0,
        },
      };
    }
    case "remove-sparse-rows": {
      const kept = rows.filter((row) => {
        const missingCount = headers.reduce(
          (count, header) => count + (isMissingValue(row[header] ?? "") ? 1 : 0),
          0,
        );
        return headers.length === 0 ? false : missingCount / headers.length <= 0.8;
      });
      const removedRows = rows.length - kept.length;
      return {
        dataset: { headers, rows: kept },
        impact: {
          ...baseImpact,
          affectedRows: removedRows,
          removedRows,
          destructive: removedRows > 0,
        },
      };
    }
    case "remove-sparse-column":
    case "remove-column": {
      if (!operation.columnKey) return { dataset, impact: baseImpact };
      const nextHeaders = headers.filter((header) => header !== operation.columnKey);
      const nextRows = rows.map((row) =>
        Object.fromEntries(nextHeaders.map((header) => [header, row[header] ?? ""])),
      );
      return {
        dataset: { headers: nextHeaders, rows: nextRows },
        impact: {
          ...baseImpact,
          affectedRows: rows.length,
          affectedCells: rows.length,
          removedColumns: headers.includes(operation.columnKey) ? 1 : 0,
          destructive: headers.includes(operation.columnKey),
        },
      };
    }
    case "nullify-incompatible": {
      if (!operation.columnKey) return { dataset, impact: baseImpact };
      const column = analysis.columns.find((entry) => entry.key === operation.columnKey);
      if (!column) return { dataset, impact: baseImpact };
      let changedValues = 0;
      const beforeSample: string[] = [];
      const afterSample: string[] = [];
      const nextRows = rows.map((row) => {
        const value = row[operation.columnKey!] ?? "";
        if (!isCompatibleWithType(value, column.type, customTypes, column.choiceOptions)) {
          changedValues += 1;
          if (beforeSample.length < 3) {
            beforeSample.push(value);
            afterSample.push("");
          }
          return { ...row, [operation.columnKey!]: "" };
        }
        return row;
      });
      return {
        dataset: { headers, rows: nextRows },
        impact: {
          ...baseImpact,
          affectedRows: changedValues,
          affectedCells: changedValues,
          changedValues,
          destructive: changedValues > 0,
          beforeSample,
          afterSample,
        },
      };
    }
    case "round-incompatible-integers":
    case "truncate-incompatible-integers": {
      if (!operation.columnKey) return { dataset, impact: baseImpact };
      const column = analysis.columns.find((entry) => entry.key === operation.columnKey);
      if (!column || column.type !== "integer") return { dataset, impact: baseImpact };
      let changedValues = 0;
      const beforeSample: string[] = [];
      const afterSample: string[] = [];
      const nextRows = rows.map((row) => {
        const value = row[operation.columnKey!] ?? "";
        const numeric = parseNumeric(value);
        if (numeric == null || Number.isInteger(numeric)) {
          return row;
        }
        const nextValue =
          operation.kind === "round-incompatible-integers" ? String(Math.round(numeric)) : String(Math.trunc(numeric));
        changedValues += 1;
        if (beforeSample.length < 3) {
          beforeSample.push(value);
          afterSample.push(nextValue);
        }
        return { ...row, [operation.columnKey!]: nextValue };
      });
      return {
        dataset: { headers, rows: nextRows },
        impact: {
          ...baseImpact,
          affectedRows: changedValues,
          affectedCells: changedValues,
          changedValues,
          destructive: false,
          beforeSample,
          afterSample,
        },
      };
    }
    case "filter-incompatible-rows": {
      if (!operation.columnKey) return { dataset, impact: baseImpact };
      const column = analysis.columns.find((entry) => entry.key === operation.columnKey);
      if (!column) return { dataset, impact: baseImpact };
      const kept = rows.filter((row) =>
        isCompatibleWithType(row[operation.columnKey!] ?? "", column.type, customTypes, column.choiceOptions),
      );
      const removedRows = rows.length - kept.length;
      return {
        dataset: { headers, rows: kept },
        impact: {
          ...baseImpact,
          affectedRows: removedRows,
          removedRows,
          destructive: removedRows > 0,
        },
      };
    }
    case "nullify-outliers": {
      if (!operation.columnKey) return { dataset, impact: baseImpact };
      const column = analysis.columns.find((entry) => entry.key === operation.columnKey);
      if (!column?.numericStats) return { dataset, impact: baseImpact };
      const { lowerBound, upperBound } = column.numericStats;
      let changedValues = 0;
      const beforeSample: string[] = [];
      const afterSample: string[] = [];
      const nextRows = rows.map((row) => {
        const numeric = parseNumeric(row[operation.columnKey!] ?? "");
        if (numeric == null || (numeric >= lowerBound && numeric <= upperBound)) {
          return row;
        }
        changedValues += 1;
        if (beforeSample.length < 3) {
          beforeSample.push(row[operation.columnKey!] ?? "");
          afterSample.push("");
        }
        return { ...row, [operation.columnKey!]: "" };
      });
      return {
        dataset: { headers, rows: nextRows },
        impact: {
          ...baseImpact,
          affectedRows: changedValues,
          affectedCells: changedValues,
          changedValues,
          destructive: changedValues > 0,
          beforeSample,
          afterSample,
        },
      };
    }
    case "normalize-boolean-values": {
      if (!operation.columnKey) return { dataset, impact: baseImpact };
      let changedValues = 0;
      const beforeSample: string[] = [];
      const afterSample: string[] = [];
      const nextRows = rows.map((row) => {
        const currentValue = row[operation.columnKey!] ?? "";
        const normalizedBoolean = normalizeBooleanValue(currentValue);
        const formattedBoolean = formatBooleanValue(currentValue, booleanDisplayFormat);
        if (normalizedBoolean == null || currentValue.trim().toLowerCase() === formattedBoolean.toLowerCase()) {
          return row;
        }
        changedValues += 1;
        if (beforeSample.length < 3) {
          beforeSample.push(currentValue);
          afterSample.push(formattedBoolean);
        }
        return { ...row, [operation.columnKey!]: formattedBoolean };
      });
      return {
        dataset: { headers, rows: nextRows },
        impact: {
          ...baseImpact,
          affectedRows: changedValues,
          affectedCells: changedValues,
          changedValues,
          destructive: false,
          beforeSample,
          afterSample,
        },
      };
    }
    case "normalize-date-values": {
      if (!operation.columnKey) return { dataset, impact: baseImpact };
      let changedValues = 0;
      const beforeSample: string[] = [];
      const afterSample: string[] = [];
      const nextRows = rows.map((row) => {
        const currentValue = row[operation.columnKey!] ?? "";
        const normalizedDate = normalizeDateValue(currentValue);
        if (normalizedDate == null || currentValue.trim() === normalizedDate.canonical) {
          return row;
        }
        changedValues += 1;
        if (beforeSample.length < 3) {
          beforeSample.push(currentValue);
          afterSample.push(normalizedDate.canonical);
        }
        return { ...row, [operation.columnKey!]: normalizedDate.canonical };
      });
      return {
        dataset: { headers, rows: nextRows },
        impact: {
          ...baseImpact,
          affectedRows: changedValues,
          affectedCells: changedValues,
          changedValues,
          destructive: false,
          beforeSample,
          afterSample,
        },
      };
    }
    case "dedupe-primary-key": {
      const key = operation.primaryKey;
      if (!key || !headers.includes(key)) return { dataset, impact: baseImpact };
      const duplicates = new Map<string, number[]>();
      rows.forEach((row, index) => {
        const value = row[key] ?? "";
        if (isMissingValue(value)) return;
        duplicates.set(value, [...(duplicates.get(value) ?? []), index]);
      });
      const removalIndices = new Set<number>();
      duplicates.forEach((indices) => {
        if (indices.length <= 1) return;
        if (operation.mode === "keep-last") {
          indices.slice(0, -1).forEach((index) => removalIndices.add(index));
          return;
        }
        if (operation.mode === "drop-all") {
          indices.forEach((index) => removalIndices.add(index));
          return;
        }
        indices.slice(1).forEach((index) => removalIndices.add(index));
      });
      const kept = rows.filter((_, index) => !removalIndices.has(index));
      return {
        dataset: { headers, rows: kept },
        impact: {
          ...baseImpact,
          affectedRows: removalIndices.size,
          removedRows: removalIndices.size,
          destructive: removalIndices.size > 0,
        },
      };
    }
    default:
      return { dataset, impact: baseImpact };
  }
}

function deriveDataset(
  baseDataset: Dataset,
  operations: CleaningOperation[],
  selectedPrimaryKey: string | null,
  columnNameOverrides: ColumnNameOverrides,
  typeOverrides: Partial<Record<string, ColumnType>>,
  customTypes: CustomColumnTypeDefinition[],
  spreadTracking: Partial<Record<string, boolean>>,
  spreadBounds: Partial<Record<string, NumericBoundsOverride>>,
  nullTracking: Partial<Record<string, boolean>>,
  positiveTracking: Partial<Record<string, boolean>>,
  dateFormat: DateFormat,
  decimalSeparator: DecimalSeparator,
  booleanDisplayFormat: BooleanDisplayFormat,
  previewPage: number,
): DerivedWorkspace {
  let currentDataset = baseDataset;
  let currentAnalysis = analyzeDataset(
    currentDataset,
    selectedPrimaryKey,
    columnNameOverrides,
    typeOverrides,
    customTypes,
    spreadTracking,
    spreadBounds,
    nullTracking,
    positiveTracking,
    dateFormat,
    decimalSeparator,
    booleanDisplayFormat,
    previewPage,
  );

  operations.forEach((operation) => {
    currentDataset = executeOperation(
      currentDataset,
      currentAnalysis,
      operation,
      customTypes,
      booleanDisplayFormat,
    ).dataset;
    currentAnalysis = analyzeDataset(
      currentDataset,
      selectedPrimaryKey,
      columnNameOverrides,
      typeOverrides,
      customTypes,
      spreadTracking,
      spreadBounds,
      nullTracking,
      positiveTracking,
      dateFormat,
      decimalSeparator,
      booleanDisplayFormat,
      previewPage,
    );
  });

  return {
    dataset: currentDataset,
    analysis: currentAnalysis,
  };
}

function datasetToCsv(dataset: Dataset, separator: string) {
  const encodeCell = (value: string) => {
    if (value.includes('"')) {
      value = value.replace(/"/g, '""');
    }
    if (value.includes(separator) || value.includes("\n") || value.includes("\r") || value.includes('"')) {
      return `"${value}"`;
    }
    return value;
  };

  return [
    dataset.headers.map(encodeCell).join(separator),
    ...dataset.rows.map((row) => dataset.headers.map((header) => encodeCell(row[header] ?? "")).join(separator)),
  ].join("\r\n");
}

function getColumnDisplayName(header: string, columnNameOverrides: ColumnNameOverrides) {
  return columnNameOverrides[header]?.trim() || header;
}

function datasetToCsvWithColumnNames(dataset: Dataset, separator: string, columnNameOverrides: ColumnNameOverrides) {
  const encodeCell = (value: string) => {
    if (value.includes('"')) {
      value = value.replace(/"/g, '""');
    }
    if (value.includes(separator) || value.includes("\n") || value.includes("\r") || value.includes('"')) {
      return `"${value}"`;
    }
    return value;
  };

  return [
    dataset.headers.map((header) => encodeCell(getColumnDisplayName(header, columnNameOverrides))).join(separator),
    ...dataset.rows.map((row) => dataset.headers.map((header) => encodeCell(row[header] ?? "")).join(separator)),
  ].join("\r\n");
}

function buildAnomalyReportDataset(
  headers: string[],
  analysis: AnalysisSummary,
  customTypes: CustomColumnTypeDefinition[],
  removedEmptyColumns: ColumnAnalysis[] = [],
): Dataset {
  const columnsByKey = new Map(
    [...analysis.columns, ...removedEmptyColumns].map((column) => [column.key, column]),
  );

  const indicatorRows: Array<{ indicator: string; valueFor: (header: string) => string }> = [
    {
      indicator: "nombre_null",
      valueFor: (header) => String(columnsByKey.get(header)?.missingCount ?? 0),
    },
    {
      indicator: "quasi_vide",
      valueFor: (header) => ((columnsByKey.get(header)?.isSparse ?? false) ? "oui" : "non"),
    },
    {
      indicator: "vide",
      valueFor: (header) => ((columnsByKey.get(header)?.isEmpty ?? false) ? "oui" : "non"),
    },
    {
      indicator: "type_releve",
      valueFor: (header) => formatType(columnsByKey.get(header)?.type ?? "text", customTypes),
    },
    {
      indicator: "taux_unicite",
      valueFor: (header) => formatRate(columnsByKey.get(header)?.uniquenessRate ?? 0),
    },
    {
      indicator: "nombre_erreurs_type",
      valueFor: (header) => String(columnsByKey.get(header)?.incompatibleCount ?? 0),
    },
    {
      indicator: "bornes_identifiees",
      valueFor: (header) => {
        const stats = columnsByKey.get(header)?.numericStats;
        return stats ? `[${stats.lowerBound.toFixed(2)} ; ${stats.upperBound.toFixed(2)}]` : "";
      },
    },
    {
      indicator: "nombre_valeurs_hors_bornes",
      valueFor: (header) => String(columnsByKey.get(header)?.numericStats?.outlierCount ?? 0),
    },
  ];

  return {
    headers: ["indicateur", ...headers],
    rows: indicatorRows.map((row) =>
      Object.fromEntries([
        ["indicateur", row.indicator],
        ...headers.map((header) => [header, row.valueFor(header)]),
      ]),
    ),
  };
}

function removeEmptyColumnsFromDataset(dataset: Dataset, analysis: AnalysisSummary) {
  const removableHeaders = analysis.columns.filter((column) => column.isEmpty).map((column) => column.key);
  if (removableHeaders.length === 0) {
    return dataset;
  }

  const removableSet = new Set(removableHeaders);
  const headers = dataset.headers.filter((header) => !removableSet.has(header));
  const rows = dataset.rows.map((row) => Object.fromEntries(headers.map((header) => [header, row[header] ?? ""])));

  return { headers, rows };
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<WorkspaceState["status"]>("idle");
  const [busyTaskCount, setBusyTaskCount] = useState(0);
  const [message, setMessage] = useState("Importez un CSV pour lancer l'analyse locale.");
  const [progress, setProgress] = useState(0);
  const [source, setSource] = useState<ImportSummary | null>(null);
  const [committedDataset, setCommittedDataset] = useState<Dataset | null>(null);
  const [undoableOperations, setUndoableOperations] = useState<CleaningOperation[]>([]);
  const [selectedPrimaryKey, setSelectedPrimaryKey] = useState<string | null>(null);
  const [columnNameOverrides, setColumnNameOverrides] = useState<ColumnNameOverrides>({});
  const [columnTypeOverrides, setColumnTypeOverrides] = useState<Partial<Record<string, ColumnType>>>({});
  const [columnSpreadTracking, setColumnSpreadTrackingState] = useState<Partial<Record<string, boolean>>>({});
  const [columnSpreadBounds, setColumnSpreadBoundsState] = useState<Partial<Record<string, NumericBoundsOverride>>>({});
  const [columnNullTracking, setColumnNullTrackingState] = useState<Partial<Record<string, boolean>>>({});
  const [columnPositiveTracking, setColumnPositiveTrackingState] = useState<Partial<Record<string, boolean>>>({});
  const [dateFormat, setDateFormat] = useState<DateFormat>("yyyy-mm-dd");
  const [decimalSeparator, setDecimalSeparator] = useState<DecimalSeparator>("both");
  const [booleanDisplayFormat, setBooleanDisplayFormatState] = useState<BooleanDisplayFormat>(() =>
    readStoredBooleanDisplayFormatPreference("true-false"),
  );
  const [removeEmptyColumnsOnImport, setRemoveEmptyColumnsOnImportState] = useState<boolean>(() =>
    readStoredBooleanPreference(REMOVE_EMPTY_COLUMNS_PREF_KEY, true),
  );
  const [previewPage, setPreviewPageState] = useState(0);
  const [customTypes, setCustomTypes] = useState<CustomColumnTypeDefinition[]>([]);
  const [removedEmptyColumns, setRemovedEmptyColumns] = useState<ColumnAnalysis[]>([]);
  const [pendingSheetNames, setPendingSheetNames] = useState<string[]>([]);
  const lastDerivedRef = useRef<DerivedWorkspace | null>(null);
  const pendingImportSheetsRef = useRef<Array<{ sheet: string; data: unknown[][] }> | null>(null);
  const pendingImportMetaRef = useRef<{ fileName: string; fileSize: number } | null>(null);

  useEffect(() => {
    persistBooleanPreference(REMOVE_EMPTY_COLUMNS_PREF_KEY, removeEmptyColumnsOnImport);
  }, [removeEmptyColumnsOnImport]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(BOOLEAN_DISPLAY_FORMAT_PREF_KEY, booleanDisplayFormat);
    } catch {
      // Ignore storage failures and keep the in-memory preference.
    }
  }, [booleanDisplayFormat]);

  const derived = useMemo(() => {
    if (!committedDataset) return null;
    const result = deriveDataset(
      committedDataset,
        undoableOperations,
        selectedPrimaryKey,
        columnNameOverrides,
        columnTypeOverrides,
        customTypes,
        columnSpreadTracking,
        columnSpreadBounds,
        columnNullTracking,
        columnPositiveTracking,
        dateFormat,
        decimalSeparator,
        booleanDisplayFormat,
        previewPage,
      );
  lastDerivedRef.current = result;
  return result;
  }, [committedDataset, undoableOperations, selectedPrimaryKey, columnNameOverrides, columnTypeOverrides, customTypes, columnSpreadTracking, columnSpreadBounds, columnNullTracking, columnPositiveTracking, dateFormat, decimalSeparator, booleanDisplayFormat, previewPage]);

  useEffect(() => {
    if (!derived) return;
    const maxPage = Math.max(0, Math.ceil(derived.analysis.rowCount / PREVIEW_LIMIT) - 1);
    if (previewPage > maxPage) {
      setPreviewPageState(maxPage);
    }
  }, [derived, previewPage]);

  const resetWorkspace = useCallback(() => {
    setStatus("idle");
    setMessage(translateGlobal("workspace.engine.status.idle"));
    setProgress(0);
    setSource(null);
    setCommittedDataset(null);
    setUndoableOperations([]);
    setSelectedPrimaryKey(null);
    setColumnNameOverrides({});
    setColumnTypeOverrides({});
    setColumnSpreadTrackingState({});
    setColumnSpreadBoundsState({});
    setColumnNullTrackingState({});
    setColumnPositiveTrackingState({});
    setDecimalSeparator("both");
    setBooleanDisplayFormatState("true-false");
    setPreviewPageState(0);
    setCustomTypes([]);
    setRemovedEmptyColumns([]);
    setPendingSheetNames([]);
    pendingImportSheetsRef.current = null;
    pendingImportMetaRef.current = null;
    lastDerivedRef.current = null;
  }, []);

  const hydrateDataset = useCallback(async (dataset: Dataset, meta: ImportSummary) => {
    setStatus("importing");
    setProgress(15);
    setMessage(
      meta.format === "csv"
        ? translateGlobal("workspace.engine.status.detecting")
        : translateGlobal("workspace.engine.status.preparingWorkbook"),
    );
    await Promise.resolve();
    setProgress(45);
    await Promise.resolve();

    setProgress(80);
    const initialAnalysis = analyzeDataset(
      dataset,
      null,
      {},
      {},
      customTypes,
      {},
      {},
      {},
      {},
      dateFormat,
      decimalSeparator,
      booleanDisplayFormat,
    );
    const removedColumnsOnImport = removeEmptyColumnsOnImport
      ? initialAnalysis.columns.filter((column) => column.isEmpty)
      : [];
    const nextDataset = removeEmptyColumnsOnImport ? removeEmptyColumnsFromDataset(dataset, initialAnalysis) : dataset;
    const analysis =
      nextDataset === dataset
        ? initialAnalysis
        : analyzeDataset(nextDataset, null, {}, {}, customTypes, {}, {}, {}, {}, dateFormat, decimalSeparator, booleanDisplayFormat);
    setCommittedDataset(nextDataset);
    setRemovedEmptyColumns(removedColumnsOnImport);
    setUndoableOperations([]);
    setSelectedPrimaryKey(analysis.selectedPrimaryKey);
    setColumnNameOverrides({});
    setColumnTypeOverrides({});
    setColumnSpreadTrackingState({});
    setColumnSpreadBoundsState({});
    setColumnNullTrackingState({});
    setColumnPositiveTrackingState({});
    setPreviewPageState(0);
    setPendingSheetNames([]);
    pendingImportSheetsRef.current = null;
    pendingImportMetaRef.current = null;
    setSource(meta);
    setStatus("ready");
    setProgress(100);
    setMessage(getImportCompletionMessage(meta.fileSize));
  }, [booleanDisplayFormat, customTypes, dateFormat, decimalSeparator, removeEmptyColumnsOnImport]);

  const hydrateFromText = useCallback(async (text: string, meta: Omit<ImportSummary, "separator" | "format">) => {
    const separator = detectSeparator(text);
    await hydrateDataset(toDataset(text, separator), {
      ...meta,
      separator,
      format: "csv",
    });
  }, [hydrateDataset]);

  const importFile = useCallback(
    async (file: File) => {
      try {
        if (!file) {
          throw new Error(translateGlobal("workspace.engine.errors.noSelectedFile"));
        }
        if (!/\.(csv|xlsx)$/i.test(file.name)) {
          throw new Error(translateGlobal("workspace.engine.errors.unsupportedFile"));
        }
        if (file.size === 0) {
          throw new Error("Le fichier est vide.");
        }
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(translateGlobal("workspace.engine.errors.maxSize"));
        }

        setStatus("importing");
        setProgress(5);
        setMessage(translateGlobal("workspace.engine.status.reading"));

        if (/\.csv$/i.test(file.name)) {
          const text = decodeUploadedCsv(await file.arrayBuffer());
          await hydrateFromText(text, {
            fileName: file.name,
            fileSize: file.size,
          });
          return;
        }

        if (/\.xlsx$/i.test(file.name)) {
          const excel = await import("read-excel-file/browser");
          const workbookSheets = (await excel.default(file))
            .filter((sheet) => sheet.sheet.trim().length > 0);
          const sheetNames = workbookSheets.map((sheet) => sheet.sheet);

          if (sheetNames.length === 0) {
            throw new Error(translateGlobal("workspace.engine.errors.emptyWorkbook"));
          }

          if (sheetNames.length > 1) {
            pendingImportSheetsRef.current = workbookSheets;
            pendingImportMetaRef.current = {
              fileName: file.name,
              fileSize: file.size,
            };
            setPendingSheetNames(sheetNames);
            setStatus("idle");
            setProgress(0);
            setMessage(translateGlobal("workspace.engine.status.sheetSelection"));
            return;
          }

          await hydrateDataset(
            worksheetRowsToDataset(workbookSheets[0]!.data),
            {
              fileName: file.name,
              fileSize: file.size,
              separator: ",",
              format: "xlsx",
              sheetName: workbookSheets[0]!.sheet,
            },
          );
          return;
        }

        throw new Error(translateGlobal("workspace.engine.errors.unsupportedFile"));
      } catch (error) {
        setPendingSheetNames([]);
        pendingImportSheetsRef.current = null;
        pendingImportMetaRef.current = null;
        setStatus("error");
        setProgress(0);
        setMessage(error instanceof Error ? error.message : translateGlobal("workspace.engine.errors.importFailed"));
      }
    },
    [hydrateDataset, hydrateFromText],
  );

  const selectImportSheet = useCallback(
    async (sheetName: string) => {
      const pendingSheets = pendingImportSheetsRef.current;
      const pendingMeta = pendingImportMetaRef.current;
      if (!pendingSheets || !pendingMeta) return;

      try {
        setStatus("importing");
        setProgress(5);
        setMessage(translateGlobal("workspace.engine.status.preparingWorkbook"));

        await hydrateDataset(
          selectWorkbookSheet(pendingSheets, sheetName),
          {
            fileName: pendingMeta.fileName,
            fileSize: pendingMeta.fileSize,
            separator: ",",
            format: "xlsx",
            sheetName,
          },
        );
      } catch (error) {
        setPendingSheetNames([]);
        pendingImportSheetsRef.current = null;
        pendingImportMetaRef.current = null;
        setStatus("error");
        setProgress(0);
        setMessage(error instanceof Error ? error.message : translateGlobal("workspace.engine.errors.importFailed"));
      }
    },
    [hydrateDataset],
  );

  const cancelImportSheetSelection = useCallback(() => {
    setPendingSheetNames([]);
    pendingImportSheetsRef.current = null;
    pendingImportMetaRef.current = null;
    setStatus("idle");
    setProgress(0);
    setMessage(translateGlobal("workspace.engine.status.idle"));
  }, []);

  const beginBusyTask = useCallback(() => {
    setBusyTaskCount((current) => current + 1);
  }, []);

  const endBusyTask = useCallback(() => {
    setBusyTaskCount((current) => Math.max(0, current - 1));
  }, []);

  const loadDemo = useCallback(async () => {
    try {
      const response = await fetch(withBase("super-cleaner-demo.csv"), { cache: "no-store" });
      if (!response.ok) {
        throw new Error(translateGlobal("workspace.engine.errors.demoFailed"));
      }
      const text = await response.text();
      await hydrateFromText(text, {
        fileName: "super-cleaner-demo.csv",
        fileSize: text.length,
      });
    } catch (error) {
      setStatus("error");
      setProgress(0);
      setMessage(error instanceof Error ? error.message : translateGlobal("workspace.engine.errors.demoFailed"));
    }
  }, [hydrateFromText]);

  const foldOldestOperation = useCallback(
    (baseDataset: Dataset, operations: CleaningOperation[], primaryKey: string | null) => {
      if (operations.length < UNDO_LIMIT) {
        return { baseDataset, operations };
      }
      const [oldest, ...rest] = operations;
      const baseAnalysis = analyzeDataset(
        baseDataset,
        primaryKey,
        columnNameOverrides,
        columnTypeOverrides,
        customTypes,
        columnSpreadTracking,
        columnSpreadBounds,
        columnNullTracking,
        columnPositiveTracking,
        dateFormat,
        decimalSeparator,
        booleanDisplayFormat,
        previewPage,
      );
      const nextBase = executeOperation(baseDataset, baseAnalysis, oldest, customTypes, booleanDisplayFormat).dataset;
      return { baseDataset: nextBase, operations: rest };
    },
    [columnNameOverrides, columnTypeOverrides, customTypes, columnSpreadTracking, columnSpreadBounds, columnNullTracking, columnPositiveTracking, dateFormat, decimalSeparator, previewPage],
  );

  const buildPreview = useCallback(
    (operation: CleaningOperation) => {
      if (!derived) return null;
      return executeOperation(derived.dataset, derived.analysis, operation, customTypes, booleanDisplayFormat).impact;
    },
    [derived],
  );

  const applyOperation = useCallback(
    (operation: CleaningOperation) => {
      if (!committedDataset || !derived) return;
      beginBusyTask();
      void (async () => {
        await waitForNextPaint();
        try {
          const folded = foldOldestOperation(committedDataset, undoableOperations, selectedPrimaryKey);
          setCommittedDataset(folded.baseDataset);
          setUndoableOperations([...folded.operations, operation]);
          setMessage(translateGlobal("workspace.engine.status.operationApplied", { label: operation.label }));
          setStatus("ready");
        } finally {
          endBusyTask();
        }
      })();
    },
    [beginBusyTask, committedDataset, derived, endBusyTask, foldOldestOperation, selectedPrimaryKey, undoableOperations],
  );

  const undoLast = useCallback(() => {
    setUndoableOperations((current) => current.slice(0, -1));
    setMessage(translateGlobal("workspace.engine.status.undoDone"));
  }, []);

  const exportCsv = useCallback(
    (fileName?: string) => {
      if (!derived || !source) return;
      const csv = datasetToCsvWithColumnNames(derived.dataset, source.separator, columnNameOverrides);
      const blob = new Blob([UTF8_BOM, csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName?.trim() || buildDerivedCsvName(source.fileName, ".clean.csv");
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage(translateGlobal("workspace.engine.status.csvExported"));
    },
    [columnNameOverrides, derived, source],
  );

  const exportXlsx = useCallback(
    async (fileName?: string) => {
      if (!derived || !source) return;
      beginBusyTask();
      try {
        const XLSX = await import("xlsx");
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(datasetToSheetRows(derived.dataset, columnNameOverrides));
        XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
        XLSX.writeFile(workbook, fileName?.trim() || buildDerivedCsvName(source.fileName, ".clean.xlsx"));
        setMessage(translateGlobal("workspace.engine.status.xlsxExported"));
      } finally {
        endBusyTask();
      }
    },
    [beginBusyTask, columnNameOverrides, derived, endBusyTask, source],
  );

  const exportAnomalyReport = useCallback(
    (fileName?: string) => {
      if (!derived || !source) return;
      const reportHeaders = [
        ...derived.dataset.headers,
        ...removedEmptyColumns
          .map((column) => column.key)
          .filter((key) => !derived.dataset.headers.includes(key)),
      ];
      const reportDataset = buildAnomalyReportDataset(
        reportHeaders,
        derived.analysis,
        customTypes,
        removedEmptyColumns,
      );
      const csv = datasetToCsvWithColumnNames(reportDataset, source.separator, columnNameOverrides);
      const blob = new Blob([UTF8_BOM, csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download =
        fileName?.trim() || buildDerivedCsvName(source.fileName, ".anomalies-report.csv");
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage(translateGlobal("workspace.engine.status.reportExported"));
    },
    [columnNameOverrides, customTypes, derived, removedEmptyColumns, source],
  );

  const setColumnName = useCallback(
    (key: string, name: string) => {
      if (!derived) return;

      const trimmedName = name.trim();
      if (!trimmedName) {
        setMessage(translateGlobal("workspace.engine.errors.columnRenameEmpty"));
        return;
      }

      const duplicate = derived.analysis.columns.some(
        (column) => column.key !== key && column.name.trim().toLowerCase() === trimmedName.toLowerCase(),
      );
      if (duplicate) {
        setMessage(translateGlobal("workspace.engine.errors.columnRenameDuplicate"));
        return;
      }

      setColumnNameOverrides((current) => {
        if (trimmedName === key) {
          const { [key]: _, ...rest } = current;
          return rest;
        }
        return { ...current, [key]: trimmedName };
      });
      setMessage(translateGlobal("workspace.engine.status.columnRenamed", { key: trimmedName }));
    },
    [derived],
  );

  const setColumnType = useCallback((key: string, type: ColumnType) => {
    setColumnTypeOverrides((current) => ({ ...current, [key]: type }));
    setMessage(translateGlobal("workspace.engine.status.typeUpdated", { key, type: formatType(type) }));
  }, []);

  const setColumnSpreadTracking = useCallback((key: string, enabled: boolean) => {
    setColumnSpreadTrackingState((current) => ({ ...current, [key]: enabled }));
    setMessage(translateGlobal(enabled ? "workspace.engine.status.spreadEnabled" : "workspace.engine.status.spreadDisabled", { key }));
  }, []);

  const setColumnSpreadBounds = useCallback((key: string, bounds: NumericBoundsOverride) => {
    setColumnSpreadBoundsState((current) => {
      const existing = current[key] ?? {};
      const nextLower = bounds.lowerBound === undefined ? existing.lowerBound ?? null : bounds.lowerBound;
      const nextUpper = bounds.upperBound === undefined ? existing.upperBound ?? null : bounds.upperBound;
      const hasLower = nextLower != null && Number.isFinite(nextLower);
      const hasUpper = nextUpper != null && Number.isFinite(nextUpper);

      if (!hasLower && !hasUpper) {
        const { [key]: _, ...rest } = current;
        return rest;
      }

      return {
        ...current,
        [key]: {
          lowerBound: hasLower ? nextLower : null,
          upperBound: hasUpper ? nextUpper : null,
        },
      };
    });
  }, []);

  const setColumnNullTracking = useCallback((key: string, enabled: boolean) => {
    setColumnNullTrackingState((current) => ({ ...current, [key]: enabled }));
    setMessage(translateGlobal(enabled ? "workspace.engine.status.nullEnabled" : "workspace.engine.status.nullDisabled", { key }));
  }, []);

  const setColumnPositiveTracking = useCallback((key: string, enabled: boolean) => {
    setColumnPositiveTrackingState((current) => ({ ...current, [key]: enabled }));
    setMessage(
      translateGlobal(
        enabled ? "workspace.engine.status.positiveOnlyEnabled" : "workspace.engine.status.positiveOnlyDisabled",
        { key },
      ),
    );
  }, []);

  const setRemoveEmptyColumnsOnImport = useCallback((enabled: boolean) => {
    setRemoveEmptyColumnsOnImportState(enabled);
    setMessage(
      translateGlobal(
        enabled
          ? "workspace.engine.status.removeEmptyColumnsEnabled"
          : "workspace.engine.status.removeEmptyColumnsDisabled",
      ),
    );
  }, []);

  const setBooleanDisplayFormat = useCallback((format: BooleanDisplayFormat) => {
    setBooleanDisplayFormatState(format);
    setMessage(translateGlobal("workspace.engine.status.booleanDisplayUpdated"));
  }, []);

  const resetPreferences = useCallback(() => {
    clearStoredPreference(REMOVE_EMPTY_COLUMNS_PREF_KEY);
    clearStoredPreference(BOOLEAN_DISPLAY_FORMAT_PREF_KEY);
    setDateFormat("yyyy-mm-dd");
    setDecimalSeparator("both");
    setBooleanDisplayFormatState("true-false");
    setRemoveEmptyColumnsOnImportState(true);
    setMessage(translateGlobal("settings.privacy.clearPreferences"));
  }, []);

  const setPreviewPage = useCallback((page: number) => {
    beginBusyTask();
    void (async () => {
      await waitForNextPaint();
      try {
        setPreviewPageState(Math.max(0, Math.floor(page)));
        await waitForNextPaint();
      } finally {
        endBusyTask();
      }
    })();
  }, [beginBusyTask, endBusyTask]);

  const createChoiceType = useCallback((name: string, options: string[]) => {
    const trimmedName = name.trim();
    const normalizedOptions = Array.from(
      new Map(
        options
          .map((option) => option.trim())
          .filter((option) => option.length > 0)
          .map((option) => [normalizeChoiceValue(option), option]),
      ).values(),
    );

    if (!trimmedName || normalizedOptions.length < 2) {
      setMessage(translateGlobal("workspace.engine.errors.choiceTypeInvalid"));
      return;
    }

    const baseSlug = slugifyChoiceTypeName(trimmedName) || "choix";
    setCustomTypes((current) => {
      let nextId = `choice:${baseSlug}` as ChoiceTypeId;
      let suffix = 2;
      while (current.some((entry) => entry.id === nextId)) {
        nextId = `choice:${baseSlug}-${suffix}` as ChoiceTypeId;
        suffix += 1;
      }
      return [...current, { kind: "choice", id: nextId, name: trimmedName, options: normalizedOptions }];
    });
    setMessage(translateGlobal("workspace.engine.status.choiceTypeCreated", { name: trimmedName }));
  }, []);

  const createStructuredStringType = useCallback(
    (name: string, segments: StructuredStringSegment[]) => {
      const trimmedName = name.trim();
      if (!trimmedName) {
        setMessage(translateGlobal("workspace.engine.errors.patternTypeName"));
        return;
      }

      const normalizedSegments = segments
        .map((segment) =>
          segment.mode === "literal"
            ? {
                mode: "literal" as const,
                literal: segment.literal ?? "",
                exactLength: null,
              }
            : {
                mode: "token" as const,
                tokenKind: segment.tokenKind ?? "text",
                exactLength:
                  segment.exactLength && Number.isFinite(segment.exactLength) && segment.exactLength > 0
                    ? Math.floor(segment.exactLength)
                    : null,
              },
        )
        .filter((segment) => (segment.mode === "literal" ? segment.literal.length > 0 : true));

      if (normalizedSegments.length === 0) {
        setMessage(translateGlobal("workspace.engine.errors.patternTypeSegment"));
        return;
      }

      const baseSlug = slugifyChoiceTypeName(trimmedName) || "format";
      const description = normalizedSegments.map((segment) => describeStructuredSegment(segment)).join(" puis ");

      setCustomTypes((current) => {
        let nextId = `pattern:${baseSlug}` as PatternTypeId;
        let suffix = 2;
        while (current.some((entry) => entry.id === nextId)) {
          nextId = `pattern:${baseSlug}-${suffix}` as PatternTypeId;
          suffix += 1;
        }
        return [...current, { kind: "pattern", id: nextId, name: trimmedName, segments: normalizedSegments, description }];
      });
      setMessage(translateGlobal("workspace.engine.status.patternTypeCreated", { name: trimmedName }));
    },
    [],
  );

  const value = useMemo<WorkspaceState>(
    () => ({
      status,
      isBusy: busyTaskCount > 0,
      message,
      progress,
      source,
      pendingSheetNames,
      analysis: derived?.analysis ?? null,
      previewDataset: derived?.dataset ?? null,
      dateFormat,
      decimalSeparator,
      booleanDisplayFormat,
      removeEmptyColumnsOnImport,
      previewPage,
      customTypes,
      canUndo: undoableOperations.length > 0,
      undoCount: undoableOperations.length,
      importFile,
      selectImportSheet,
      cancelImportSheetSelection,
      loadDemo,
      selectPrimaryKey: (key) => setSelectedPrimaryKey(key ?? NO_PRIMARY_KEY),
      setColumnName,
      setColumnType,
      setColumnSpreadTracking,
      setColumnSpreadBounds,
      setColumnNullTracking,
      setColumnPositiveTracking,
      setDateFormat,
      setDecimalSeparator,
      setBooleanDisplayFormat,
      setRemoveEmptyColumnsOnImport,
      resetPreferences,
      setPreviewPage,
      createChoiceType,
      createStructuredStringType,
      buildPreview,
      applyOperation,
      undoLast,
      clear: resetWorkspace,
      exportCsv,
      exportXlsx,
      exportAnomalyReport,
    }),
    [
      status,
      busyTaskCount,
      message,
      progress,
      source,
      pendingSheetNames,
      derived,
      dateFormat,
      decimalSeparator,
      booleanDisplayFormat,
      removeEmptyColumnsOnImport,
      previewPage,
      customTypes,
      undoableOperations.length,
      importFile,
      selectImportSheet,
      cancelImportSheetSelection,
      loadDemo,
      setColumnName,
      setColumnType,
      setColumnSpreadTracking,
      setColumnSpreadBounds,
      setColumnNullTracking,
      setColumnPositiveTracking,
      setDateFormat,
      setDecimalSeparator,
      setBooleanDisplayFormat,
      setRemoveEmptyColumnsOnImport,
      resetPreferences,
      setPreviewPage,
      createChoiceType,
      createStructuredStringType,
      buildPreview,
      applyOperation,
      undoLast,
      resetWorkspace,
      exportCsv,
      exportXlsx,
      exportAnomalyReport,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  }
  return context;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function describeIssueCount(analysis: AnalysisSummary) {
  return analysis.issues.length;
}

export function describeSeverityTone(severity: Severity) {
  if (severity === "error") return "error";
  if (severity === "warning") return "warning";
  return "info";
}

export function getSeparatorLabel(separator: string) {
  return humanSeparator(separator);
}
