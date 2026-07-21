import { describe, expect, it } from "vitest";
import { parseDiscontinuityPageText } from "../anm-discontinuity";

describe("ANMDMR discontinuity page parser", () => {
  it("parses tabular rows and ignores repeated headers", () => {
    const rows = parseDiscontinuityPageText(`
Nr crt \tDenumire comerciala \tForma farmaceutica \tConcentratie
1 MEDICAMENT 10 mg \tCOMPR. \t10mg \tCOMPANIE S.A. \tROMANIA \tSUBSTANTIUM \t21.07.2026 Discontinuitate temporara \taug.-26 Motive de fabricatie
NOTIFICARI ALE DETINATORILOR DE AUTORIZATII
`, 3);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ rowNumber: 1, sourcePage: 3, commercialName: "MEDICAMENT 10 mg", holderCountry: "ROMANIA", dci: "SUBSTANTIUM", addressDate: "21.07.2026" });
  });

  it("joins a standalone row number with a multiline commercial name", () => {
    const rows = parseDiscontinuityPageText(`
227
AMOXICILINA/ACID CLAVULANIC 1000
mg/200 mg \tPULB. PT. SOL. INJ. \t1000mg/200mg \tAPTA MEDICA D.O.O. \tSLOVENIA \tAMOXICILLINUM + ACIDUM CLAVULANICUM \t12.03.2024 Discontinuitate temporara \tMotive de fabricatie
`, 6);
    expect(rows).toHaveLength(1);
    expect(rows[0].rowNumber).toBe(227);
    expect(rows[0].commercialName).toContain("AMOXICILINA/ACID CLAVULANIC");
  });

  it("does not treat a continuation year as a new product row", () => {
    const rows = parseDiscontinuityPageText(`
10 PRODUS \tCOMPR. \t10mg \tCOMPANIE \tROMANIA \tSUBSTANTIUM \t22.05.2017 Discontinuitate temporara din Mai
2018 \tMotive comerciale
11 PRODUS DOI \tCOMPR. \t20mg \tCOMPANIE \tROMANIA \tSUBSTANTIUM \t23.05.2017 Discontinuitate permanenta \tMotive comerciale
`, 1);
    expect(rows.map((row) => row.rowNumber)).toEqual([10, 11]);
  });
});
