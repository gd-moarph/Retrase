import { describe, it, expect } from "vitest";
import { normalizeText, normalizeForComparison, removeDiacritics, normalizeBrand } from "../normalize";

describe("normalizeText", () => {
  it("removes diacritics", () => {
    expect(normalizeText("șțâîă")).toBe("staia");
  });

  it("lowercases", () => {
    expect(normalizeText("Paracetamol")).toBe("paracetamol");
  });

  it("collapses whitespace", () => {
    expect(normalizeText("a   b")).toBe("a b");
  });

  it("removes punctuation", () => {
    expect(normalizeText("produsul, rechemat!")).toBe("produsul rechemat");
  });
});

describe("normalizeForComparison", () => {
  it("removes all non-alphanumeric except spaces", () => {
    expect(normalizeForComparison("Produs #1! (special)")).toBe("produs 1 special");
  });
});

describe("removeDiacritics", () => {
  it("removes Romanian diacritics", () => {
    expect(removeDiacritics("ăâîșțĂÂÎȘȚ")).toBe("aaistaaist");
  });
});

describe("normalizeBrand", () => {
  it("normalizes brand names", () => {
    expect(normalizeBrand("Mega Image")).toBe("mega_image");
    expect(normalizeBrand("Dr. Max")).toBe("dr_max");
  });
});
