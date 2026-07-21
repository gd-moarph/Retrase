import { prisma } from "@/lib/db";
import { sha256 } from "@/lib/crypto";
import { Prisma, SourceType, SourceRunStatus } from "@prisma/client";
import { registerImport, unregisterImport, checkAborted } from "@/lib/import-tracker";
import { putSourceObject } from "@/lib/object-storage";

export interface ImporterResult {
  status: SourceRunStatus;
  itemsFound: number;
  itemsInserted: number;
  itemsUpdated: number;
  documentsDownloaded: number;
  errorMessage?: string;
  runId: string;
}

export async function createSourceRun(sourceType: SourceType): Promise<string> {
  const run = await prisma.sourceRun.create({
    data: { sourceType },
  });
  return run.id;
}

export async function heartbeatUpdate(
  runId: string,
  data: { itemsFound?: number; itemsInserted?: number; itemsUpdated?: number; documentsDownloaded?: number }
): Promise<void> {
  await prisma.sourceRun.update({
    where: { id: runId },
    data: {
      heartbeatAt: new Date(),
      ...(data.itemsFound !== undefined && { itemsFound: data.itemsFound }),
      ...(data.itemsInserted !== undefined && { itemsInserted: data.itemsInserted }),
      ...(data.itemsUpdated !== undefined && { itemsUpdated: data.itemsUpdated }),
      ...(data.documentsDownloaded !== undefined && { documentsDownloaded: data.documentsDownloaded }),
    },
  });
}

export async function completeSourceRun(
  runId: string,
  result: Omit<ImporterResult, "runId">
): Promise<void> {
  await prisma.sourceRun.update({
    where: { id: runId },
    data: {
      status: result.status,
      finishedAt: new Date(),
      heartbeatAt: new Date(),
      itemsFound: result.itemsFound,
      itemsInserted: result.itemsInserted,
      itemsUpdated: result.itemsUpdated,
      documentsDownloaded: result.documentsDownloaded,
      errorMessage: result.errorMessage,
    },
  });
}

export async function storeSourceDocument(params: {
  sourceRunId?: string;
  sourceType: SourceType;
  url: string;
  mimeType?: string;
  fileName?: string;
  fileSize?: number;
  sha256?: string;
  binaryData?: Buffer;
  extractedText?: string;
  parseStatus?: "PENDING" | "PARSED" | "PARTIAL" | "FAILED";
  parseError?: string;
}): Promise<string> {
  if (!params.binaryData || !params.sha256) {
    throw new Error("Source documents require binary data and a SHA-256 checksum");
  }

  const existing = await prisma.sourceDocument.findFirst({
    where: { sourceType: params.sourceType, sha256: params.sha256 },
  });
  if (existing?.objectKey) return existing.id;

  const stored = await putSourceObject({
    sourceType: params.sourceType,
    sha256: params.sha256,
    fileName: params.fileName || "source-document",
    mimeType: params.mimeType,
    body: params.binaryData,
  });
  const status = params.parseStatus || (params.extractedText ? "PARSED" : "PENDING");
  const doc = existing
    ? await prisma.sourceDocument.update({ where: { id: existing.id }, data: {
      objectKey: stored.objectKey,
      objectETag: stored.objectETag,
      storedAt: stored.storedAt,
      parseError: params.parseError,
      extractedText: params.extractedText,
      parseStatus: status,
    } })
    : await prisma.sourceDocument.create({ data: {
      sourceType: params.sourceType,
      url: params.url,
      mimeType: params.mimeType,
      fileName: params.fileName,
      fileSize: params.fileSize,
      sha256: params.sha256,
      objectKey: stored.objectKey,
      objectETag: stored.objectETag,
      storedAt: stored.storedAt,
      extractedText: params.extractedText,
      parseError: params.parseError,
      sourceRunId: params.sourceRunId,
      parseStatus: status,
    } });
  return doc.id;
}

export async function createOrUpdateSourceItem(params: {
  sourceType: SourceType;
  externalId: string;
  sourceUrl: string;
  title?: string;
  normalizedText?: string;
  rawJson?: Prisma.InputJsonValue;
  sourceDocumentId?: string;
  publishedAt?: Date;
  contentHash?: string;
}): Promise<{ id: string; isNew: boolean }> {
  const existing = await prisma.sourceItem.findUnique({
    where: {
      sourceType_externalId: {
        sourceType: params.sourceType,
        externalId: params.externalId,
      },
    },
  });

  if (existing) {
    if (params.contentHash && existing.contentHash === params.contentHash) {
      await prisma.sourceItem.update({
        where: { id: existing.id },
        data: { lastSeenAt: new Date() },
      });
      return { id: existing.id, isNew: false };
    }

    const updated = await prisma.sourceItem.update({
      where: { id: existing.id },
      data: {
        title: params.title ?? existing.title,
        normalizedText: params.normalizedText ?? existing.normalizedText,
        ...(params.rawJson !== undefined ? { rawJson: params.rawJson } : {}),
        sourceDocumentId: params.sourceDocumentId ?? existing.sourceDocumentId,
        publishedAt: params.publishedAt ?? existing.publishedAt,
        contentHash: params.contentHash ?? existing.contentHash,
      },
    });

    if (params.contentHash && existing.contentHash !== params.contentHash) {
      await prisma.sourceItemVersion.create({
        data: {
          sourceItemId: existing.id,
          contentHash: params.contentHash,
          rawJson: params.rawJson,
        },
      });
    }

    return { id: updated.id, isNew: false };
  }

  const item = await prisma.sourceItem.create({
    data: {
      sourceType: params.sourceType,
      externalId: params.externalId,
      sourceUrl: params.sourceUrl,
      title: params.title,
      normalizedText: params.normalizedText,
      rawJson: params.rawJson,
      sourceDocumentId: params.sourceDocumentId,
      publishedAt: params.publishedAt,
      contentHash: params.contentHash,
    },
  });

  return { id: item.id, isNew: true };
}

export async function updateDocumentStatus(docId: string, params: {
  parseStatus: "PENDING" | "PARSED" | "PARTIAL" | "FAILED";
  parseError?: string;
  extractedText?: string;
}): Promise<void> {
  await prisma.sourceDocument.update({
    where: { id: docId },
    data: {
      parseStatus: params.parseStatus,
      parseError: params.parseError,
      extractedText: params.extractedText,
    },
  });
}

export function createTimeout(ms: number): { promise: Promise<never>; clear: () => void } {
  let clear: () => void;
  const promise = new Promise<never>((_, reject) => {
    const id = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
    clear = () => clearTimeout(id);
  });
  return { promise, clear: clear! };
}

export { sha256, registerImport, unregisterImport, checkAborted };
