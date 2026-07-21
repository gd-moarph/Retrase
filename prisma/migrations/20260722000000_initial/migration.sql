-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('ANSVSA', 'ANM_DISCONTINUITY', 'ANM_NOMENCLATURE');

-- CreateEnum
CREATE TYPE "SourceRunStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED', 'NO_CHANGE', 'CANCELED');

-- CreateEnum
CREATE TYPE "SourceDocumentParseStatus" AS ENUM ('PENDING', 'PARSED', 'PARTIAL', 'FAILED');

-- CreateTable
CREATE TABLE "source_runs" (
    "id" TEXT NOT NULL,
    "sourceType" "SourceType" NOT NULL,
    "status" "SourceRunStatus" NOT NULL DEFAULT 'RUNNING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "heartbeatAt" TIMESTAMP(3),
    "itemsFound" INTEGER NOT NULL DEFAULT 0,
    "itemsInserted" INTEGER NOT NULL DEFAULT 0,
    "itemsUpdated" INTEGER NOT NULL DEFAULT 0,
    "documentsDownloaded" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "metadataJson" JSONB,

    CONSTRAINT "source_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_documents" (
    "id" TEXT NOT NULL,
    "sourceType" "SourceType" NOT NULL,
    "url" TEXT NOT NULL,
    "canonicalUrl" TEXT,
    "mimeType" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "sha256" TEXT,
    "objectKey" TEXT,
    "objectETag" TEXT,
    "storedAt" TIMESTAMP(3),
    "extractedText" TEXT,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parserVersion" TEXT,
    "parseStatus" "SourceDocumentParseStatus" NOT NULL DEFAULT 'PENDING',
    "parseError" TEXT,
    "sourceRunId" TEXT,

    CONSTRAINT "source_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_items" (
    "id" TEXT NOT NULL,
    "sourceType" "SourceType" NOT NULL,
    "externalId" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "title" TEXT,
    "normalizedText" TEXT,
    "rawJson" JSONB,
    "sourceDocumentId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "contentHash" TEXT,

    CONSTRAINT "source_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_item_versions" (
    "id" TEXT NOT NULL,
    "sourceItemId" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "rawJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "source_item_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicines" (
    "id" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "commercialName" TEXT NOT NULL,
    "normalizedCommercialName" TEXT NOT NULL,
    "dci" TEXT,
    "normalizedDci" TEXT,
    "pharmaceuticalForm" TEXT,
    "concentration" TEXT,
    "atcCode" TEXT,
    "cimCode" TEXT NOT NULL,
    "appHolder" TEXT,
    "producer" TEXT,
    "prescription" TEXT,
    "packageDescription" TEXT,
    "rcpUrl" TEXT,
    "prospectUrl" TEXT,
    "packageUrl" TEXT,
    "contentHash" TEXT NOT NULL,
    "sourceUpdatedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "removedAt" TIMESTAMP(3),
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medicines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicine_discontinuities" (
    "id" TEXT NOT NULL,
    "sourceItemId" TEXT NOT NULL,
    "medicineId" TEXT,
    "commercialName" TEXT,
    "normalizedCommercialName" TEXT,
    "pharmaceuticalForm" TEXT,
    "concentration" TEXT,
    "authorizationHolder" TEXT,
    "holderCountry" TEXT,
    "dci" TEXT,
    "normalizedDci" TEXT,
    "addressDate" TEXT,
    "notificationType" TEXT,
    "estimatedResumeDateText" TEXT,
    "observations" TEXT,
    "rawRowText" TEXT,
    "rowNumber" INTEGER,
    "sourcePage" INTEGER,
    "stableKey" TEXT NOT NULL,
    "isPresentInLatest" BOOLEAN NOT NULL DEFAULT true,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medicine_discontinuities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicine_discontinuity_versions" (
    "id" TEXT NOT NULL,
    "medicineDiscontinuityId" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "rawJson" JSONB,
    "rawRowText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medicine_discontinuity_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_recalls" (
    "id" TEXT NOT NULL,
    "sourceItemId" TEXT NOT NULL,
    "title" TEXT,
    "productName" TEXT,
    "normalizedProductName" TEXT,
    "brand" TEXT,
    "normalizedBrand" TEXT,
    "retailer" TEXT,
    "normalizedRetailer" TEXT,
    "category" TEXT,
    "subcategory" TEXT,
    "quantity" TEXT,
    "lotNumber" TEXT,
    "batchNumber" TEXT,
    "barcode" TEXT,
    "expiryDates" TEXT[],
    "reason" TEXT,
    "riskType" TEXT,
    "riskLevel" TEXT,
    "consumerInstruction" TEXT,
    "refundInstruction" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Romania',
    "sourceUrl" TEXT,
    "officialPdfDocumentId" TEXT,
    "imageUrls" TEXT[],
    "publishedAt" TIMESTAMP(3),
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "rawJson" JSONB,

    CONSTRAINT "product_recalls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_recall_versions" (
    "id" TEXT NOT NULL,
    "productRecallId" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "rawJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_recall_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limits" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "source_runs_sourceType_startedAt_idx" ON "source_runs"("sourceType", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "source_documents_objectKey_key" ON "source_documents"("objectKey");

-- CreateIndex
CREATE INDEX "source_documents_sourceType_fetchedAt_idx" ON "source_documents"("sourceType", "fetchedAt");

-- CreateIndex
CREATE UNIQUE INDEX "source_documents_sourceType_sha256_key" ON "source_documents"("sourceType", "sha256");

-- CreateIndex
CREATE INDEX "source_items_sourceType_lastSeenAt_idx" ON "source_items"("sourceType", "lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "source_items_sourceType_externalId_key" ON "source_items"("sourceType", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "medicines_sourceKey_key" ON "medicines"("sourceKey");

-- CreateIndex
CREATE INDEX "medicines_cimCode_idx" ON "medicines"("cimCode");

-- CreateIndex
CREATE INDEX "medicines_normalizedCommercialName_idx" ON "medicines"("normalizedCommercialName");

-- CreateIndex
CREATE INDEX "medicines_normalizedDci_idx" ON "medicines"("normalizedDci");

-- CreateIndex
CREATE INDEX "medicines_atcCode_idx" ON "medicines"("atcCode");

-- CreateIndex
CREATE INDEX "medicines_isActive_idx" ON "medicines"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "medicine_discontinuities_stableKey_key" ON "medicine_discontinuities"("stableKey");

-- CreateIndex
CREATE INDEX "medicine_discontinuities_normalizedCommercialName_idx" ON "medicine_discontinuities"("normalizedCommercialName");

-- CreateIndex
CREATE INDEX "medicine_discontinuities_normalizedDci_idx" ON "medicine_discontinuities"("normalizedDci");

-- CreateIndex
CREATE INDEX "medicine_discontinuities_isPresentInLatest_idx" ON "medicine_discontinuities"("isPresentInLatest");

-- CreateIndex
CREATE INDEX "product_recalls_normalizedProductName_idx" ON "product_recalls"("normalizedProductName");

-- CreateIndex
CREATE INDEX "product_recalls_normalizedBrand_idx" ON "product_recalls"("normalizedBrand");

-- CreateIndex
CREATE INDEX "product_recalls_normalizedRetailer_idx" ON "product_recalls"("normalizedRetailer");

-- CreateIndex
CREATE INDEX "product_recalls_barcode_idx" ON "product_recalls"("barcode");

-- CreateIndex
CREATE INDEX "rate_limits_createdAt_idx" ON "rate_limits"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "rate_limits_key_windowStart_key" ON "rate_limits"("key", "windowStart");

-- AddForeignKey
ALTER TABLE "source_documents" ADD CONSTRAINT "source_documents_sourceRunId_fkey" FOREIGN KEY ("sourceRunId") REFERENCES "source_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_items" ADD CONSTRAINT "source_items_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "source_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_item_versions" ADD CONSTRAINT "source_item_versions_sourceItemId_fkey" FOREIGN KEY ("sourceItemId") REFERENCES "source_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicine_discontinuities" ADD CONSTRAINT "medicine_discontinuities_sourceItemId_fkey" FOREIGN KEY ("sourceItemId") REFERENCES "source_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicine_discontinuities" ADD CONSTRAINT "medicine_discontinuities_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "medicines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicine_discontinuity_versions" ADD CONSTRAINT "medicine_discontinuity_versions_medicineDiscontinuityId_fkey" FOREIGN KEY ("medicineDiscontinuityId") REFERENCES "medicine_discontinuities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_recalls" ADD CONSTRAINT "product_recalls_sourceItemId_fkey" FOREIGN KEY ("sourceItemId") REFERENCES "source_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_recalls" ADD CONSTRAINT "product_recalls_officialPdfDocumentId_fkey" FOREIGN KEY ("officialPdfDocumentId") REFERENCES "source_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_recall_versions" ADD CONSTRAINT "product_recall_versions_productRecallId_fkey" FOREIGN KEY ("productRecallId") REFERENCES "product_recalls"("id") ON DELETE CASCADE ON UPDATE CASCADE;
