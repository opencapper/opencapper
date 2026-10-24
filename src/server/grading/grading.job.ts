import { serverEnv } from "@/server/env";
import {
  captureClosingLines,
  captureExchangeClosing,
  gradeExchangePicks,
  gradePendingPicks,
} from "@/server/grading/grading.service";

const TICK_MS = 5 * 60_000;
// Scores cost 2 credits per sport per call, so grading runs less often than closing capture.
const GRADE_EVERY_MS = 30 * 60_000;

declare global {
  var gradingJobStarted: boolean | undefined;
}

let running = false;
let lastGradedAt = 0;

async function step(name: string, run: () => Promise<number>) {
  try {
    const count = await run();
    if (count > 0) console.info(`${name}: ${count} picks`);
  } catch (error) {
    console.error(`${name} failed`, error);
  }
}

async function tick() {
  if (running) return;
  running = true;
  try {
    await step("exchange closing", () => captureExchangeClosing());
    await step("exchange grading", () => gradeExchangePicks());
    if (!serverEnv.oddsApiKey) return;
    await step("closing", () => captureClosingLines());
    if (Date.now() - lastGradedAt >= GRADE_EVERY_MS) {
      lastGradedAt = Date.now();
      await step("grading", () => gradePendingPicks());
    }
  } finally {
    running = false;
  }
}

export function startGradingJob() {
  if (!serverEnv.gradingEnabled || globalThis.gradingJobStarted) return;
  globalThis.gradingJobStarted = true;
  setInterval(() => void tick(), TICK_MS).unref();
  void tick();
}
