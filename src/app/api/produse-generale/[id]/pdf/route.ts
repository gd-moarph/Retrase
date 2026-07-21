import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSourceObject } from "@/lib/object-storage";
import { fetchAnsvsaPdfBuffer } from "@/lib/retry";
import { isAllowedAnsvsaPdfUrl } from "@/lib/ansvsa-pdf";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const recall = await prisma.productRecall.findUnique({
      where: { id },
      select: { officialPdfDocumentId: true, sourceUrl: true },
    });

    if (!recall) {
      return new NextResponse("Not found", { status: 404 });
    }

    let pdf: Buffer | null = null;

    if (recall.officialPdfDocumentId) {
      const doc = await prisma.sourceDocument.findUnique({
        where: { id: recall.officialPdfDocumentId },
        select: { objectKey: true },
      });

      if (doc?.objectKey) {
        pdf = await getSourceObject(doc.objectKey);
      }
    }

    if (!pdf && recall.sourceUrl && isAllowedAnsvsaPdfUrl(recall.sourceUrl)) {
      pdf = await fetchAnsvsaPdfBuffer(recall.sourceUrl, recall.sourceUrl, {
        maxRetries: 2,
        timeout: 15_000,
      });
    }

    if (!pdf) {
      return new NextResponse("PDF not found", { status: 404 });
    }

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "Content-Disposition": 'inline; filename="retragere-produs.pdf"',
        "Content-Length": String(pdf.length),
        "Content-Type": "application/pdf",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[PRODUSE_GENERALE_PDF]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
