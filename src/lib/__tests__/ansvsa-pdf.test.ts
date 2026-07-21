import { describe, expect, it } from "vitest";
import { isAllowedAnsvsaPdfUrl } from "../ansvsa-pdf";

describe("isAllowedAnsvsaPdfUrl", () => {
  it("accepts HTTPS PDFs hosted by ANSVSA", () => {
    expect(isAllowedAnsvsaPdfUrl("https://www.ansvsa.ro/uploads/retragere.pdf?source=rss")).toBe(true);
    expect(isAllowedAnsvsaPdfUrl("https://ansvsa.ro/retragere.PDF")).toBe(true);
  });

  it("rejects non-PDF, insecure, and unrelated URLs", () => {
    expect(isAllowedAnsvsaPdfUrl("https://www.ansvsa.ro/retragere.html")).toBe(false);
    expect(isAllowedAnsvsaPdfUrl("http://www.ansvsa.ro/retragere.pdf")).toBe(false);
    expect(isAllowedAnsvsaPdfUrl("https://ansvsa.ro.example.com/retragere.pdf")).toBe(false);
    expect(isAllowedAnsvsaPdfUrl("not-a-url")).toBe(false);
  });
});
