import { prisma } from "@/lib/db";
import { importMedicineDiscontinuities } from "@/importers/anm-discontinuity";
import { importNomenclature } from "@/importers/anm-nomenclature";
import { importAnsvsaRecalls } from "@/importers/ansvsa";
import { withImportLock } from "@/lib/import-lock";

const command = process.argv[2];
const options = { dryRun: process.argv.includes("--dry-run"), force: process.argv.includes("--force") };

async function run() {
  const jobs = command === "all" ? ["nomenclature", "discontinuities", "ansvsa"] : [command];
  for (const job of jobs) {
    const result = job === "nomenclature"
      ? await withImportLock("ANM_NOMENCLATURE", () => importNomenclature(options))
      : job === "discontinuities"
        ? await withImportLock("ANM_DISCONTINUITY", () => importMedicineDiscontinuities(options))
        : job === "ansvsa"
          ? await withImportLock("ANSVSA", () => importAnsvsaRecalls())
          : null;
    if (!result) throw new Error(job ? `${job} rulează deja` : "Usage: import.ts <nomenclature|discontinuities|ansvsa|all> [--dry-run] [--force]");
    console.log(`[IMPORT:${job}]`, result);
    if (result.status === "FAILED") throw new Error(result.errorMessage || `${job} failed`);
  }
}

run().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
