import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit, tooManyRequests } from "@/lib/rate-limit";

export async function GET(request: Request) {
  try {
    const rate = await checkRateLimit(request, { name: "search", limit: 120, windowSeconds: 60 });
    if (!rate.allowed) return tooManyRequests(rate.retryAfter);

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    if (!query || query.length < 2) {
      return NextResponse.json({ medicines: [] });
    }

    const normalizedQuery = (await import("@/lib/normalize")).normalizeText(query);

    const medicines = await prisma.medicine.findMany({
      where: {
        isActive: true,
        OR: [
          { normalizedCommercialName: { contains: normalizedQuery } },
          { normalizedDci: { contains: normalizedQuery } },
          { atcCode: { contains: query.toUpperCase() } },
          { cimCode: { contains: query } },
          { appHolder: { contains: query, mode: "insensitive" } },
        ],
      },
      take: limit,
      orderBy: { commercialName: "asc" },
    });

    return NextResponse.json({ medicines });
  } catch (error) {
    console.error("[SEARCH_MEDICINES]", error);
    return NextResponse.json({ error: "Eroare internă" }, { status: 500 });
  }
}
