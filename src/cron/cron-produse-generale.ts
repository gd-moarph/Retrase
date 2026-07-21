import { prisma } from "@/lib/db";
import { importAnsvsaRecalls } from "@/importers/ansvsa";
import { withImportLock } from "@/lib/import-lock";

async function main() {
  const result = await withImportLock("ANSVSA", () => importAnsvsaRecalls());
  if (!result) { console.log("[CRON:PRODUSE_GENERALE] ANSVSA already running; skipped"); return; }
  console.log("[CRON:PRODUSE_GENERALE] ANSVSA", result);
  if (result.status === "FAILED") throw new Error(result.errorMessage || "ANSVSA import failed");
}

main()
  .catch((error) => { console.error("[CRON:PRODUSE_GENERALE]", error); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
