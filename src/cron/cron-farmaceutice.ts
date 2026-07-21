import { prisma } from "@/lib/db";
import { importNomenclature } from "@/importers/anm-nomenclature";
import { importMedicineDiscontinuities } from "@/importers/anm-discontinuity";
import { withImportLock } from "@/lib/import-lock";

async function main() {
  const nomenclature = await withImportLock("ANM_NOMENCLATURE", () => importNomenclature());
  if (!nomenclature) {
    console.log("[CRON:FARMACEUTICE] Nomenclature already running; skipped");
  } else {
    console.log("[CRON:FARMACEUTICE] Nomenclature", nomenclature);
    if (nomenclature.status === "FAILED") {
      throw new Error(nomenclature.errorMessage || "Nomenclature import failed");
    }
  }

  const discontinuities = await withImportLock("ANM_DISCONTINUITY", () => importMedicineDiscontinuities());
  if (!discontinuities) {
    console.log("[CRON:FARMACEUTICE] Discontinuity import already running; skipped");
    return;
  }
  console.log("[CRON:FARMACEUTICE] Discontinuities", discontinuities);
  if (discontinuities.status === "FAILED") throw new Error(discontinuities.errorMessage || "Discontinuity import failed");
}

main()
  .catch((error) => { console.error("[CRON:FARMACEUTICE]", error); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
