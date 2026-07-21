import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { checkRateLimit, tooManyRequests } from "@/lib/rate-limit";

export async function GET(request: Request) {
  try {
    const rate = await checkRateLimit(request, { name: "search", limit: 120, windowSeconds: 60 });
    if (!rate.allowed) return tooManyRequests(rate.retryAfter);

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const brand = searchParams.get("brand") || "";
    const retailer = searchParams.get("retailer") || "";
    const category = searchParams.get("category") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    const where: Prisma.ProductRecallWhereInput = {};

    if (query && query.length >= 2) {
      const normalizedQuery = (await import("@/lib/normalize")).normalizeText(query);
      where.OR = [
        { normalizedProductName: { contains: normalizedQuery } },
        { normalizedBrand: { contains: normalizedQuery } },
        { normalizedRetailer: { contains: normalizedQuery } },
        { reason: { contains: query, mode: "insensitive" } },
      ];
    }

    if (brand) {
      const normalizedBrand = (await import("@/lib/normalize")).normalizeText(brand);
      where.normalizedBrand = { contains: normalizedBrand };
    }

    if (retailer) {
      const normalizedRetailer = (await import("@/lib/normalize")).normalizeText(retailer);
      where.normalizedRetailer = { contains: normalizedRetailer };
    }

    if (category) {
      where.category = category;
    }

    const recalls = await prisma.productRecall.findMany({
      where,
      take: limit,
      orderBy: { publishedAt: "desc" },
      include: {
        sourceItem: {
          select: { sourceUrl: true },
        },
      },
    });

    return NextResponse.json({ recalls });
  } catch (error) {
    console.error("[SEARCH_RECALLS]", error);
    return NextResponse.json({ error: "Eroare internă" }, { status: 500 });
  }
}
