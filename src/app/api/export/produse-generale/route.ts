import { prisma } from "@/lib/db";
import { createXlsxBuffer, xlsxResponse } from "@/lib/xlsx-export";
import { checkRateLimit, tooManyRequests } from "@/lib/rate-limit";

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("ro-RO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export async function GET(request: Request) {
  const rate = await checkRateLimit(request, { name: "export", limit: 5, windowSeconds: 3600 });
  if (!rate.allowed) return tooManyRequests(rate.retryAfter);

  const rows = await prisma.productRecall.findMany({
    orderBy: [{ publishedAt: "desc" }, { firstSeenAt: "desc" }],
    take: 10000,
    select: {
      title: true,
      brand: true,
      retailer: true,
      quantity: true,
      publishedAt: true,
      sourceUrl: true,
    },
  });

  const xlsx = await createXlsxBuffer(
    "Produse generale",
    rows.map((row) => ({
      Titlu: row.title,
      Brand: row.brand,
      Retailer: row.retailer,
      Cantitate: row.quantity,
      "Data Publicare": formatDate(row.publishedAt),
      Sursa: {
        value: row.sourceUrl ? "Click aici - vezi sursa" : "",
        link: row.sourceUrl,
      },
    }))
  );

  return xlsxResponse("produse-generale.xlsx", xlsx);
}
