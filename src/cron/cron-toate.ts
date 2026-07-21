import { spawnSync } from "node:child_process";

async function main() {
  console.log("[CRON:TOATE] Running all cron jobs...");

  const jobs = [
    { name: "farmaceutice", command: "npm run cron:farmaceutice" },
    { name: "produse-generale", command: "npm run cron:produse-generale" },
  ];

  let failed = false;
  for (const job of jobs) {
    console.log(`[CRON:TOATE] Running ${job.name}...`);
    const result = spawnSync(job.command, {
      shell: true,
      stdio: "inherit",
      env: process.env,
    });

    if (result.status !== 0) {
      console.error(`[CRON:TOATE] ${job.name} failed with exit code ${result.status}`);
      failed = true;
    }
  }

  console.log("[CRON:TOATE] All jobs completed.");
  process.exit(failed ? 1 : 0);
}

main();
