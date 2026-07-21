import crypto from "node:crypto";

export function removeDiacritics(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function normalizeText(text: string): string {
  return removeDiacritics(text)
    .toLowerCase()
    .replace(/[“”„'’]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeForComparison(text: string): string {
  return removeDiacritics(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeBrand(text: string): string {
  return normalizeForComparison(text).replace(/[\s-]+/g, "_");
}

export function sha256(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex");
}
