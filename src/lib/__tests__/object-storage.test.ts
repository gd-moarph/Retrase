import { describe, expect, it } from "vitest";
import { assertBufferSha256, sourceObjectKey } from "../object-storage";
import { sha256Buffer } from "../crypto";

describe("source object storage", () => {
  it("builds deterministic, sanitized keys", () => {
    expect(sourceObjectKey("ANM_DISCONTINUITY", "abc", "21.07.2026 Notificări.pdf"))
      .toBe("sources/ANM_DISCONTINUITY/abc/21.07.2026-Notificari.pdf");
  });

  it("verifies binary SHA-256 values", () => {
    const body = Buffer.from("official document");
    expect(() => assertBufferSha256(body, sha256Buffer(body))).not.toThrow();
    expect(() => assertBufferSha256(body, "wrong")).toThrow("SHA-256 mismatch");
  });
});
