import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  let databaseStatus: "ok" | "error" = "ok";
  try { await prisma.$queryRaw`SELECT 1`; } catch { databaseStatus = "error"; }

  const required = ["DATABASE_URL", "AWS_ENDPOINT_URL", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_S3_BUCKET_NAME", "RATE_LIMIT_SALT"];
  const environment = Object.fromEntries(required.map((key) => [key, process.env[key] ? "set" : "missing"]));
  const healthy = databaseStatus === "ok" && Object.values(environment).every((value) => value === "set");

  let latestSourceRuns: unknown[] = [];
  try {
    latestSourceRuns = await prisma.sourceRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 5,
      select: { id: true, sourceType: true, status: true, startedAt: true, finishedAt: true, itemsFound: true },
    });
  } catch { /* database status already communicates availability */ }

  return NextResponse.json({
    status: healthy ? "healthy" : "unhealthy",
    timestamp: new Date().toISOString(),
    database: { status: databaseStatus },
    environment,
    latestSourceRuns,
  }, { status: healthy ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
