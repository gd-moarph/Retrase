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

  const rows = await prisma.medicineDiscontinuity.findMany({
    where: { isPresentInLatest: true },
    orderBy: { firstSeenAt: "desc" },
    take: 10000,
    select: {
      commercialName: true,
      dci: true,
      authorizationHolder: true,
      pharmaceuticalForm: true,
      concentration: true,
      notificationType: true,
      addressDate: true,
      estimatedResumeDateText: true,
      observations: true,
      firstSeenAt: true,
      sourceItem: { select: { sourceUrl: true } },
    },
  });

  const xlsx = await createXlsxBuffer(
    "Medicamente",
    rows.map((row) => ({
      Denumire: row.commercialName,
      DCI: row.dci,
      Detinator: row.authorizationHolder,
      Forma: row.pharmaceuticalForm,
      Concentratie: row.concentration,
      "Tip Notificare": row.notificationType,
      "Data Adresa": row.addressDate,
      "Reluare Estimativa": row.estimatedResumeDateText,
      Observatii: row.observations,
      "Prima Aparitie": formatDate(row.firstSeenAt),
      Sursa: {
        value: row.sourceItem.sourceUrl ? "Click aici - vezi sursa" : "",
        link: row.sourceItem.sourceUrl,
      },
    }))
  );

  return xlsxResponse("medicamente.xlsx", xlsx);
}
