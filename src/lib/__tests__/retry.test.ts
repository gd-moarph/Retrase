import { afterEach, describe, expect, it, vi } from "vitest";
import { diagnoseAnsvsaPdfDownload, fetchAnsvsaPdfBuffer } from "../retry";

const PDF_BUFFER = Buffer.concat([
  Buffer.from("%PDF-1.7\n"),
  Buffer.alloc(128, 0x20),
]);

afterEach(() => {
  vi.restoreAllMocks();
});

describe("diagnoseAnsvsaPdfDownload", () => {
  it("reports blocked responses instead of throwing", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("<html>Service Temporarily Unavailable</html>", {
        status: 503,
        statusText: "Service Temporarily Unavailable",
        headers: { "content-type": "text/html" },
      })
    );

    const results = await diagnoseAnsvsaPdfDownload(
      "https://www.ansvsa.ro/wp-content/uploads/test.pdf",
      "https://www.ansvsa.ro/wp-content/uploads/test.pdf",
      { timeout: 1000 }
    );

    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toMatchObject({
      ok: false,
      status: 503,
      contentType: "text/html",
    });
  });
});

describe("fetchAnsvsaPdfBuffer", () => {
  it("uses Googlebot user-agent for ANSVSA PDF downloads", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(PDF_BUFFER, {
        status: 200,
        headers: { "content-type": "application/pdf" },
      })
    );

    const buffer = await fetchAnsvsaPdfBuffer(
      "https://www.ansvsa.ro/wp-content/uploads/test.pdf?utm_source=rss",
      "https://www.ansvsa.ro/wp-content/uploads/test.pdf",
      { maxRetries: 0 }
    );

    expect(buffer.subarray(0, 5).toString("utf8")).toBe("%PDF-");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({
      "User-Agent": expect.stringContaining("Googlebot"),
    });
  });

  it("falls back from RSS URL to canonical PDF URL when Wordfence returns HTML", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response("<html>WAF Forbidden</html>", {
          status: 200,
          headers: { "content-type": "text/html" },
        })
      )
      .mockResolvedValueOnce(
        new Response(PDF_BUFFER, {
          status: 200,
          headers: { "content-type": "application/pdf" },
        })
      );

    const buffer = await fetchAnsvsaPdfBuffer(
      "https://www.ansvsa.ro/wp-content/uploads/test.pdf?utm_source=rss",
      "https://www.ansvsa.ro/wp-content/uploads/test.pdf",
      { maxRetries: 0 }
    );

    expect(buffer.length).toBe(PDF_BUFFER.length);
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "https://www.ansvsa.ro/wp-content/uploads/test.pdf?utm_source=rss",
      "https://www.ansvsa.ro/wp-content/uploads/test.pdf",
    ]);
  });

  it("rejects non-PDF bodies even when the response status is successful", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(`<html>${"Service unavailable ".repeat(10)}</html>`, {
        status: 200,
        headers: { "content-type": "application/pdf" },
      })
    );

    await expect(
      fetchAnsvsaPdfBuffer(
        "https://www.ansvsa.ro/wp-content/uploads/test.pdf",
        "https://www.ansvsa.ro/wp-content/uploads/test.pdf",
        { maxRetries: 0 }
      )
    ).rejects.toThrow("Response is not a PDF");
  });
});
