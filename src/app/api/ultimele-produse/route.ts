import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [medicines, recalls] = await Promise.all([
      prisma.medicineDiscontinuity.findMany({
        orderBy: { firstSeenAt: "desc" },
        take: 5,
        select: {
          id: true,
          commercialName: true,
          authorizationHolder: true,
          notificationType: true,
          addressDate: true,
        },
      }),
      prisma.productRecall.findMany({
        orderBy: { publishedAt: "desc" },
        take: 5,
        select: {
          id: true,
          productName: true,
          title: true,
          brand: true,
          retailer: true,
          reason: true,
          publishedAt: true,
          imageUrls: true,
          officialPdfDocumentId: true,
          category: true,
          consumerInstruction: true,
          refundInstruction: true,
          contactPhone: true,
          contactEmail: true,
          quantity: true,
          lotNumber: true,
          barcode: true,
          riskType: true,
          sourceUrl: true,
        },
      }),
    ]);

    return NextResponse.json({ medicines, recalls });
  } catch (error) {
    console.error("[ULTIMELE_PRODUSE]", error);
    return NextResponse.json({ medicines: [], recalls: [] });
  }
}
