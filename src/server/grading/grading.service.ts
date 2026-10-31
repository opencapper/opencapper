import { getDb } from "@/lib/db/server/client";
import {
  pickDisqualifications,
  pickResultChanges,
  pickSettlements,
  pickSources,
  picks,
  type DisqualifySource,
  type Pick,
  type VoidReason,
} from "@/lib/db/schema/server";
import type { PickResult } from "@/lib/api/typebox/picks";
import { dayjs } from "@/lib/utils/format/date";
import {
  bookmakerRank,
  fetchEventOdds,
  fetchScores,
  formatLine,
  type EventOdds,
  type EventScore,
} from "@/server/odds/odds.service";
import { normalise } from "@/server/odds/selection";
import { finalScore, settle, type FinalScore } from "@/server/grading/settle";
import { EXCHANGE_BOOKMAKER } from "@/lib/api/typebox/sources";
import {
  fetchMarkets,
  marketPrices,
  marketStart,
  resolveOutcome,
  type PolymarketMarket,
} from "@/server/polymarket/polymarket.api";
import {
  and,
  count,
  eq,
  gt,
  isNotNull,
  isNull,
  lt,
  lte,
  ne,
  or,
} from "drizzle-orm";

const GRADE_AFTER_HOURS = 3;
// The scores endpoint reaches this far back; older games are only found again when the feed moved them.
const SCORES_DAYS_FROM = 3;
// Past the scores window a pick is overdue: its sport is polled this often, and each poll logs it.
const OVERDUE_RETRY_HOURS = 6;
// Bookmakers void a game moved this much later than scheduled.
const POSTPONED_AFTER_HOURS = 48;
// No score and no postponement after this long: void as a timeout, flagged for staff.
const VOID_TIMEOUT_DAYS = 30;
const CLOSING_WINDOW_MINUTES = 15;
// Exchange markets stay open through postponements, so they get longer before a void.
const EXCHANGE_VOID_AFTER_DAYS = 14;
// A market that resolves before the stored start means the game was earlier: grade it and check its fills.
const EXCHANGE_LOOKAHEAD_HOURS = 24;

const lastScoresPoll = new Map<string, number>();

function groupBy<T>(items: readonly T[], key: (item: T) => string) {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    groups.set(k, [...(groups.get(k) ?? []), item]);
  }
  return groups;
}

async function recordResult(
  pickId: number,
  result: PickResult,
  score: FinalScore | null,
  gradedAt: Date,
  voidReason: VoidReason | null = null,
) {
  const values = {
    result,
    homeScore: score?.home ?? null,
    awayScore: score?.away ?? null,
    gradedAt,
    voidReason,
  };
  await getDb().transaction(async (tx) => {
    const updated = await tx
      .update(picks)
      .set({ result })
      .where(and(eq(picks.id, pickId), eq(picks.result, "pending")))
      .returning({ id: picks.id });
    if (updated.length === 0) return;
    await tx
      .insert(pickSettlements)
      .values({ pickId, ...values })
      .onConflictDoUpdate({ target: pickSettlements.pickId, set: values });
  });
}

// The only way to change a final result: the picks trigger needs the audit row from the same transaction.
export async function correctResult(input: {
  pickId: number;
  to: PickResult;
  reason: string;
  actor: string;
}): Promise<{ from: PickResult; to: PickResult } | null> {
  return getDb().transaction(async (tx) => {
    const [row] = await tx
      .select({ result: picks.result })
      .from(picks)
      .where(eq(picks.id, input.pickId))
      .for("update");
    if (!row || row.result === input.to) return null;
    await tx.insert(pickResultChanges).values({
      pickId: input.pickId,
      fromResult: row.result,
      toResult: input.to,
      reason: input.reason,
      actor: input.actor,
    });
    await tx
      .update(picks)
      .set({ result: input.to })
      .where(eq(picks.id, input.pickId));
    await tx
      .update(pickSettlements)
      .set({
        result: input.to,
        ...(input.to === "void" ? {} : { voidReason: null }),
      })
      .where(eq(pickSettlements.pickId, input.pickId));
    console.warn(
      JSON.stringify({
        event: "pick_result_corrected",
        pickId: input.pickId,
        from: row.result,
        to: input.to,
        reason: input.reason,
        actor: input.actor,
      }),
    );
    return { from: row.result, to: input.to };
  });
}

// A pick locked at or after the real start leaves every record; the row stays and only this flag is added.
export async function disqualifyPick(input: {
  pickId: number;
  actualStart: Date;
  detectedBy: DisqualifySource;
  evidence: Record<string, string | number | null>;
}): Promise<boolean> {
  const inserted = await getDb()
    .insert(pickDisqualifications)
    .values({
      pickId: input.pickId,
      actualStart: input.actualStart,
      detectedBy: input.detectedBy,
      evidence: JSON.stringify(input.evidence),
    })
    .onConflictDoNothing()
    .returning({ pickId: pickDisqualifications.pickId });
  if (inserted.length > 0)
    console.warn(
      JSON.stringify({
        event: "pick_disqualified",
        pickId: input.pickId,
        actualStart: dayjs(input.actualStart).toISOString(),
        detectedBy: input.detectedBy,
        evidence: input.evidence,
      }),
    );
  return inserted.length > 0;
}

async function checkStart(
  pick: Pick,
  actualStart: Date | null,
  source: string,
  fillAt: Date | null = null,
) {
  if (!actualStart) return;
  const lockedAt = fillAt && fillAt > pick.createdAt ? fillAt : pick.createdAt;
  if (dayjs(lockedAt).isBefore(actualStart)) return;
  await disqualifyPick({
    pickId: pick.id,
    actualStart,
    detectedBy: "grading",
    evidence: {
      source,
      storedCommence: dayjs(pick.commenceTime).toISOString(),
      createdAt: dayjs(pick.createdAt).toISOString(),
      fillAt: fillAt ? dayjs(fillAt).toISOString() : null,
    },
  });
}

function gradingLog(
  level: "warn" | "error",
  event: string,
  pick: Pick,
  extra: Record<string, string | number | null> = {},
) {
  const line = JSON.stringify({
    event,
    pickId: pick.id,
    sportKey: pick.sportKey,
    eventId: pick.eventId,
    commenceTime: dayjs(pick.commenceTime).toISOString(),
    ...extra,
  });
  if (level === "error") console.error(line);
  else console.warn(line);
}

export async function gradePendingPicks(
  now = dayjs(),
  loadScores: (sportKey: string) => Promise<EventScore[]> = fetchScores,
): Promise<number> {
  const pending = await getDb()
    .select()
    .from(picks)
    .where(
      and(
        eq(picks.result, "pending"),
        ne(picks.bookmaker, EXCHANGE_BOOKMAKER),
        lte(
          picks.commenceTime,
          now.subtract(GRADE_AFTER_HOURS, "hour").toDate(),
        ),
      ),
    );
  const scoresFrom = now.subtract(SCORES_DAYS_FROM, "day");
  const timeoutBefore = now.subtract(VOID_TIMEOUT_DAYS, "day");

  let graded = 0;
  for (const [sportKey, sportPicks] of groupBy(pending, (p) => p.sportKey)) {
    const recent = sportPicks.some((p) =>
      dayjs(p.commenceTime).isAfter(scoresFrom),
    );
    const lastPoll = lastScoresPoll.get(sportKey) ?? 0;
    if (!recent && now.valueOf() - lastPoll < OVERDUE_RETRY_HOURS * 60 * 60_000)
      continue;
    lastScoresPoll.set(sportKey, now.valueOf());

    const events = new Map<string, EventScore>();
    try {
      for (const event of await loadScores(sportKey))
        events.set(event.id, event);
    } catch (error) {
      console.error(`grading: scores for ${sportKey} failed`, error);
      continue;
    }

    for (const pick of sportPicks) {
      const event = events.get(pick.eventId);
      if (event)
        await checkStart(pick, dayjs(event.commence_time).toDate(), "scores");
      const score = event ? finalScore(event) : null;
      const result = event && score ? settle(pick, event, score) : null;
      if (result) {
        await recordResult(pick.id, result, score, now.toDate());
        graded++;
        continue;
      }
      if (event && score)
        gradingLog("error", "grading_unsettled", pick, {
          home: event.home_team,
          away: event.away_team,
          selection: pick.selection,
        });
      const movedHours = event
        ? dayjs(event.commence_time).diff(pick.commenceTime, "hour", true)
        : 0;
      if (event && !event.completed && movedHours >= POSTPONED_AFTER_HOURS) {
        gradingLog("warn", "grading_void_postponed", pick, {
          newCommence: event.commence_time,
        });
        await recordResult(pick.id, "void", null, now.toDate(), "postponed");
        graded++;
      } else if (dayjs(pick.commenceTime).isBefore(timeoutBefore)) {
        gradingLog("error", "grading_void_timeout", pick, {
          days: VOID_TIMEOUT_DAYS,
        });
        await recordResult(pick.id, "void", null, now.toDate(), "timeout");
        graded++;
      } else if (!dayjs(pick.commenceTime).isAfter(scoresFrom)) {
        gradingLog("warn", "grading_overdue", pick, {
          inFeed: event ? 1 : 0,
          retryHours: OVERDUE_RETRY_HOURS,
        });
      }
    }
  }
  return graded;
}

export async function gradingBacklog(now = dayjs()) {
  const db = getDb();
  const overdueBefore = now.subtract(SCORES_DAYS_FROM, "day").toDate();
  const exchangeOverdueBefore = now.subtract(1, "day").toDate();
  const [overdue] = await db
    .select({ count: count() })
    .from(picks)
    .where(
      and(
        eq(picks.result, "pending"),
        or(
          and(
            ne(picks.bookmaker, EXCHANGE_BOOKMAKER),
            lt(picks.commenceTime, overdueBefore),
          ),
          and(
            eq(picks.bookmaker, EXCHANGE_BOOKMAKER),
            lt(picks.commenceTime, exchangeOverdueBefore),
          ),
        ),
      ),
    );
  const [timedOut] = await db
    .select({ count: count() })
    .from(pickSettlements)
    .where(eq(pickSettlements.voidReason, "timeout"));
  const [disqualified] = await db
    .select({ count: count() })
    .from(pickDisqualifications);
  return {
    overdue: overdue?.count ?? 0,
    timedOut: timedOut?.count ?? 0,
    disqualified: disqualified?.count ?? 0,
  };
}

function closingPrice(event: EventOdds, pick: Pick) {
  const wanted = normalise(pick.selection);
  const offers = event.bookmakers
    .flatMap((bookmaker) => {
      const outcome = bookmaker.markets
        .find((m) => m.key === pick.market)
        ?.outcomes.find(
          (o) => normalise(formatLine(o.name, o.point)) === wanted,
        );
      return outcome
        ? [{ bookmaker: bookmaker.key, price: outcome.price }]
        : [];
    })
    .toSorted(
      (a, b) => bookmakerRank(a.bookmaker) - bookmakerRank(b.bookmaker),
    );
  return offers[0] ?? null;
}

export async function captureClosingLines(
  now = dayjs(),
  loadOdds: typeof fetchEventOdds = fetchEventOdds,
): Promise<number> {
  const due = await getDb()
    .select({ pick: picks })
    .from(picks)
    .leftJoin(pickSettlements, eq(pickSettlements.pickId, picks.id))
    .where(
      and(
        eq(picks.result, "pending"),
        ne(picks.bookmaker, EXCHANGE_BOOKMAKER),
        gt(picks.commenceTime, now.toDate()),
        lte(
          picks.commenceTime,
          now.add(CLOSING_WINDOW_MINUTES, "minute").toDate(),
        ),
        isNull(pickSettlements.closingCapturedAt),
      ),
    );

  let captured = 0;
  const byEvent = groupBy(
    due.map((row) => row.pick),
    (p) => `${p.sportKey}/${p.eventId}`,
  );
  for (const eventPicks of byEvent.values()) {
    const first = eventPicks[0];
    let event: EventOdds;
    try {
      event = await loadOdds({
        sportKey: first.sportKey,
        eventId: first.eventId,
        markets: [...new Set(eventPicks.map((p) => p.market))],
      });
    } catch (error) {
      console.error(`closing: odds for ${first.eventId} failed`, error);
      continue;
    }

    for (const pick of eventPicks) {
      const close = closingPrice(event, pick);
      const values = {
        closingOddsDecimal: close?.price ?? null,
        closingBookmaker: close?.bookmaker ?? null,
        closingCapturedAt: now.toDate(),
        clv: close
          ? Math.round((pick.oddsDecimal / close.price - 1) * 1e6) / 1e6
          : null,
      };
      await getDb()
        .insert(pickSettlements)
        .values({ pickId: pick.id, ...values })
        .onConflictDoUpdate({ target: pickSettlements.pickId, set: values });
      if (close) captured++;
    }
  }
  return captured;
}

async function exchangePicks(where: ReturnType<typeof and>) {
  const rows = await getDb()
    .select({ pick: picks, source: pickSources })
    .from(picks)
    .innerJoin(pickSources, eq(pickSources.pickId, picks.id))
    .leftJoin(pickSettlements, eq(pickSettlements.pickId, picks.id))
    .where(
      and(
        eq(picks.result, "pending"),
        eq(picks.bookmaker, EXCHANGE_BOOKMAKER),
        isNotNull(pickSources.marketRef),
        isNotNull(pickSources.outcomeIndex),
        where,
      ),
    );
  return rows.flatMap((row) =>
    row.source.marketRef !== null && row.source.outcomeIndex !== null
      ? [
          {
            pick: row.pick,
            marketRef: row.source.marketRef,
            outcomeIndex: row.source.outcomeIndex,
            filledAt: row.source.postedAt,
          },
        ]
      : [],
  );
}

// Polymarket priced picks settle on the market's own resolution, free of Odds API credits.
export async function gradeExchangePicks(
  now = dayjs(),
  loadMarkets: typeof fetchMarkets = fetchMarkets,
): Promise<number> {
  const pending = await exchangePicks(
    lte(picks.commenceTime, now.add(EXCHANGE_LOOKAHEAD_HOURS, "hour").toDate()),
  );
  if (pending.length === 0) return 0;
  const markets = new Map<string, PolymarketMarket>();
  for (const market of await loadMarkets(
    pending.map((p) => p.marketRef),
    true,
  ))
    markets.set(market.conditionId, market);

  const voidBefore = now.subtract(EXCHANGE_VOID_AFTER_DAYS, "day");
  let graded = 0;
  for (const entry of pending) {
    const market = markets.get(entry.marketRef);
    if (market)
      await checkStart(
        entry.pick,
        marketStart(market),
        "polymarket",
        entry.filledAt,
      );
    const result = market ? resolveOutcome(market, entry.outcomeIndex) : null;
    if (result) {
      await recordResult(entry.pick.id, result, null, now.toDate());
      graded++;
    } else if (dayjs(entry.pick.commenceTime).isBefore(voidBefore)) {
      gradingLog("error", "grading_void_timeout", entry.pick, {
        days: EXCHANGE_VOID_AFTER_DAYS,
        marketRef: entry.marketRef,
      });
      await recordResult(entry.pick.id, "void", null, now.toDate(), "timeout");
      graded++;
    }
  }
  return graded;
}

export async function captureExchangeClosing(
  now = dayjs(),
  loadMarkets: typeof fetchMarkets = fetchMarkets,
): Promise<number> {
  const due = await exchangePicks(
    and(
      gt(picks.commenceTime, now.toDate()),
      lte(
        picks.commenceTime,
        now.add(CLOSING_WINDOW_MINUTES, "minute").toDate(),
      ),
      isNull(pickSettlements.closingCapturedAt),
    ),
  );
  if (due.length === 0) return 0;
  const markets = new Map<string, PolymarketMarket>();
  for (const market of await loadMarkets(
    due.map((p) => p.marketRef),
    false,
  ))
    markets.set(market.conditionId, market);

  let captured = 0;
  for (const entry of due) {
    const market = markets.get(entry.marketRef);
    const price = market ? marketPrices(market)?.[entry.outcomeIndex] : null;
    const close =
      price && price > 0 && price < 1
        ? Math.round((1 / price) * 1000) / 1000
        : null;
    const values = {
      closingOddsDecimal: close !== null && close > 1 ? close : null,
      closingBookmaker: close !== null && close > 1 ? EXCHANGE_BOOKMAKER : null,
      closingCapturedAt: now.toDate(),
      clv:
        close !== null && close > 1
          ? Math.round((entry.pick.oddsDecimal / close - 1) * 1e6) / 1e6
          : null,
    };
    await getDb()
      .insert(pickSettlements)
      .values({ pickId: entry.pick.id, ...values })
      .onConflictDoUpdate({ target: pickSettlements.pickId, set: values });
    if (values.clv !== null) captured++;
  }
  return captured;
}
