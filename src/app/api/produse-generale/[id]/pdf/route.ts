import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { signedSourceDocumentUrl } from "@/lib/object-storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const recall = await prisma.productRecall.findUnique({
      where: { id },
      select: { officialPdfDocumentId: true },
    });

    if (!recall?.officialPdfDocumentId) {
      return new NextResponse("Not found", { status: 404 });
    }

    const doc = await prisma.sourceDocument.findUnique({
      where: { id: recall.officialPdfDocumentId },
      select: { objectKey: true },
    });

    if (!doc?.objectKey) {
      return new NextResponse("PDF not found", { status: 404 });
    }

    return NextResponse.redirect(await signedSourceDocumentUrl(doc.objectKey));
  } catch (error) {
    console.error("[PRODUSE_GENERALE_PDF]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
