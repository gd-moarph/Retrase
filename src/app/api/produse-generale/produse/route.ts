import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "newest";

  const where: Prisma.ProductRecallWhereInput = {};
  if (search) {
    where.OR = [
      { productName: { contains: search, mode: "insensitive" } },
      { brand: { contains: search, mode: "insensitive" } },
      { retailer: { contains: search, mode: "insensitive" } },
      { reason: { contains: search, mode: "insensitive" } },
      { lotNumber: { contains: search, mode: "insensitive" } },
    ];
  }

  const orderBy: Prisma.ProductRecallOrderByWithRelationInput = sort === "oldest"
    ? { publishedAt: "asc" }
    : { publishedAt: "desc" };

  const [items, total] = await Promise.all([
    prisma.productRecall.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        productName: true,
        brand: true,
        retailer: true,
        category: true,
        reason: true,
        lotNumber: true,
        barcode: true,
        riskType: true,
        publishedAt: true,
        sourceUrl: true,
        imageUrls: true,
        officialPdfDocumentId: true,
        consumerInstruction: true,
        refundInstruction: true,
        contactPhone: true,
        contactEmail: true,
        quantity: true,
      },
    }),
    prisma.productRecall.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
}
