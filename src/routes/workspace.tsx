import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  Eye,
  FileSpreadsheet,
  Pencil,
  KeyRound,
  Minus,
  Plus,
  Play,
  RotateCcw,
  Save,
  Undo2,
} from "lucide-react";
import { FileDrop } from "@/components/sp/FileDrop";
import { SpButton } from "@/components/sp/Button";
import { StatusBadge } from "@/components/sp/StatusBadge";
import { CollapsiblePanel } from "@/components/sp/CollapsiblePanel";
import { InlineCellEditor } from "@/components/sp/InlineCellEditor";
import { Modal } from "@/components/sp/Modal";
import { TextField } from "@/components/sp/TextField";
import { Spreadsheet, type ColumnDef } from "@/components/sp/Spreadsheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { translateGlobal, useI18n } from "@/lib/i18n";
import {
  describeIssueCount,
  describeSeverityTone,
  formatBytes,
  getSeparatorLabel,
  useWorkspace,
  type DecimalSeparator,
  type CleaningOperation,
  type DateFormat,
  type IssueSummary,
  type StructuredStringSegment,
  type StructuredStringSegmentTokenKind,
} from "@/lib/workspace";

type IssuePreviewEntry = {
  sourceRowIndex: number;
  rowNumber: number;
  cells: Array<{ key: string; value: string; message?: string; highlighted?: boolean }>;
};

function getIssueReasonKeys(issueId: string) {
  if (issueId.startsWith("type-")) return ["type"];
  if (issueId.startsWith("outlier-")) return ["outlier"];
  if (issueId.startsWith("normalize-bool-") || issueId.startsWith("boolean-normalization-")) {
    return ["boolean-normalize"];
  }
  if (issueId.startsWith("normalize-date-")) return ["date-normalize", "type"];
  if (issueId.startsWith("sparse-column-")) return ["missing"];
  return [];
}

function buildIssuePreview(issue: IssueSummary, analysis: NonNullable<ReturnType<typeof useWorkspace>["analysis"]>) {
  if (!issue.columnKey) return [];

  const reasonKeys = new Set(getIssueReasonKeys(issue.id));
  if (reasonKeys.size === 0) return [];

  const orderedHeaders = [
    issue.columnKey,
    ...analysis.columns.map((column) => column.key).filter((key) => key !== issue.columnKey),
  ];

  return analysis.previewRows
    .map((row, rowIndex) => {
      const focusCell = row[issue.columnKey];
      const focusReasons = focusCell?.flag?.reasons ?? [];
      if (!focusReasons.some((reason) => reasonKeys.has(reason))) {
        return null;
      }

      return {
        sourceRowIndex: analysis.previewOffset + rowIndex,
        rowNumber: analysis.previewOffset + rowIndex + 1,
        cells: orderedHeaders.map((header) => ({
          key: header,
          value: row[header]?.value ?? "",
          message: header === issue.columnKey ? focusCell?.flag?.message : row[header]?.flag?.message,
          highlighted: header === issue.columnKey,
        })),
      } satisfies IssuePreviewEntry;
    })
    .filter((entry): entry is IssuePreviewEntry => entry != null);
}

export const Route = createFileRoute("/workspace")({
  head: () => ({
    meta: [
      { title: translateGlobal("workspace.meta.title") },
      {
        name: "description",
        content: translateGlobal("workspace.meta.description"),
      },
    ],
  }),
  component: WorkspacePage,
});

function WorkspacePage() {
  const workspace = useWorkspace();
  const { t } = useI18n();
  const [issuesOpen, setIssuesOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [exportName, setExportName] = useState("");
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; columnKey: string } | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<IssueSummary | null>(null);
  const [selectedAction, setSelectedAction] = useState<CleaningOperation | null>(null);
  const [expandedIssueIds, setExpandedIssueIds] = useState<string[]>([]);
  const [choiceTypeOpen, setChoiceTypeOpen] = useState(false);
  const [choiceBuilderOpen, setChoiceBuilderOpen] = useState(false);
  const [patternBuilderOpen, setPatternBuilderOpen] = useState(false);
  const [choiceSourceColumn, setChoiceSourceColumn] = useState("");
  const [choiceTypeName, setChoiceTypeName] = useState("");
  const [choiceTypeOptions, setChoiceTypeOptions] = useState(["", ""]);
  const [structuredSegments, setStructuredSegments] = useState<StructuredStringSegment[]>([
    { mode: "token", tokenKind: "text", exactLength: null },
    { mode: "literal", literal: "@", exactLength: null },
    { mode: "token", tokenKind: "text", exactLength: null },
    { mode: "literal", literal: ".", exactLength: null },
    { mode: "token", tokenKind: "text", exactLength: null },
  ]);

  const previewImpact = selectedAction ? workspace.buildPreview(selectedAction) : null;
  const severityLabel = (severity: IssueSummary["severity"]) => t(`common.severity.${severity}`);

  const openCellEditor = (rowIndex: number, columnKey: string) => {
    setEditingCell({ rowIndex, columnKey });
  };

  const applyCellEdit = (rowIndex: number, columnKey: string, value: string) => {
    workspace.applyOperation({
      id: `edit-cell-${rowIndex}-${columnKey}-${Date.now()}`,
      kind: "update-cell",
      label: t("workspace.table.editCellAction"),
      rowIndex,
      columnKey,
      value,
    });
    setEditingCell(null);
  };
  const dateFormatOptions: Array<{ value: DateFormat; label: string }> = [
    { value: "yyyy-mm-dd", label: "AAAA-MM-JJ" },
    { value: "dd/mm/yyyy", label: "JJ/MM/AAAA" },
    { value: "mm/dd/yyyy", label: "MM/JJ/AAAA" },
  ];
  const decimalSeparatorOptions: Array<{ value: DecimalSeparator; label: string }> = [
    { value: "dot", label: "." },
    { value: "comma", label: "," },
    { value: "both", label: t("workspace.toolbar.bothDecimals") },
  ];
  const sourceColumnValueCounts = useMemo(() => {
    if (!choiceSourceColumn || !workspace.previewDataset) return new Map<string, number>();

    const counts = new Map<string, number>();
    workspace.previewDataset.rows.forEach((row) => {
      const rawValue = row[choiceSourceColumn];
      const value = typeof rawValue === "string" ? rawValue.trim() : "";
      if (!value) return;
      counts.set(value, (counts.get(value) ?? 0) + 1);
    });

    return counts;
  }, [choiceSourceColumn, workspace.previewDataset]);

  const toggleIssuePreview = (issueId: string) => {
    setExpandedIssueIds((current) =>
      current.includes(issueId) ? current.filter((id) => id !== issueId) : [...current, issueId],
    );
  };

  const spreadsheetColumns = useMemo<ColumnDef[]>(() => {
    if (!workspace.analysis) return [];
    return workspace.analysis.columns.map((column) => {
      const hasNullIssue = column.trackNulls && column.missingCount > 0;
      const hasTypeIssue = column.incompatibleCount > 0;
      const hasOutlierIssue = (column.numericStats?.outlierCount ?? 0) > 0;

      return {
        key: column.key,
        name: column.name,
        type: column.type,
        inferredType: column.inferredType,
        isTypeOverridden: column.isTypeOverridden,
        trackSpread: column.trackSpread,
        trackNulls: column.trackNulls,
        incompatibleCount: column.incompatibleCount,
        nonCanonicalBooleanCount: column.nonCanonicalBooleanCount,
        nonCanonicalDateCount: column.nonCanonicalDateCount,
        autoCorrectableDateCount: column.autoCorrectableDateCount,
        nonPreferredDecimalCount: column.nonPreferredDecimalCount,
        lowerBound: column.numericStats?.lowerBound,
        upperBound: column.numericStats?.upperBound,
        choiceOptions: column.choiceOptions,
        isPrimaryKey: workspace.analysis?.selectedPrimaryKey === column.key,
        progress: Math.round((column.trackNulls ? column.completenessRate : 1) * 100),
        issues:
          Number(hasTypeIssue) +
          Number(hasNullIssue) +
          Number(hasOutlierIssue) +
          Number((column.nonPreferredDecimalCount ?? 0) > 0) +
          Number((column.nonCanonicalBooleanCount ?? 0) > 0) +
          Number((column.nonCanonicalDateCount ?? 0) > 0),
        missingCount: column.missingCount,
      };
    });
  }, [workspace.analysis]);

  const analysis = workspace.analysis;
  const title = workspace.source?.fileName ?? t("workspace.noFileLoaded");
  const previewStart = analysis ? analysis.previewOffset + 1 : 0;
  const previewEnd = analysis ? Math.min(analysis.previewOffset + analysis.previewRows.length, analysis.rowCount) : 0;
  const previewPageCount = analysis ? Math.max(1, Math.ceil(analysis.rowCount / analysis.previewLimit)) : 1;
  const currentPreviewPage = workspace.previewPage + 1;

  const updateChoiceTypeOption = (index: number, value: string) => {
    setChoiceTypeOptions((current) => current.map((option, optionIndex) => (optionIndex === index ? value : option)));
  };

  const addChoiceTypeOption = () => {
    setChoiceTypeOptions((current) => [...current, ""]);
  };

  const removeChoiceTypeOption = (index: number) => {
    setChoiceTypeOptions((current) =>
      current.length <= 2 ? current : current.filter((_, optionIndex) => optionIndex !== index),
    );
  };

  const updateStructuredSegment = (index: number, nextSegment: StructuredStringSegment) => {
    setStructuredSegments((current) =>
      current.map((segment, segmentIndex) => (segmentIndex === index ? nextSegment : segment)),
    );
  };

  const addStructuredSegment = () => {
    setStructuredSegments((current) => [...current, { mode: "token", tokenKind: "text", exactLength: null }]);
  };

  const removeStructuredSegment = (index: number) => {
    setStructuredSegments((current) => (current.length <= 1 ? current : current.filter((_, segmentIndex) => segmentIndex !== index)));
  };

  const structuredTokenOptions: Array<{ value: StructuredStringSegmentTokenKind; label: string }> = [
    { value: "text", label: t("workspace.customType.tokens.text") },
    { value: "letters", label: t("workspace.customType.tokens.letters") },
    { value: "uppercase", label: t("workspace.customType.tokens.uppercase") },
    { value: "lowercase", label: t("workspace.customType.tokens.lowercase") },
    { value: "digits", label: t("workspace.customType.tokens.digits") },
    { value: "alphanumeric", label: t("workspace.customType.tokens.alphanumeric") },
  ];

  const applyChoiceSourceColumn = (columnKey: string) => {
    setChoiceSourceColumn(columnKey);
    if (!columnKey || !workspace.previewDataset) return;

    const counts = new Map<string, number>();
    workspace.previewDataset.rows.forEach((row) => {
      const rawValue = row[columnKey];
      const value = typeof rawValue === "string" ? rawValue.trim() : "";
      if (!value) return;
      counts.set(value, (counts.get(value) ?? 0) + 1);
    });

    const orderedOptions = [...counts.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], "fr"))
      .map(([value]) => value);

    const nextOptions =
      orderedOptions.length >= 2 ? orderedOptions : [...orderedOptions, ...Array.from({ length: 2 - orderedOptions.length }, () => "")];

    setChoiceTypeName(columnKey);
    setChoiceTypeOptions(nextOptions);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative z-50 overflow-visible border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]/80 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-2 sm:px-5">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[var(--color-secondary)] text-[var(--color-brown-dark)] bevel">
                <FileSpreadsheet className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold text-[var(--color-brown-dark)]">{title}</div>
                <div className="flex min-w-0 items-center gap-2 text-[11px] text-[var(--color-brown)]">
                  {workspace.source ? (
                    <>
                      <span className="truncate tabular-nums">
                        {analysis?.rowCount ?? 0} {t("workspace.summary.rows").toLowerCase()} · {analysis?.columnCount ?? 0} {t("workspace.summary.columns").toLowerCase()}
                      </span>
                      <span className="hidden sm:inline">·</span>
                      <span className="hidden sm:inline">{formatBytes(workspace.source.fileSize)}</span>
                    </>
                  ) : (
                    <span>{t("workspace.csvOnlyLocal")}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {analysis && (
              <div className="hidden xl:flex items-center gap-2">
                <StatusBadge tone={describeIssueCount(analysis) > 0 ? "warning" : "success"}>
                  {describeIssueCount(analysis)} {t("workspace.issuesCount")}
                </StatusBadge>
                <StatusBadge tone="neutral">{analysis.totalMissingCells} {t("workspace.missingCells")}</StatusBadge>
              </div>
            )}
            <SpButton
              variant="ghost"
              size="sm"
              leadingIcon={<Undo2 className="h-4 w-4" />}
              disabled={!workspace.canUndo}
              onClick={workspace.undoLast}
            >
              {t("common.actions.undo")}
            </SpButton>
            <SpButton
              variant="secondary"
              size="sm"
              leadingIcon={<AlertTriangle className="h-4 w-4" />}
              disabled={!analysis}
              onClick={() => setIssuesOpen(true)}
            >
              {t("workspace.actions.issues")}
            </SpButton>
            <SpButton
              variant="primary"
              size="sm"
              leadingIcon={<Download className="h-4 w-4" />}
              disabled={!analysis}
              onClick={() => {
                setExportName(workspace.source?.fileName.replace(/\.csv$/i, ".clean.csv") ?? "super-cleaner.clean.csv");
                setDownloadOpen(true);
              }}
            >
              {t("workspace.actions.exportCsv")}
            </SpButton>
            <SpButton
              variant="secondary"
              size="sm"
              leadingIcon={<Download className="h-4 w-4" />}
              disabled={!analysis}
              onClick={() => workspace.exportAnomalyReport()}
            >
              {t("workspace.actions.exportReport")}
            </SpButton>
          </div>
        </div>

        <div className="relative overflow-visible flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] px-4 py-1.5 sm:px-5">
          <div className="flex items-center gap-1">
            <SpButton size="icon" variant="ghost" title={t("workspace.actions.resetImport")} onClick={workspace.clear}>
              <RotateCcw className="h-4 w-4" />
            </SpButton>
            <SpButton
              size="icon"
              variant="ghost"
              title={t("workspace.actions.openIssues")}
              disabled={!analysis}
              onClick={() => setIssuesOpen(true)}
            >
              <Eye className="h-4 w-4" />
            </SpButton>
          </div>

          <div className="hidden sm:flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1">
            <label htmlFor="date-format" className="text-[11px] text-[var(--color-brown)]">
              {t("workspace.toolbar.dateFormat")}
            </label>
            <select
              id="date-format"
              value={workspace.dateFormat}
              onChange={(event) => workspace.setDateFormat(event.target.value as DateFormat)}
              className="rounded border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] px-2 py-0.5 text-[11px] text-[var(--color-brown-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/25"
            >
              {dateFormatOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="hidden sm:flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1">
            <label htmlFor="decimal-separator" className="text-[11px] text-[var(--color-brown)]">
              {t("workspace.toolbar.decimals")}
            </label>
            <select
              id="decimal-separator"
              value={workspace.decimalSeparator}
              onChange={(event) => workspace.setDecimalSeparator(event.target.value as DecimalSeparator)}
              className="rounded border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] px-2 py-0.5 text-[11px] text-[var(--color-brown-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/25"
            >
              {decimalSeparatorOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="relative hidden overflow-visible lg:block">
            <SpButton
              size="sm"
              variant="secondary"
              trailingIcon={<ChevronDown className={choiceTypeOpen ? "h-3.5 w-3.5 rotate-180" : "h-3.5 w-3.5"} />}
              onClick={() => setChoiceTypeOpen((current) => !current)}
            >
              {t("workspace.toolbar.customType")}
            </SpButton>
            {choiceTypeOpen ? (
              <div className="absolute top-full left-0 z-[120] mt-2 w-[340px] rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] p-3 shadow-panel">
                <div className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-[var(--color-brown)]/70">
                  {t("workspace.toolbar.customType")}
                </div>
                <div className="mt-2 space-y-2">
                  <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]">
                    <button
                      type="button"
                      onClick={() => setChoiceBuilderOpen((current) => !current)}
                      className="flex w-full items-center justify-between px-2.5 py-2 text-left"
                    >
                      <span className="text-[11px] font-medium text-[var(--color-brown-dark)]">{t("workspace.customType.choiceTitle")}</span>
                      <ChevronDown className={choiceBuilderOpen ? "h-3.5 w-3.5 rotate-180" : "h-3.5 w-3.5"} />
                    </button>
                    {choiceBuilderOpen ? (
                      <div className="border-t border-[var(--color-border)] px-2.5 py-2">
                        <label className="block text-[11px] text-[var(--color-brown)]">{t("workspace.customType.typeName")}</label>
                        <input
                          value={choiceTypeName}
                          onChange={(event) => setChoiceTypeName(event.target.value)}
                          placeholder={t("workspace.customType.typeName")}
                          className="mt-1 h-8 w-full rounded border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] px-2 text-[12px] text-[var(--color-brown-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/25"
                        />
                        <label className="mt-2 block text-[11px] text-[var(--color-brown)]">{t("workspace.customType.analyzeColumn")}</label>
                        <select
                          value={choiceSourceColumn}
                          onChange={(event) => applyChoiceSourceColumn(event.target.value)}
                          className="mt-1 h-8 w-full rounded border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] px-2 text-[12px] text-[var(--color-brown-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/25"
                        >
                          <option value="">{t("workspace.summary.none")}</option>
                          {(workspace.previewDataset?.headers ?? []).map((header) => (
                            <option key={header} value={header}>
                              {header}
                            </option>
                          ))}
                        </select>
                        <div className="mt-2 text-[11px] text-[var(--color-brown)]">{t("workspace.customType.choices")}</div>
                        <div className="mt-1.5 space-y-1.5">
                          {choiceTypeOptions.map((option, index) => (
                            <div key={index} className="flex items-center gap-1.5">
                              <div className="relative flex-1">
                                <input
                                  value={option}
                                  onChange={(event) => updateChoiceTypeOption(index, event.target.value)}
                                  placeholder={`${t("workspace.customType.choice")} ${index + 1}`}
                                  className="h-8 w-full rounded border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] px-2 pr-10 text-[12px] text-[var(--color-brown-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/25"
                                />
                                {option.trim() ? (
                                  <span
                                    title={
                                      choiceSourceColumn
                                        ? t("workspace.customType.occurrenceHelp")
                                        : t("workspace.customType.occurrenceHelpEmpty")
                                    }
                                    className="pointer-events-auto absolute top-1 right-1 rounded bg-[color-mix(in_oklab,var(--color-secondary)_65%,white)] px-1 py-0.5 text-[10px] font-medium leading-none text-[var(--color-brown-dark)]"
                                  >
                                    {sourceColumnValueCounts.get(option.trim()) ?? 0}
                                  </span>
                                ) : null}
                              </div>
                              <SpButton
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={addChoiceTypeOption}
                                title={t("workspace.customType.addChoice")}
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </SpButton>
                              <SpButton
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => removeChoiceTypeOption(index)}
                                title={t("workspace.customType.removeChoice")}
                                disabled={choiceTypeOptions.length <= 2}
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </SpButton>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 flex justify-end">
                          <SpButton
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              workspace.createChoiceType(choiceTypeName, choiceTypeOptions);
                              setChoiceSourceColumn("");
                              setChoiceTypeName("");
                              setChoiceTypeOptions(["", ""]);
                              setChoiceTypeOpen(false);
                            }}
                          >
                            {t("workspace.customType.createType")}
                          </SpButton>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]">
                    <button
                      type="button"
                      onClick={() => setPatternBuilderOpen((current) => !current)}
                      className="flex w-full items-center justify-between px-2.5 py-2 text-left"
                    >
                      <span className="text-[11px] font-medium text-[var(--color-brown-dark)]">{t("workspace.customType.structuredTitle")}</span>
                      <ChevronDown className={patternBuilderOpen ? "h-3.5 w-3.5 rotate-180" : "h-3.5 w-3.5"} />
                    </button>
                    {patternBuilderOpen ? (
                      <div className="border-t border-[var(--color-border)] px-2.5 py-2">
                        <label className="block text-[11px] text-[var(--color-brown)]">{t("workspace.customType.typeName")}</label>
                        <input
                          value={choiceTypeName}
                          onChange={(event) => setChoiceTypeName(event.target.value)}
                          placeholder={t("workspace.customType.typeName")}
                          className="mt-1 h-8 w-full rounded border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] px-2 text-[12px] text-[var(--color-brown-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/25"
                        />
                        <div className="mt-2 text-[11px] text-[var(--color-brown)]">{t("workspace.customType.segments")}</div>
                        <div className="mt-1.5 space-y-1.5">
                          {structuredSegments.map((segment, index) => (
                            <div key={index} className="rounded border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-1.5">
                              <div className="flex items-center gap-1.5">
                                <select
                                  value={segment.mode}
                                  onChange={(event) =>
                                    updateStructuredSegment(
                                      index,
                                      event.target.value === "literal"
                                        ? { mode: "literal", literal: "", exactLength: null }
                                        : { mode: "token", tokenKind: "text", exactLength: null },
                                    )
                                  }
                                  className="h-7 w-[104px] rounded border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-1.5 text-[11px] text-[var(--color-brown-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/25"
                                >
                                  <option value="token">{t("workspace.customType.block")}</option>
                                  <option value="literal">{t("workspace.customType.character")}</option>
                                </select>

                                {segment.mode === "literal" ? (
                                  <input
                                    value={segment.literal ?? ""}
                                    onChange={(event) =>
                                      updateStructuredSegment(index, {
                                        mode: "literal",
                                        literal: event.target.value,
                                        exactLength: null,
                                      })
                                    }
                                    placeholder={t("workspace.customType.literalPlaceholder")}
                                    className="h-7 flex-1 rounded border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2 text-[11px] text-[var(--color-brown-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/25"
                                  />
                                ) : (
                                  <>
                                    <select
                                      value={segment.tokenKind ?? "text"}
                                      onChange={(event) =>
                                        updateStructuredSegment(index, {
                                          mode: "token",
                                          tokenKind: event.target.value as StructuredStringSegmentTokenKind,
                                          exactLength: segment.exactLength ?? null,
                                        })
                                      }
                                      className="h-7 flex-1 rounded border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-1.5 text-[11px] text-[var(--color-brown-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/25"
                                    >
                                      {structuredTokenOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                          {option.label}
                                        </option>
                                      ))}
                                    </select>
                                    <input
                                      type="number"
                                      min="1"
                                      value={segment.exactLength ?? ""}
                                      onChange={(event) =>
                                        updateStructuredSegment(index, {
                                          mode: "token",
                                          tokenKind: segment.tokenKind ?? "text",
                                          exactLength: event.target.value ? Number(event.target.value) : null,
                                        })
                                      }
                                      placeholder="n"
                                      title={t("workspace.customType.freeLength")}
                                      className="h-7 w-14 rounded border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-1.5 text-[11px] text-[var(--color-brown-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/25"
                                    />
                                  </>
                                )}

                                <SpButton
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={addStructuredSegment}
                                  title={t("workspace.customType.addSegment")}
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </SpButton>
                                <SpButton
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={() => removeStructuredSegment(index)}
                                  title={t("workspace.customType.removeSegment")}
                                  disabled={structuredSegments.length <= 1}
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </SpButton>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-2.5 py-2 text-[11px] leading-relaxed text-[var(--color-brown)]">
                          {t("workspace.customType.examples")}
                        </div>
                        <div className="mt-3 flex justify-end">
                          <SpButton
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              workspace.createStructuredStringType(choiceTypeName, structuredSegments);
                              setChoiceSourceColumn("");
                              setChoiceTypeName("");
                              setChoiceTypeOptions(["", ""]);
                              setStructuredSegments([
                                { mode: "token", tokenKind: "text", exactLength: null },
                                { mode: "literal", literal: "@", exactLength: null },
                                { mode: "token", tokenKind: "text", exactLength: null },
                                { mode: "literal", literal: ".", exactLength: null },
                                { mode: "token", tokenKind: "text", exactLength: null },
                              ]);
                              setChoiceTypeOpen(false);
                            }}
                          >
                            {t("workspace.customType.createType")}
                          </SpButton>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex-1" />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 sm:p-4">
        {!analysis ? (
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <FileDrop onFile={workspace.importFile} onDemo={workspace.loadDemo} disabled={workspace.status === "importing"} />
            <div className="rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] p-5 shadow-panel">
              <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-brown)]/70">{t("workspace.emptyState.eyebrow")}</div>
              <h2 className="mt-2 text-lg font-semibold text-[var(--color-brown-dark)]">{t("workspace.emptyState.title")}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-brown)]">
                {t("workspace.emptyState.description")}
              </p>
              <div className="mt-4 space-y-2">
                <StatusBadge tone="success">{t("workspace.emptyState.importBadge")}</StatusBadge>
                <StatusBadge tone="info">{t("workspace.emptyState.analysisBadge")}</StatusBadge>
                <StatusBadge tone="neutral">{t("workspace.emptyState.exportBadge")}</StatusBadge>
              </div>
              {workspace.status === "error" && (
                <div className="mt-4 rounded-md border border-[color-mix(in_oklab,var(--color-destructive)_35%,transparent)] bg-[color-mix(in_oklab,var(--color-destructive)_10%,var(--color-surface-raised))] p-3 text-sm text-[var(--color-destructive)]">
                  {workspace.message}
                </div>
              )}
            </div>
          </section>
        ) : (
          <>
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="flex min-h-0 flex-col gap-2">
                <div className="min-h-0 h-[clamp(280px,56vh,680px)]">
                  <Spreadsheet
                    columns={spreadsheetColumns}
                    rows={analysis.previewRows}
                    customTypes={workspace.customTypes}
                    onColumnTypeChange={workspace.setColumnType}
                    onColumnSpreadTrackingChange={workspace.setColumnSpreadTracking}
                    onColumnSpreadBoundsChange={workspace.setColumnSpreadBounds}
                    onColumnNullTrackingChange={workspace.setColumnNullTracking}
                    onNormalizeBooleanColumn={(key) =>
                      workspace.applyOperation({
                        id: `normalize-bool-${key}`,
                        kind: "normalize-boolean-values",
                        label: t("workspace.table.normalizeBooleanTitle"),
                        columnKey: key,
                      })
                    }
                    onNormalizeDateColumn={(key) =>
                      workspace.applyOperation({
                        id: `normalize-date-${key}`,
                        kind: "normalize-date-values",
                        label: t("workspace.table.normalizeDateTitle"),
                        columnKey: key,
                      })
                    }
                    onClearColumnErrors={(key) =>
                      workspace.applyOperation({
                        id: `nullify-errors-${key}`,
                        kind: "nullify-incompatible",
                        label: t("workspace.table.clearErrors"),
                        columnKey: key,
                      })
                    }
                    onRemoveColumn={(key) =>
                      workspace.applyOperation({
                        id: `remove-column-${key}`,
                        kind: "remove-column",
                        label: t("workspace.table.removeColumn"),
                        columnKey: key,
                      })
                    }
                    onRemoveRow={(rowIndex) =>
                      workspace.applyOperation({
                        id: `remove-row-${rowIndex}`,
                        kind: "remove-row",
                        label: t("workspace.table.removeRow"),
                        rowIndex,
                      })
                    }
                    onPromoteRowToHeader={(rowIndex) =>
                      workspace.applyOperation({
                        id: `promote-row-${rowIndex}`,
                        kind: "promote-row-to-header",
                        label: t("workspace.table.useAsHeaders"),
                        rowIndex,
                      })
                    }
                    editingCell={editingCell}
                    onStartEditCell={(rowIndex, columnKey) => openCellEditor(rowIndex, columnKey)}
                    onSubmitEditCell={applyCellEdit}
                    onCancelEditCell={() => setEditingCell(null)}
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-[12px] text-[var(--color-brown)]">
                  <span className="hidden sm:inline">
                    {t("workspace.table.previewRange", {
                      start: previewStart,
                      end: previewEnd,
                      total: analysis.rowCount,
                    })}
                  </span>
                  <div className="flex items-center gap-2">
                    <SpButton
                      size="icon"
                      variant="ghost"
                      title={t("workspace.table.previousHundred")}
                      aria-label={t("workspace.table.previousHundred")}
                      disabled={workspace.previewPage === 0}
                      onClick={() => workspace.setPreviewPage(workspace.previewPage - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </SpButton>
                    <span className="min-w-[150px] text-center leading-tight text-[11px] text-[var(--color-brown)]/80">
                      <span className="block font-medium text-[var(--color-brown)]">
                        {t("workspace.table.previewRange", {
                          start: previewStart,
                          end: previewEnd,
                          total: analysis.rowCount,
                        })}
                      </span>
                      <span className="block">
                        {t("workspace.table.previewPage", { current: currentPreviewPage, total: previewPageCount })}
                      </span>
                    </span>
                    <SpButton
                      size="icon"
                      variant="ghost"
                      title={t("workspace.table.nextHundred")}
                      aria-label={t("workspace.table.nextHundred")}
                      disabled={workspace.previewPage >= previewPageCount - 1}
                      onClick={() => workspace.setPreviewPage(workspace.previewPage + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </SpButton>
                  </div>
                </div>
              </div>
              <aside className="space-y-3">
                <section className="rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] p-4 shadow-panel">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold text-[var(--color-brown-dark)]">{t("workspace.summary.title")}</h2>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <Metric
                      label={t("workspace.summary.rows")}
                      value={String(analysis.rowCount)}
                      hint={t("workspace.summary.rowsHint")}
                    />
                    <Metric
                      label={t("workspace.summary.columns")}
                      value={String(analysis.columnCount)}
                      hint={t("workspace.summary.columnsHint")}
                    />
                    <Metric
                      label={t("workspace.summary.emptyRows")}
                      value={String(analysis.emptyRowCount)}
                      hint={t("workspace.summary.emptyRowsHint")}
                    />
                    <Metric
                      label={t("workspace.summary.sparseRows")}
                      value={String(analysis.sparseRowCount)}
                      hint={t("workspace.summary.sparseRowsHint")}
                    />
                    <Metric
                      label={t("workspace.summary.sparseColumns")}
                      value={String(analysis.sparseColumnCount)}
                      hint={t("workspace.summary.sparseColumnsHint")}
                    />
                    <Metric
                      label={t("workspace.summary.key")}
                      value={analysis.selectedPrimaryKey ?? t("workspace.summary.none")}
                      hint={t("workspace.summary.keyHint")}
                    />
                  </dl>
                </section>

                <section className="rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] p-4 shadow-panel">
                  <div className="text-sm font-semibold text-[var(--color-brown-dark)]">{t("workspace.summary.primaryKeyTitle")}</div>
                  <div className="mt-3 space-y-2">
                    {analysis.primaryKeyCandidates.length > 0 ? (
                      <>
                        <button
                          type="button"
                          onClick={() => workspace.selectPrimaryKey(null)}
                          className={`w-full rounded-md border px-3 py-2 text-left text-sm ${
                            analysis.selectedPrimaryKey === null
                              ? "border-[var(--color-accent)] bg-[color-mix(in_oklab,var(--color-accent)_10%,var(--color-surface-raised))]"
                              : "border-[var(--color-border)] bg-[var(--color-surface)]"
                          }`}
                        >
                          <div className="font-medium text-[var(--color-brown-dark)]">{t("workspace.summary.noPrimaryKeyOption")}</div>
                        </button>
                        {analysis.primaryKeyCandidates.map((candidate) => (
                          <button
                            key={candidate.key}
                            type="button"
                            onClick={() => workspace.selectPrimaryKey(candidate.key)}
                            className={`w-full rounded-md border px-3 py-2 text-left text-sm ${
                              analysis.selectedPrimaryKey === candidate.key
                                ? "border-[var(--color-accent)] bg-[color-mix(in_oklab,var(--color-accent)_10%,var(--color-surface-raised))]"
                                : "border-[var(--color-border)] bg-[var(--color-surface)]"
                            }`}
                          >
                            <div className="flex items-center gap-2 font-medium text-[var(--color-brown-dark)]">
                              <KeyRound className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                              <span>{candidate.key}</span>
                            </div>
                            <div className="mt-1 text-[12px] text-[var(--color-brown)]">
                              {t("workspace.summary.primaryKeyCandidate", {
                                uniqueness: Math.round(candidate.uniquenessRate * 100),
                                missing: candidate.missingCount,
                              })}
                            </div>
                          </button>
                        ))}
                      </>
                    ) : (
                      <p className="text-sm text-[var(--color-brown)]">{t("workspace.summary.noPrimaryKey")}</p>
                    )}
                  </div>
                </section>

                {analysis.duplicateSummary && (
                  <section className="rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] p-4 shadow-panel">
                    <div className="text-sm font-semibold text-[var(--color-brown-dark)]">{t("workspace.summary.duplicateTitle")}</div>
                    <p className="mt-2 text-sm text-[var(--color-brown)]">
                      {t("workspace.summary.duplicateDescription", {
                        count: analysis.duplicateSummary.affectedRowCount,
                        key: analysis.duplicateSummary.key,
                      })}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {analysis.duplicateSummary.samples.map((sample) => (
                        <StatusBadge key={sample} tone="warning">
                          {sample}
                        </StatusBadge>
                      ))}
                    </div>
                  </section>
                )}
              </aside>
            </div>

            <CollapsiblePanel
              title={t("workspace.summary.cleanupTitle")}
              subtitle={t("workspace.summary.cleanupSubtitle")}
              action={
                <SpButton size="sm" variant="accent" leadingIcon={<Play className="h-3.5 w-3.5" />} onClick={() => setIssuesOpen(true)}>
                  {t("workspace.actions.browseIssues")}
                </SpButton>
              }
            >
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {analysis.issues.slice(0, 6).map((issue) => (
                  <button
                    key={issue.id}
                    type="button"
                    onClick={() => {
                      setSelectedIssue(issue);
                      setIssuesOpen(true);
                    }}
                    className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-left hover:bg-[var(--color-surface-raised)]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-[var(--color-brown-dark)]">{issue.title}</div>
                      <StatusBadge tone={describeSeverityTone(issue.severity)}>{severityLabel(issue.severity)}</StatusBadge>
                    </div>
                    <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--color-brown)]">{issue.description}</p>
                  </button>
                ))}
              </div>
            </CollapsiblePanel>
          </>
        )}
      </div>

      <Modal
        open={issuesOpen}
        onClose={() => {
          setIssuesOpen(false);
          setSelectedIssue(null);
          setExpandedIssueIds([]);
        }}
        title={t("workspace.modals.issuesTitle")}
        description={t("workspace.modals.issuesDescription")}
        headerAction={
          <SpButton size="sm" variant="secondary" onClick={() => workspace.exportAnomalyReport()}>
            {t("workspace.actions.exportReport")}
          </SpButton>
        }
        size="xl"
      >
        <div className="space-y-4">
          {(selectedIssue ? [selectedIssue] : analysis?.issues ?? []).map((issue) => (
            (() => {
              const previewEntries = analysis ? buildIssuePreview(issue, analysis) : [];
              const previewOpenForIssue = expandedIssueIds.includes(issue.id);
              return (
                <section key={issue.id} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--color-brown-dark)]">{issue.title}</h3>
                      <p className="mt-1 text-[12.5px] text-[var(--color-brown)]">{issue.description}</p>
                    </div>
                    <StatusBadge tone={describeSeverityTone(issue.severity)}>{severityLabel(issue.severity)}</StatusBadge>
                  </div>
                  {previewEntries.length > 0 ? (
                    <div className="mt-4 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-raised)]">
                      <button
                        type="button"
                        onClick={() => toggleIssuePreview(issue.id)}
                        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left"
                      >
                        <span className="text-[12px] font-medium text-[var(--color-brown-dark)]">
                          {previewOpenForIssue
                            ? t("workspace.modals.hideFaultyRows")
                            : t("workspace.modals.showFaultyRows", { count: previewEntries.length })}
                        </span>
                        {previewOpenForIssue ? (
                          <ChevronUp className="h-4 w-4 text-[var(--color-brown)]" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-[var(--color-brown)]" />
                        )}
                      </button>
                      {previewOpenForIssue ? (
                        <div className="border-t border-[var(--color-border)] p-3">
                          <div className="overflow-x-auto">
                            <table className="min-w-full border-separate border-spacing-0 text-[12px]">
                              <thead>
                                <tr>
                                  <th className="sticky left-0 bg-[var(--color-surface-raised)] px-2 py-1.5 text-left font-medium text-[var(--color-brown)]">
                                    {t("workspace.modals.rowNumber")}
                                  </th>
                                  {previewEntries[0]?.cells.map((cell) => (
                                    <th
                                      key={cell.key}
                                      className={`px-2 py-1.5 text-left font-medium ${
                                        cell.highlighted
                                          ? "text-[var(--color-brown-dark)]"
                                          : "text-[var(--color-brown)]"
                                      }`}
                                    >
                                      {cell.key}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {previewEntries.map((entry) => (
                                  <tr key={`${issue.id}-${entry.rowNumber}`}>
                                    <td className="sticky left-0 border-t border-[var(--color-border)] bg-[var(--color-surface-raised)] px-2 py-1.5 align-top text-[var(--color-brown)]">
                                      {entry.rowNumber}
                                    </td>
                                    {entry.cells.map((cell) => (
                                      <td
                                        key={`${entry.rowNumber}-${cell.key}`}
                                        title={cell.message}
                                        className={`border-t border-[var(--color-border)] px-2 py-1.5 align-top ${
                                          cell.highlighted
                                            ? "bg-[color-mix(in_oklab,var(--color-warning)_10%,var(--color-surface-raised))] font-medium text-[var(--color-brown-dark)]"
                                            : "text-[var(--color-brown-dark)]"
                                        }`}
                                      >
                                        {editingCell?.rowIndex === entry.sourceRowIndex && editingCell.columnKey === cell.key ? (
                                          <InlineCellEditor
                                            type={
                                              analysis?.columns.find((column) => column.key === cell.key)?.type ?? "text"
                                            }
                                            choiceOptions={
                                              analysis?.columns.find((column) => column.key === cell.key)?.choiceOptions
                                            }
                                            customTypes={workspace.customTypes}
                                            initialValue={cell.value}
                                            className="min-w-[160px]"
                                            onCancel={() => setEditingCell(null)}
                                            onSubmit={(value) => applyCellEdit(entry.sourceRowIndex, cell.key, value)}
                                          />
                                        ) : (
                                          <div className="group relative min-w-[120px] pr-5 whitespace-pre-wrap break-words">
                                            {cell.value || "null"}
                                            <button
                                              type="button"
                                              onClick={() => openCellEditor(entry.sourceRowIndex, cell.key)}
                                              className="absolute right-0 bottom-0 flex h-4 w-4 items-center justify-center rounded text-[var(--color-brown)]/45 transition hover:bg-[var(--color-surface)] hover:text-[var(--color-brown-dark)] group-hover:text-[var(--color-brown)]"
                                              title={t("workspace.table.editCell")}
                                            >
                                              <Pencil className="h-2.5 w-2.5" />
                                            </button>
                                          </div>
                                        )}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <p className="mt-2 text-[11px] text-[var(--color-brown)]">
                            {t("workspace.modals.previewLimited", { count: analysis?.previewRows.length ?? 0 })}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {issue.actions.map((action) => (
                      <SpButton
                        key={action.id}
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setSelectedAction(action);
                          setPreviewOpen(true);
                        }}
                      >
                        {action.label}
                      </SpButton>
                    ))}
                  </div>
                </section>
              );
            })()
          ))}
        </div>
      </Modal>

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={selectedAction?.label ?? t("workspace.modals.previewTitle")}
        description={t("workspace.modals.previewDescription")}
        footer={
          <>
            <SpButton variant="ghost" onClick={() => setPreviewOpen(false)}>
              {t("common.actions.close")}
            </SpButton>
            <SpButton
              variant={previewImpact?.destructive ? "danger" : "primary"}
              onClick={() => {
                if (selectedAction) {
                  workspace.applyOperation(selectedAction);
                }
                setPreviewOpen(false);
                setIssuesOpen(false);
                setSelectedIssue(null);
              }}
            >
              {t("common.actions.apply")}
            </SpButton>
          </>
        }
      >
        {previewImpact ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricCard label={t("workspace.metrics.touchedRows")} value={String(previewImpact.affectedRows)} />
              <MetricCard label={t("workspace.metrics.touchedCells")} value={String(previewImpact.affectedCells)} />
              <MetricCard label={t("workspace.metrics.removedRows")} value={String(previewImpact.removedRows)} />
              <MetricCard label={t("workspace.metrics.removedColumns")} value={String(previewImpact.removedColumns)} />
            </div>
            {previewImpact.destructive && (
              <div className="rounded-md border border-[color-mix(in_oklab,var(--color-destructive)_35%,transparent)] bg-[color-mix(in_oklab,var(--color-destructive)_10%,var(--color-surface-raised))] p-3 text-sm text-[var(--color-destructive)]">
                {t("workspace.modals.destructiveNotice")}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-brown)]">{t("workspace.modals.noImpact")}</p>
        )}
      </Modal>

      <Modal
        open={downloadOpen}
        onClose={() => setDownloadOpen(false)}
        title={t("workspace.modals.exportTitle")}
        description={t("workspace.modals.exportDescription")}
        footer={
          <>
            <SpButton variant="ghost" onClick={() => setDownloadOpen(false)}>
              {t("common.actions.cancel")}
            </SpButton>
            <SpButton
              variant="success"
              leadingIcon={<Save className="h-4 w-4" />}
              onClick={() => {
                workspace.exportCsv(exportName);
                setDownloadOpen(false);
              }}
            >
              {t("common.actions.download")}
            </SpButton>
          </>
        }
      >
        <div className="space-y-4">
          <TextField
            label={t("workspace.modals.fileName")}
            value={exportName}
            onChange={(event) => setExportName(event.target.value)}
            hint={t("workspace.modals.fileNameHint")}
          />
          <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-brown)]">
            {t("workspace.modals.localNotice")}
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      {hint ? (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <dt className="cursor-help text-[11px] uppercase tracking-[0.14em] text-[var(--color-brown)]/70 decoration-dotted underline-offset-3">
                {label}
              </dt>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="max-w-64 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] px-2.5 py-2 text-[11px] leading-relaxed text-[var(--color-brown-dark)] shadow-panel"
            >
              {hint}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <dt className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-brown)]/70">{label}</dt>
      )}
      <dd className="mt-1 text-sm font-semibold text-[var(--color-brown-dark)]">{value}</dd>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-brown)]/70">{label}</div>
      <div className="mt-1 text-lg font-semibold text-[var(--color-brown-dark)]">{value}</div>
    </div>
  );
}
