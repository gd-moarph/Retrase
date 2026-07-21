import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { sha256Buffer } from "@/lib/crypto";

type StorageConfig = {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  region: string;
  forcePathStyle: boolean;
};

let client: S3Client | undefined;

function config(): StorageConfig {
  const endpoint = process.env.AWS_ENDPOINT_URL;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const bucket = process.env.AWS_S3_BUCKET_NAME;

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("Railway Bucket credentials are not configured");
  }

  return {
    endpoint,
    accessKeyId,
    secretAccessKey,
    bucket,
    region: process.env.AWS_DEFAULT_REGION || "auto",
    forcePathStyle: process.env.AWS_S3_URL_STYLE === "path",
  };
}

function storageClient(): S3Client {
  if (client) return client;
  const value = config();
  client = new S3Client({
    endpoint: value.endpoint,
    region: value.region,
    forcePathStyle: value.forcePathStyle,
    credentials: {
      accessKeyId: value.accessKeyId,
      secretAccessKey: value.secretAccessKey,
    },
  });
  return client;
}

function safeFileName(fileName: string): string {
  return fileName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "source-document";
}

export function sourceObjectKey(sourceType: string, sha256: string, fileName: string): string {
  return `sources/${sourceType}/${sha256}/${safeFileName(fileName)}`;
}

export async function putSourceObject(params: {
  sourceType: string;
  sha256: string;
  fileName: string;
  mimeType?: string;
  body: Buffer;
}): Promise<{ objectKey: string; objectETag?: string; storedAt: Date }> {
  const value = config();
  const objectKey = sourceObjectKey(params.sourceType, params.sha256, params.fileName);
  const s3 = storageClient();

  try {
    const existing = await s3.send(new HeadObjectCommand({ Bucket: value.bucket, Key: objectKey }));
    if (existing.ContentLength !== params.body.length) {
      throw new Error(`Existing object size mismatch for ${objectKey}`);
    }
    return { objectKey, objectETag: existing.ETag, storedAt: existing.LastModified || new Date() };
  } catch (error) {
    const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
    if (status && status !== 404) throw error;
  }

  const uploaded = await s3.send(new PutObjectCommand({
    Bucket: value.bucket,
    Key: objectKey,
    Body: params.body,
    ContentType: params.mimeType || "application/octet-stream",
    Metadata: { sha256: params.sha256 },
  }));

  const head = await s3.send(new HeadObjectCommand({ Bucket: value.bucket, Key: objectKey }));
  if (head.ContentLength !== params.body.length || head.Metadata?.sha256 !== params.sha256) {
    throw new Error(`Object verification failed for ${objectKey}`);
  }

  return { objectKey, objectETag: uploaded.ETag || head.ETag, storedAt: new Date() };
}

export async function verifySourceObject(objectKey: string, expectedSize: number, expectedSha256: string) {
  const value = config();
  const head = await storageClient().send(new HeadObjectCommand({ Bucket: value.bucket, Key: objectKey }));
  return head.ContentLength === expectedSize && head.Metadata?.sha256 === expectedSha256;
}

export async function signedSourceDocumentUrl(objectKey: string, expiresIn = 300): Promise<string> {
  const value = config();
  return getSignedUrl(
    storageClient(),
    new GetObjectCommand({ Bucket: value.bucket, Key: objectKey }),
    { expiresIn },
  );
}

export async function getSourceObject(objectKey: string): Promise<Buffer> {
  const value = config();
  const response = await storageClient().send(new GetObjectCommand({
    Bucket: value.bucket,
    Key: objectKey,
  }));

  if (!response.Body) {
    throw new Error(`Stored object has no body: ${objectKey}`);
  }

  return Buffer.from(await response.Body.transformToByteArray());
}

export function assertBufferSha256(body: Buffer, expectedSha256: string): void {
  if (sha256Buffer(body) !== expectedSha256) {
    throw new Error("Source document SHA-256 mismatch");
  }
}
