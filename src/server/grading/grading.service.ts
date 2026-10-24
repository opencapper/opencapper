import { getDb } from "@/lib/db/server/client";
import {
  pickSettlements,
  pickSources,
  picks,
  type Pick,
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
  resolveOutcome,
  type PolymarketMarket,
} from "@/server/polymarket/polymarket.api";
import { and, eq, gt, isNotNull, isNull, lte, ne } from "drizzle-orm";

const GRADE_AFTER_HOURS = 3;
const SCORES_DAYS_FROM = 3;
const VOID_AFTER_DAYS = 7;
const CLOSING_WINDOW_MINUTES = 15;
// Exchange markets stay open through postponements, so they get longer before a void.
const EXCHANGE_VOID_AFTER_DAYS = 14;

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
) {
  const values = {
    result,
    homeScore: score?.home ?? null,
    awayScore: score?.away ?? null,
    gradedAt,
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
  const voidBefore = now.subtract(VOID_AFTER_DAYS, "day");

  let graded = 0;
  for (const [sportKey, sportPicks] of groupBy(pending, (p) => p.sportKey)) {
    const events = new Map<string, EventScore>();
    if (sportPicks.some((p) => dayjs(p.commenceTime).isAfter(scoresFrom))) {
      try {
        for (const event of await loadScores(sportKey))
          events.set(event.id, event);
      } catch (error) {
        console.error(`grading: scores for ${sportKey} failed`, error);
        continue;
      }
    }

    for (const pick of sportPicks) {
      const event = events.get(pick.eventId);
      const score = event ? finalScore(event) : null;
      const result = event && score ? settle(pick, event, score) : null;
      if (result) {
        await recordResult(pick.id, result, score, now.toDate());
        graded++;
      } else if (dayjs(pick.commenceTime).isBefore(voidBefore)) {
        await recordResult(pick.id, "void", null, now.toDate());
        graded++;
      }
    }
  }
  return graded;
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
  const pending = await exchangePicks(lte(picks.commenceTime, now.toDate()));
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
    const result = market ? resolveOutcome(market, entry.outcomeIndex) : null;
    if (result) {
      await recordResult(entry.pick.id, result, null, now.toDate());
      graded++;
    } else if (dayjs(entry.pick.commenceTime).isBefore(voidBefore)) {
      await recordResult(entry.pick.id, "void", null, now.toDate());
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
