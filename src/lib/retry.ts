const CHROME_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const GOOGLEBOT_USER_AGENT = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  timeout?: number;
  signal?: AbortSignal;
  userAgent?: string;
  headers?: Record<string, string>;
  validateResponse?: (response: Response) => void;
}

export interface FetchDiagnosticResult {
  profile: string;
  url: string;
  ok: boolean;
  status?: number;
  statusText?: string;
  contentType?: string | null;
  bytes?: number;
  firstBytes?: string;
  headers?: Record<string, string>;
  error?: string;
  durationMs: number;
}

const DEFAULT_OPTIONS = {
  maxRetries: 3,
  baseDelay: 5000,
  timeout: 30000,
  signal: undefined as AbortSignal | undefined,
  userAgent: CHROME_USER_AGENT,
};

const ANSVSA_DIAGNOSTIC_PROFILES: Array<{
  name: string;
  userAgent: string;
  headers: Record<string, string>;
}> = [
  {
    name: "googlebot-pdf",
    userAgent: GOOGLEBOT_USER_AGENT,
    headers: {
      Accept: "application/pdf,application/octet-stream;q=0.9,*/*;q=0.8",
    },
  },
  {
    name: "chrome-navigation",
    userAgent: CHROME_USER_AGENT,
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,application/pdf,*/*;q=0.8",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Upgrade-Insecure-Requests": "1",
    },
  },
  {
    name: "chrome-pdf",
    userAgent: CHROME_USER_AGENT,
    headers: {
      Accept: "application/pdf,*/*;q=0.8",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "cross-site",
      "Upgrade-Insecure-Requests": "1",
    },
  },
];

async function fetchWithAbort(url: string, options: RetryOptions = {}): Promise<Response> {
  const { timeout, signal, userAgent } = { ...DEFAULT_OPTIONS, ...options };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const onAbort = () => { clearTimeout(timer); controller.abort(signal?.reason); };
  if (signal) signal.addEventListener("abort", onAbort, { once: true });

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": userAgent,
        "Accept-Language": "ro-RO,ro;q=0.9,en;q=0.8",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        ...options.headers,
      },
    });
    return response;
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener("abort", onAbort);
  }
}

export async function fetchWithRetry(
  url: string,
  options: RetryOptions = {}
): Promise<Response> {
  const { maxRetries, baseDelay } = { ...DEFAULT_OPTIONS, ...options };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (options.signal?.aborted) throw new Error("Import anulat");

      const response = await fetchWithAbort(url, options);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      options.validateResponse?.(response);

      return response;
    } catch (error) {
      if (options.signal?.aborted) throw new Error("Import anulat");
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(3, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError ?? new Error(`Failed to fetch ${url}`);
}

export async function fetchWithNativeHttps(
  url: string,
  options: RetryOptions = {}
): Promise<Buffer> {
  return fetchBufferWithRetry(url, options);
}

export async function fetchBufferWithRetry(
  url: string,
  options: RetryOptions = {}
): Promise<Buffer> {
  const response = await fetchWithRetry(url, options);
  return readResponseBuffer(response, options.timeout ?? DEFAULT_OPTIONS.timeout);
}

export async function fetchAnsvsaPdfBuffer(
  fetchUrl: string,
  canonicalPdfUrl: string,
  options: RetryOptions = {}
): Promise<Buffer> {
  const urls = buildAnsvsaPdfCandidateUrls(fetchUrl, canonicalPdfUrl);
  const errors: string[] = [];

  for (const candidateUrl of urls) {
    try {
      const buffer = await fetchBufferWithRetry(candidateUrl, {
        ...options,
        userAgent: GOOGLEBOT_USER_AGENT,
        headers: {
          Accept: "application/pdf,application/octet-stream;q=0.9,*/*;q=0.8",
          ...options.headers,
        },
        validateResponse: (response) => {
          options.validateResponse?.(response);
          validatePdfResponse(response);
        },
      });
      validatePdfBuffer(buffer);
      return buffer;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${candidateUrl}: ${message}`);
    }
  }

  throw new Error(`ANSVSA PDF download failed. Attempts: ${errors.join(" | ")}`);
}

export async function diagnoseAnsvsaPdfDownload(
  fetchUrl: string,
  canonicalPdfUrl: string,
  options: RetryOptions = {}
): Promise<FetchDiagnosticResult[]> {
  const urls = buildAnsvsaPdfCandidateUrls(fetchUrl, canonicalPdfUrl);
  const results: FetchDiagnosticResult[] = [];

  for (const candidateUrl of urls) {
    for (const profile of ANSVSA_DIAGNOSTIC_PROFILES) {
      const started = Date.now();
      try {
        const response = await fetchWithAbort(candidateUrl, {
          ...options,
          maxRetries: 0,
          userAgent: profile.userAgent,
          headers: profile.headers,
        });
        const buffer = await readResponseBuffer(response, options.timeout ?? DEFAULT_OPTIONS.timeout);
        results.push({
          profile: profile.name,
          url: candidateUrl,
          ok: response.ok && isPdfBuffer(buffer),
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get("content-type"),
          bytes: buffer.length,
          firstBytes: buffer.subarray(0, 160).toString("utf8").replace(/\s+/g, " ").trim(),
          headers: pickDiagnosticHeaders(response.headers),
          durationMs: Date.now() - started,
        });
      } catch (error) {
        results.push({
          profile: profile.name,
          url: candidateUrl,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
          durationMs: Date.now() - started,
        });
      }
    }
  }

  return results;
}

function buildAnsvsaPdfCandidateUrls(fetchUrl: string, canonicalPdfUrl: string): string[] {
  const urls = new Set<string>();
  urls.add(normalizeHtmlUrl(fetchUrl));
  urls.add(normalizeHtmlUrl(canonicalPdfUrl));

  for (const url of [...urls]) {
    if (url.startsWith("https://")) {
      urls.add(`http://${url.slice("https://".length)}`);
    }
  }

  return [...urls];
}

function normalizeHtmlUrl(url: string): string {
  return url.replace(/&amp;|&#0*38;/gi, "&");
}

function validatePdfResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType && !/application\/pdf|application\/octet-stream/i.test(contentType)) {
    throw new Error(`Expected PDF response, got content-type "${contentType}"`);
  }
}

function validatePdfBuffer(buffer: Buffer) {
  if (buffer.length < 100) {
    throw new Error(`PDF response too small (${buffer.length} bytes)`);
  }
  if (buffer.subarray(0, 5).toString("utf8") !== "%PDF-") {
    const preview = buffer.subarray(0, 120).toString("utf8").replace(/\s+/g, " ").trim();
    throw new Error(`Response is not a PDF. First bytes: ${preview}`);
  }
}

function isPdfBuffer(buffer: Buffer) {
  return buffer.length >= 100 && buffer.subarray(0, 5).toString("utf8") === "%PDF-";
}

async function readResponseBuffer(response: Response, timeout: number): Promise<Buffer> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timerPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Response body timeout after ${timeout}ms`)), timeout);
  });
  try {
    const arrayBuffer = await Promise.race([response.arrayBuffer(), timerPromise]);
    return Buffer.from(arrayBuffer);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function pickDiagnosticHeaders(headers: Headers): Record<string, string> {
  const keys = [
    "content-type",
    "server",
    "x-powered-by",
    "x-cache",
    "cf-ray",
    "retry-after",
    "location",
  ];
  const picked: Record<string, string> = {};
  for (const key of keys) {
    const value = headers.get(key);
    if (value) picked[key] = value;
  }
  return picked;
}

export async function fetchText(url: string, options?: RetryOptions): Promise<string> {
  const response = await fetchWithRetry(url, options);
  return response.text();
}

export async function fetchBuffer(url: string, options?: RetryOptions): Promise<ArrayBuffer> {
  const response = await fetchWithRetry(url, options);
  return response.arrayBuffer();
}

export async function fetchJson(url: string, options?: RetryOptions): Promise<unknown> {
  const response = await fetchWithRetry(url, options);
  return response.json();
}
