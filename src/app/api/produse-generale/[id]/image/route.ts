import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const recall = await prisma.productRecall.findUnique({
      where: { id },
      select: { imageUrls: true },
    });

    if (recall?.imageUrls?.length && recall.imageUrls[0]) {
      const url = new URL(recall.imageUrls[0]);
      if (url.protocol === "https:" || url.protocol === "http:") return NextResponse.redirect(url);
    }

    return new NextResponse("Not found", { status: 404 });
  } catch (error) {
    console.error("[PRODUSE_GENERALE_IMAGE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
