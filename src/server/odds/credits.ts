import { dayjs } from "@/lib/utils/format/date";
import type { OddsCredits } from "@/lib/types";
import { ApiError } from "@/server/errors";
import { serverEnv } from "@/server/env";

// A remaining count older than this is treated as unknown, so a refilled key is not refused forever.
const CREDITS_STALE_HOURS = 6;

declare global {
  var oddsApiCredits: OddsCredits | undefined;
}

function headerNumber(res: Response, name: string): number | null {
  const raw = res.headers.get(name);
  const n = Number(raw);
  return raw !== null && Number.isFinite(n) ? n : null;
}

// globalThis: the grading job (instrumentation) and the routes load separate module copies.
export function recordCredits(res: Response) {
  const remaining = headerNumber(res, "x-requests-remaining");
  if (remaining === null) return;
  globalThis.oddsApiCredits = {
    remaining,
    used: headerNumber(res, "x-requests-used"),
    updatedAt: dayjs().toISOString(),
  };
}

export function getOddsCredits(): OddsCredits {
  return (
    globalThis.oddsApiCredits ?? {
      remaining: null,
      used: null,
      updatedAt: null,
    }
  );
}

function knownRemaining(): number | null {
  const credits = getOddsCredits();
  if (credits.remaining === null || credits.updatedAt === null) return null;
  const fresh = dayjs().diff(credits.updatedAt, "hour", true);
  return fresh < CREDITS_STALE_HOURS ? credits.remaining : null;
}

export function belowReserve(): boolean {
  const remaining = knownRemaining();
  return remaining !== null && remaining < serverEnv.oddsCreditsReserve;
}

export function oddsKeyEmpty(): boolean {
  const remaining = knownRemaining();
  return remaining !== null && remaining <= 0;
}

const userBudget = { day: "", used: 0 };

function userCreditsUsed(): number {
  const day = dayjs.utc().format("YYYY-MM-DD");
  if (userBudget.day !== day) {
    userBudget.day = day;
    userBudget.used = 0;
  }
  return userBudget.used;
}

export function getUserBudget() {
  return {
    used: userCreditsUsed(),
    limit: serverEnv.userOddsCreditsPerDay,
    reserve: serverEnv.oddsCreditsReserve,
  };
}

// Charged before the paid call: a burst across many accounts cannot overshoot the daily limit.
export function spendUserCredits(credits: number) {
  if (belowReserve()) throw new ApiError(503, "ERRORS.ODDS_RESERVE");
  if (userCreditsUsed() + credits > serverEnv.userOddsCreditsPerDay)
    throw new ApiError(429, "ERRORS.ODDS_DAILY_LIMIT");
  userBudget.used += credits;
}
