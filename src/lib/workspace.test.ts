import { describe, expect, it } from "vitest";
import {
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
});
