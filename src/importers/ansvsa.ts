import { prisma } from "@/lib/db";
import { sha256 } from "@/lib/crypto";
import { normalizeText } from "@/lib/normalize";
import { fetchText } from "@/lib/retry";
import * as cheerio from "cheerio";
import {
  createSourceRun,
  heartbeatUpdate,
  completeSourceRun,
  createOrUpdateSourceItem,
  registerImport,
  unregisterImport,
  checkAborted,
  type ImporterResult,
} from "./base";

const CATEGORY_RSS_URL = "https://www.ansvsa.ro/blog/category/retragere-produse-alimentare/feed/";

const RETAILERS = [
  "lidl", "kaufland", "carrefour", "mega image", "auchan", "profi",
  "penny", "selgros", "metro", "cora", "la cocos", "supeco", "annabella",
  "dm", "dr. max", "farmacia tei", "catena", "altex", "emag", "decathlon",
];

const CATEGORIES = [
  "alimente", "bauturi", "lactate", "carne", "peste", "oua",
  "panificatie", "dulciuri", "nuci_seminte", "condimente",
  "produse_pentru_copii", "hrana_animale", "suplimente_alimentare",
  "produse_congelate", "produse_refrigerate",
];

interface AnsvsaEntry {
  pdfUrl: string;
  fetchUrl: string;
  title: string;
  date: Date | null;
}

const HEARTBEAT_INTERVAL_MS = 5000;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function importAnsvsaRecalls(): Promise<ImporterResult> {
  const signal = registerImport("ANSVSA");
  const runId = await createSourceRun("ANSVSA");
  const result: Omit<ImporterResult, "runId"> = {
    status: "RUNNING",
    itemsFound: 0,
    itemsInserted: 0,
    itemsUpdated: 0,
    documentsDownloaded: 0,
  };

  const heartbeatTimer = setInterval(async () => {
    try { await heartbeatUpdate(runId, result); } catch { /* ignore */ }
  }, HEARTBEAT_INTERVAL_MS);

  try {
    const entries = await collectAnsvsaEntries(signal);
    checkAborted(signal);
    result.itemsFound = entries.length;

    try { await heartbeatUpdate(runId, result); } catch { /* ignore */ }

    const seenSha256 = new Set<string>();
    let idx = 0;

    for (const entry of entries) {
      checkAborted(signal);

      if (seenSha256.has(entry.pdfUrl)) continue;
      seenSha256.add(entry.pdfUrl);

      console.log(`[ANSVSA] Processing ${idx + 1}/${entries.length}: ${entry.pdfUrl}`);
      try {
        await processAnsvsaEntry(entry, result, signal);
        console.log(`[ANSVSA] Done ${idx + 1}/${entries.length}: found=${result.itemsFound} ins=${result.itemsInserted} docs=${result.documentsDownloaded}`);
      } catch (error) {
        console.error(`[ANSVSA] Failed: ${entry.pdfUrl}`, error);
      }

      idx++;
      if (idx < entries.length) await delay(100);
    }

    result.status = "SUCCESS";
  } catch (error) {
    if (signal.aborted) {
      result.status = "CANCELED";
      result.errorMessage = "Import anulat de utilizator";
    } else {
      result.status = "FAILED";
      result.errorMessage = String(error);
      console.error("[ANSVSA] Import failed:", error);
    }
  } finally {
    clearInterval(heartbeatTimer);
    await completeSourceRun(runId, result);
    unregisterImport("ANSVSA");
  }

  return { ...result, runId };
}

async function collectAnsvsaEntries(signal: AbortSignal): Promise<AnsvsaEntry[]> {
  const entries: AnsvsaEntry[] = [];
  const seenPdf = new Set<string>();

  for (let page = 1; page <= 20; page++) {
    checkAborted(signal);

    const url = page === 1
      ? CATEGORY_RSS_URL
      : `${CATEGORY_RSS_URL}?paged=${page}`;

    try {
      const xml = await fetchText(url, { timeout: 15000, signal });
      if (!xml.includes("<item>") || /Page not found/i.test(xml)) break;

      const $ = cheerio.load(xml, { xmlMode: true });
      let pageCount = 0;

      $("item").each((_, item) => {
        const $item = $(item);
        const link = decodeAnsvsaFeedUrl($item.find("link").text().trim());
        const cleanUrl = link.split("?")[0];
        if (!cleanUrl.endsWith(".pdf")) return;
        if (seenPdf.has(cleanUrl)) return;
        seenPdf.add(cleanUrl);

        const rawTitle = $item.find("title").text().trim();
        const title = rawTitle.replace(/^(?:Rechemare|Retragere)\s+produs\s*(?:\u2013|-)\s*/i, "").trim();
        const dateStr = $item.find("pubDate").text().trim();

        entries.push({
          pdfUrl: cleanUrl,
          fetchUrl: link,
          title,
          date: dateStr ? new Date(dateStr) : null,
        });
        pageCount++;
      });

      if (pageCount === 0) break;
      if (page < 10) await delay(500);
    } catch (error) {
      console.error(`[ANSVSA] RSS page ${page} failed:`, error);
      continue;
    }
  }

  return entries;
}

function decodeAnsvsaFeedUrl(url: string): string {
  return url.replace(/&amp;|&#0*38;/gi, "&");
}

async function processAnsvsaEntry(
  entry: AnsvsaEntry,
  result: Omit<ImporterResult, "runId">,
  signal: AbortSignal
): Promise<void> {
  const externalId = sha256(entry.pdfUrl);
  const contentHash = sha256(JSON.stringify({
    title: entry.title,
    pdfUrl: entry.pdfUrl,
    publishedAt: entry.date?.toISOString() || null,
  }));

  const existingItem = await prisma.sourceItem.findUnique({
    where: { sourceType_externalId: { sourceType: "ANSVSA", externalId } },
  });

  if (existingItem?.contentHash === contentHash) {
    const recallExists = await prisma.productRecall.findFirst({
      where: { sourceItemId: existingItem.id },
      select: { id: true },
    });

    if (recallExists) {
      await prisma.sourceItem.update({
        where: { id: existingItem.id },
        data: { lastSeenAt: new Date() },
      });
      return;
    }
  }

  checkAborted(signal);

  const sourceItem = await createOrUpdateSourceItem({
    sourceType: "ANSVSA",
    externalId,
    sourceUrl: entry.pdfUrl,
    title: entry.title,
    normalizedText: normalizeText(entry.title),
    rawJson: {
      title: entry.title,
      officialPdfUrl: entry.pdfUrl,
      rssUrl: entry.fetchUrl,
      importStatus: "RSS_ONLY",
    },
    sourceDocumentId: existingItem?.sourceDocumentId || undefined,
    contentHash,
    publishedAt: entry.date || new Date(),
  });

  const action = await upsertProductRecall({
    sourceItemId: sourceItem.id,
    entry,
    extractedText: "",
    officialPdfDocumentId: null,
    imageUrl: null,
    importStatus: "RSS_ONLY",
    pdfDownloadError: null,
  });

  if (action === "created") {
    result.itemsInserted++;
  } else {
    result.itemsUpdated++;
  }
}

async function upsertProductRecall(params: {
  sourceItemId: string;
  entry: AnsvsaEntry;
  extractedText: string;
  officialPdfDocumentId: string | null;
  imageUrl: string | null;
  importStatus: "RSS_ONLY";
  pdfDownloadError: string | null;
}): Promise<"created" | "updated"> {
  const parsedData = parseProductFields(params.entry.title, params.extractedText);
  const data = {
    title: params.entry.title,
    productName: parsedData.productName,
    normalizedProductName: normalizeText(parsedData.productName || ""),
    brand: parsedData.brand,
    normalizedBrand: normalizeText(parsedData.brand || ""),
    retailer: parsedData.retailer,
    normalizedRetailer: normalizeText(parsedData.retailer || ""),
    category: parsedData.category,
    quantity: parsedData.quantity,
    lotNumber: parsedData.lotNumber,
    batchNumber: parsedData.batchNumber,
    barcode: parsedData.barcode,
    reason: parsedData.reason,
    riskType: parsedData.riskType,
    consumerInstruction: parsedData.consumerInstruction,
    refundInstruction: parsedData.refundInstruction,
    contactPhone: parsedData.contactPhone,
    contactEmail: parsedData.contactEmail,
    expiryDates: parsedData.expiryDates || [],
    sourceUrl: params.entry.pdfUrl,
    publishedAt: params.entry.date || new Date(),
    country: "Romania",
    imageUrls: params.imageUrl ? [params.imageUrl] : [],
    rawJson: {
      title: params.entry.title,
      officialPdfUrl: params.entry.pdfUrl,
      importStatus: params.importStatus,
      pdfDownloadError: params.pdfDownloadError,
    },
  };

  const existingRecall = await prisma.productRecall.findFirst({
    where: { sourceItemId: params.sourceItemId },
    select: { id: true, officialPdfDocumentId: true, imageUrls: true },
  });

  if (!existingRecall) {
    await prisma.productRecall.create({
      data: {
        sourceItemId: params.sourceItemId,
        ...data,
        officialPdfDocumentId: params.officialPdfDocumentId,
      },
    });
    return "created";
  }

  await prisma.productRecall.update({
    where: { id: existingRecall.id },
    data: {
      ...data,
      imageUrls: params.imageUrl ? [params.imageUrl] : existingRecall.imageUrls,
      ...(params.officialPdfDocumentId ? { officialPdfDocumentId: params.officialPdfDocumentId } : {}),
    },
  });
  return "updated";
}

function parseProductFields(title: string, body: string) {
  const combined = `${title} ${body}`;
  const lower = combined.toLowerCase();

  const retailer = RETAILERS.find((r) => lower.includes(r)) || null;
  const category = CATEGORIES.find((c) => lower.includes(c.replace(/_/g, " "))) || null;
  const quantityMatch = combined.match(/(\d+(?:[,.]\d+)?)\s*(g|kg|ml|l|mg|buc|bucata|tablete|capsule)/i);
  const barcodeMatch = combined.match(/(?:cod de bare|ean|barcode)[:\s]*(\d{8,13})/i);
  const expiryMatch = combined.match(/(?:termen(?:ul)?\s*(?:de\s*)?valabilitate|expira(?:re)?)[:\s]*([0-9]{1,2}[./-][0-9]{1,2}[./-][0-9]{2,4})/i);
  const lotMatch = combined.match(/(?:lot|lotul|seria|batch)[:\s]*([a-z0-9./-]{3,30})/i);

  const normalizedRetailer = retailer
    ? retailer.charAt(0).toUpperCase() + retailer.slice(1)
    : null;

  return {
    productName: title,
    brand: normalizedRetailer,
    retailer: normalizedRetailer,
    category,
    quantity: quantityMatch ? quantityMatch[0] : null,
    lotNumber: lotMatch ? lotMatch[1].trim() : null,
    batchNumber: null,
    barcode: barcodeMatch ? barcodeMatch[1] : null,
    reason: "",
    riskType: null,
    consumerInstruction: null,
    refundInstruction: null,
    contactPhone: null,
    contactEmail: null,
    supplier: null,
    expiryDates: expiryMatch ? [expiryMatch[1].trim()] : [],
  };
}
