export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || !process.env.DATABASE_URL)
    return;
  const { runMigrations } = await import("@/lib/db/server/migrate");
  await runMigrations();
  const { startGradingJob } = await import("@/server/grading/grading.job");
  startGradingJob();
  const { startImportJob } = await import("@/server/importers/import.job");
  startImportJob();
  const { startLogAnchoring } = await import("@/server/log/anchor.service");
  startLogAnchoring();
}
