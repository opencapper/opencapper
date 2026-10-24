import { serverEnv } from "@/server/env";
import type { ImportReport } from "@/server/importers/import.shared";
import { backfillPolymarketHistory } from "@/server/importers/polymarket/polymarket.history";
import { importPolymarket } from "@/server/importers/polymarket/polymarket.importer";
import { importReddit } from "@/server/importers/reddit/reddit.importer";

const TICK_MS = 10 * 60_000;

declare global {
  var importJobStarted: boolean | undefined;
}

let running = false;

async function step(name: string, run: () => Promise<ImportReport>) {
  try {
    const report = await run();
    if (report.created.length > 0 || report.creditsSpent > 0)
      console.info(
        `import ${name}: ${report.created.length} picks, ${report.skipped.length} skipped, ${report.creditsSpent} credits`,
      );
  } catch (error) {
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

export function startImportJob() {
  if (
    globalThis.importJobStarted ||
    (!serverEnv.importPolymarketEnabled && !serverEnv.importRedditEnabled)
  )
    return;
  globalThis.importJobStarted = true;
  setInterval(() => void tick(), TICK_MS).unref();
  void tick().then(backfillHistory);
}
