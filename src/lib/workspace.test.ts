import { describe, expect, it } from "vitest";
import {
  analyzeDataset,
  datasetToSheetRows,
  executeOperation,
  formatBooleanValue,
  normalizeWorksheetRow,
  rowsToDataset,
  selectWorkbookSheet,
  worksheetRowsToDataset,
} from "./workspace";

describe("xlsx import helpers", () => {
  it("normalizes worksheet cells into strings", () => {
    expect(normalizeWorksheetRow([" id ", 42, true, null])).toEqual([" id ", "42", "true", ""]);
  });

  it("formats boolean values according to the selected display mode", () => {
    expect(formatBooleanValue("true", "1-0")).toBe("1");
    expect(formatBooleanValue("0", "yes-no")).toBe("no");
    expect(formatBooleanValue("oui", "true-false")).toBe("true");
    expect(formatBooleanValue("unexpected", "oui-non")).toBe("unexpected");
  });

  it("converts worksheet rows into the internal dataset shape", () => {
    const dataset = worksheetRowsToDataset([
      ["id", "name"],
      [1, "Alice"],
      [2, "Bob"],
    ]);

    expect(dataset).toEqual({
      headers: ["id", "name"],
      rows: [
        { id: "1", name: "Alice" },
        { id: "2", name: "Bob" },
      ],
    });
  });

  it("ignores blank worksheet rows around data", () => {
    const dataset = worksheetRowsToDataset([
      ["id", "name"],
      ["", ""],
      [1, "Alice"],
      ["   ", "   "],
      [2, "Bob"],
    ]);

    expect(dataset.rows).toEqual([
      { id: "1", name: "Alice" },
      { id: "2", name: "Bob" },
    ]);
  });

  it("throws when the selected sheet has no usable data", () => {
    expect(() => worksheetRowsToDataset([["", ""], [" ", " "]])).toThrow(
      "La feuille sélectionnée ne contient aucune donnée exploitable.",
    );
  });

  it("selects the requested workbook sheet", () => {
    const dataset = selectWorkbookSheet(
      [
        { sheet: "Summary", data: [["ignore"], ["x"]] },
        { sheet: "Clients", data: [["id", "name"], [1, "Alice"]] },
      ],
      "Clients",
    );

    expect(dataset).toEqual({
      headers: ["id", "name"],
      rows: [{ id: "1", name: "Alice" }],
    });
  });

  it("throws when the requested workbook sheet does not exist", () => {
    expect(() =>
      selectWorkbookSheet([{ sheet: "Summary", data: [["id"], [1]] }], "Missing"),
    ).toThrow("La feuille sélectionnée est introuvable dans ce classeur.");
  });

  it("keeps dataset validation rules from csv imports", () => {
    expect(() =>
      rowsToDataset([
        ["id", ""],
        ["1", "Alice"],
      ]),
    ).toThrow("Au moins un nom de colonne est vide.");
  });

  it("builds a single-sheet export matrix with renamed headers", () => {
    expect(
      datasetToSheetRows(
        {
          headers: ["id", "name"],
          rows: [{ id: "1", name: "Alice" }],
        },
        { name: "client_name" },
      ),
    ).toEqual([["id", "client_name"], ["1", "Alice"]]);
  });

  it("tracks boolean display mismatches without auto-rewriting values", () => {
    const dataset = {
      headers: ["active"],
      rows: [{ active: "1" }, { active: "0" }],
    };

    const analysisAsBinary = analyzeDataset(
      dataset,
      null,
      {},
      {},
      [],
      {},
      {},
      {},
      {},
      "yyyy-mm-dd",
      "both",
      "1-0",
    );
    expect(analysisAsBinary.columns[0]?.booleanDisplayMismatchCount).toBe(0);

    const normalized = executeOperation(
      dataset,
      analysisAsBinary,
      {
        id: "normalize-bool",
        kind: "normalize-boolean-values",
        label: "Normalize",
        columnKey: "active",
      },
      [],
      "1-0",
    );
    expect(normalized.dataset.rows).toEqual([{ active: "1" }, { active: "0" }]);
    expect(normalized.impact.changedValues).toBe(0);

    const analysisAsText = analyzeDataset(
      normalized.dataset,
      null,
      {},
      {},
      [],
      {},
      {},
      {},
      {},
      "yyyy-mm-dd",
      "both",
      "true-false",
    );
    expect(analysisAsText.columns[0]?.booleanDisplayMismatchCount).toBe(2);
    expect(analysisAsText.previewRows[0]?.active.flag?.warning).toBe(true);
    expect(normalized.dataset.rows).toEqual([{ active: "1" }, { active: "0" }]);
  });

  it("rewrites boolean values only when normalize is explicitly triggered", () => {
    const dataset = {
      headers: ["active"],
      rows: [{ active: "1" }, { active: "0" }, { active: "yes" }],
    };

    const analysis = analyzeDataset(
      dataset,
      null,
      {},
      {},
      [],
      {},
      {},
      {},
      {},
      "yyyy-mm-dd",
      "both",
      "yes-no",
    );
    expect(analysis.columns[0]?.booleanDisplayMismatchCount).toBe(2);

    const normalized = executeOperation(
      dataset,
      analysis,
      {
        id: "normalize-bool",
        kind: "normalize-boolean-values",
        label: "Normalize",
        columnKey: "active",
      },
      [],
      "yes-no",
    );

    expect(normalized.dataset.rows).toEqual([{ active: "yes" }, { active: "no" }, { active: "yes" }]);
    expect(normalized.impact.changedValues).toBe(2);

    const normalizedAnalysis = analyzeDataset(
      normalized.dataset,
      null,
      {},
      {},
      [],
      {},
      {},
      {},
      {},
      "yyyy-mm-dd",
      "both",
      "yes-no",
    );
    expect(normalizedAnalysis.columns[0]?.booleanDisplayMismatchCount).toBe(0);
  });

  it("rounds and truncates decimal values for integer columns", () => {
    const dataset = {
      headers: ["count"],
      rows: [{ count: "1.2" }, { count: "2.8" }, { count: "foo" }, { count: "3" }],
    };

    const analysis = analyzeDataset(
      dataset,
      null,
      {},
      { count: "integer" },
      [],
      {},
      {},
      {},
      {},
      "yyyy-mm-dd",
      "both",
      "true-false",
    );

    expect(analysis.columns[0]?.integerAutoCorrectableCount).toBe(2);

    const rounded = executeOperation(
      dataset,
      analysis,
      {
        id: "round-int",
        kind: "round-incompatible-integers",
        label: "Round",
        columnKey: "count",
      },
      [],
      "true-false",
    );
    expect(rounded.dataset.rows).toEqual([{ count: "1" }, { count: "3" }, { count: "foo" }, { count: "3" }]);

    const truncated = executeOperation(
      dataset,
      analysis,
      {
        id: "truncate-int",
        kind: "truncate-incompatible-integers",
        label: "Truncate",
        columnKey: "count",
      },
      [],
      "true-false",
    );
    expect(truncated.dataset.rows).toEqual([{ count: "1" }, { count: "2" }, { count: "foo" }, { count: "3" }]);
  });

  it("flags negative values when positive-only is enabled", () => {
    const dataset = {
      headers: ["amount"],
      rows: [{ amount: "-4" }, { amount: "2" }],
    };

    const analysis = analyzeDataset(
      dataset,
      null,
      {},
      {},
      [],
      {},
      {},
      {},
      { amount: true },
      "yyyy-mm-dd",
      "both",
      "true-false",
    );

    expect(analysis.columns[0]?.positiveOnly).toBe(true);
    expect(analysis.columns[0]?.negativeValueCount).toBe(1);
    expect(analysis.previewRows[0]?.amount.flag?.warning).toBe(true);
    expect(analysis.previewRows[0]?.amount.flag?.reasons).toContain("positive-only");
  });
});
