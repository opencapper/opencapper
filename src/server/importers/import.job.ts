import type { SourcePlatform } from "@/lib/api/typebox/sources";
import type { ImporterRun } from "@/lib/types";
import { dayjs } from "@/lib/utils/format/date";
import { serverEnv } from "@/server/env";
import type { ImportReport } from "@/server/importers/import.shared";
import { backfillPolymarketHistory } from "@/server/importers/polymarket/polymarket.history";
import { importPolymarket } from "@/server/importers/polymarket/polymarket.importer";
import { refreshPolymarketImages } from "@/server/importers/polymarket/polymarket.profiles";
import { importReddit } from "@/server/importers/reddit/reddit.importer";

const TICK_MS = 10 * 60_000;
const IMAGE_REFRESH_MS = 24 * 60 * 60_000;

declare global {
  var importJobStarted: boolean | undefined;
  var importRuns: Partial<Record<SourcePlatform, ImporterRun>> | undefined;
}

// globalThis: the job runs in instrumentation, the admin route reads it from another module copy.
function recordRun(name: SourcePlatform, run: Omit<ImporterRun, "at">) {
  globalThis.importRuns = {
    ...globalThis.importRuns,
    [name]: { ...run, at: dayjs().toISOString() },
  };
}

export function getImportRuns(): Partial<Record<SourcePlatform, ImporterRun>> {
  return globalThis.importRuns ?? {};
}

let running = false;

async function step(name: SourcePlatform, run: () => Promise<ImportReport>) {
  try {
    const report = await run();
    recordRun(name, {
      created: report.created.length,
      skipped: report.skipped.length,
      credits: report.creditsSpent,
      failed: false,
    });
    if (report.created.length > 0 || report.creditsSpent > 0)
      console.info(
        `import ${name}: ${report.created.length} picks, ${report.skipped.length} skipped, ${report.creditsSpent} credits`,
      );
  } catch (error) {
    recordRun(name, { created: 0, skipped: 0, credits: 0, failed: true });
    console.error(`import ${name} failed`, error);
  }
}

async function tick() {
  if (running) return;
  running = true;
  try {
    if (serverEnv.importPolymarketEnabled)
      await step("polymarket", () => importPolymarket());
    if (serverEnv.importRedditEnabled)
      await step("reddit", () => importReddit());
  } finally {
    running = false;
  }
}

async function backfillHistory() {
  const days = serverEnv.importPolymarketHistoryDays;
  if (!serverEnv.importPolymarketEnabled || days === 0) return;
  try {
    const reports = await backfillPolymarketHistory({ days });
    const created = reports.reduce((sum, r) => sum + r.created, 0);
    console.info(
      `import polymarket history: ${created} picks over ${days} days from ${reports.length} traders`,
    );
  } catch (error) {
    console.error("import polymarket history failed", error);
  }
}

async function refreshImages() {
  if (!serverEnv.importPolymarketEnabled) return;
  try {
    await refreshPolymarketImages();
  } catch (error) {
    console.error("import polymarket images failed", error);
  }
}

export function startImportJob() {
  if (
    globalThis.importJobStarted ||
    (!serverEnv.importPolymarketEnabled && !serverEnv.importRedditEnabled)
  )
    return;
  globalThis.importJobStarted = true;
  setInterval(() => void tick(), TICK_MS).unref();
  setInterval(() => void refreshImages(), IMAGE_REFRESH_MS).unref();
  void refreshImages();
  void tick().then(backfillHistory);
}
