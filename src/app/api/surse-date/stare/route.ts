import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit, tooManyRequests } from "@/lib/rate-limit";

export async function GET(request: Request) {
  try {
    const rate = await checkRateLimit(request, { name: "source-health", limit: 60, windowSeconds: 60 });
    if (!rate.allowed) return tooManyRequests(rate.retryAfter);

    const runs = await prisma.sourceRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 30,
    });

    const documents = await prisma.sourceDocument.findMany({
      where: { parseStatus: "PARSED" },
      orderBy: { fetchedAt: "desc" },
      distinct: ["sourceType"],
      select: { sourceType: true, url: true, fileName: true, fileSize: true, sha256: true, fetchedAt: true, parserVersion: true },
    });

    return NextResponse.json({
      runs: runs.map(({ errorMessage, ...run }) => ({ ...run, error: errorMessage ? "Importul a eșuat; verifică jurnalele Railway." : null })),
      documents,
    }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
  } catch (error) {
    console.error("[SOURCE_STATUS]", error);
    return NextResponse.json({ error: "Eroare internă" }, { status: 500 });
  }
}
