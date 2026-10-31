import { getDb } from "@/lib/db/server/client";
import { historyPicks, pickSources } from "@/lib/db/schema/server";
import { dayjs, type Dayjs } from "@/lib/utils/format/date";
import { POLYGONSCAN_TX, POLYMARKET_SITE } from "@/server/constants";
import { toUnits } from "@/server/importers/import.shared";
import { formatLine } from "@/server/odds/odds.service";
import {
  gameSlug,
  mapMarket,
  median,
  notionalOf,
  positionOf,
  round,
} from "@/server/importers/polymarket/polymarket.importer";
import {
  POLYMARKET_TRADERS,
  type PolymarketTrader,
} from "@/server/importers/polymarket/traders";
import {
  fetchBuysSince,
  fetchMarkets,
  marketStart,
  pause,
  resolveOutcome,
  type PolymarketMarket,
  type PolymarketTrade,
} from "@/server/polymarket/polymarket.api";
import { hiddenHandles } from "@/server/users/hidden";
import { upsertSourceUser } from "@/server/users/identity.service";
import { and, eq, inArray } from "drizzle-orm";

const POLITE_DELAY_MS = 300;
const INSERT_CHUNK = 500;

export type HistoryTraderReport = {
  name: string;
  trades: number;
  complete: boolean;
  created: number;
  skipped: Record<string, number>;
};

type Row = typeof historyPicks.$inferInsert;

function firstSide(fills: PolymarketTrade[]) {
  const ordered = fills.toSorted((a, b) => a.timestamp - b.timestamp);
  const first = ordered[0];
  return {
    first,
    same: ordered.filter((t) => t.outcomeIndex === first.outcomeIndex),
  };
}

async function knownKeys(ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  const db = getDb();
  const [live, history] = await Promise.all([
    db
      .select({ externalId: pickSources.externalId })
      .from(pickSources)
      .where(
        and(
          eq(pickSources.platform, "polymarket"),
          inArray(pickSources.externalId, ids),
        ),
      ),
    db
      .select({ externalId: historyPicks.externalId })
      .from(historyPicks)
      .where(
        and(
          eq(historyPicks.platform, "polymarket"),
          inArray(historyPicks.externalId, ids),
        ),
      ),
  ]);
  return new Set([...live, ...history].map((r) => r.externalId));
}

function rowsFor(
  trader: PolymarketTrader,
  buys: PolymarketTrade[],
  markets: Map<string, PolymarketMarket>,
  now: Dayjs,
  skip: (reason: string) => void,
): Omit<Row, "userId">[] {
  // 1 unit is the trader's median taker fill over the backfill window.
  const unit = median(buys.map(notionalOf));
  const byMarket = new Map<string, PolymarketTrade[]>();
  for (const trade of buys)
    byMarket.set(trade.conditionId, [
      ...(byMarket.get(trade.conditionId) ?? []),
      trade,
    ]);

  const rows: Omit<Row, "userId">[] = [];
  for (const [conditionId, fills] of byMarket) {
    const market = markets.get(conditionId);
    if (!market) {
      skip("market not resolved or not found");
      continue;
    }
    const start = marketStart(market);
    if (!start) {
      skip("no start time");
      continue;
    }
    const before = fills.filter((t) => t.timestamp < dayjs(start).unix());
    if (before.length === 0) {
      skip("bought after the start");
      continue;
    }
    const side = firstSide(before);
    const mapped = mapMarket(market, side.first.outcomeIndex);
    if (typeof mapped === "string") {
      skip(mapped);
      continue;
    }
    const result = resolveOutcome(market, side.first.outcomeIndex);
    if (!result) {
      skip("market not resolved");
      continue;
    }
    const position = positionOf(side.same);
    const oddsDecimal = round(1 / position.price, 3);
    if (!(oddsDecimal > 1)) {
      skip("price at or above 1");
      continue;
    }
    rows.push({
      platform: "polymarket",
      externalId: `${trader.wallet}:${gameSlug(side.first.eventSlug)}:${mapped.market}`,
      txHash: side.first.transactionHash,
      url: `${POLYGONSCAN_TX}/${side.first.transactionHash}`,
      tradedAt: dayjs.unix(side.first.timestamp).toDate(),
      commenceTime: mapped.start,
      sportKey: mapped.league.sportKey,
      eventSlug: gameSlug(side.first.eventSlug),
      home: mapped.home,
      away: mapped.away,
      market: mapped.market,
      selection: formatLine(mapped.outcome, mapped.point ?? undefined),
      point: mapped.point,
      oddsDecimal,
      units: toUnits(position.notional / (unit ?? position.notional)),
      marketRef: conditionId,
      outcomeIndex: side.first.outcomeIndex,
      result,
      gradedAt: now.toDate(),
    });
  }
  // One pick per trader, game and market type, the earliest one wins.
  const byKey = new Map<string, Omit<Row, "userId">>();
  for (const row of rows.toSorted(
    (a, b) => a.tradedAt.getTime() - b.tradedAt.getTime(),
  )) {
    if (byKey.has(row.externalId)) skip("second line on the same game");
    else byKey.set(row.externalId, row);
  }
  return [...byKey.values()];
}

// History, not live logging: resolved pre start trades go to `history_picks`, never `picks` or `pick_log`.
export async function backfillPolymarketHistory(options: {
  days: number;
  now?: Dayjs;
  traders?: PolymarketTrader[];
  delayMs?: number;
}): Promise<HistoryTraderReport[]> {
  const now = options.now ?? dayjs();
  const delayMs = options.delayMs ?? POLITE_DELAY_MS;
  const since = now.subtract(options.days, "day").unix();
  const reports: HistoryTraderReport[] = [];
  const hidden = await hiddenHandles("polymarket");

  for (const trader of (options.traders ?? POLYMARKET_TRADERS).filter(
    (t) => t.enabled && !hidden.has(t.wallet.toLowerCase()),
  )) {
    const report: HistoryTraderReport = {
      name: trader.name,
      trades: 0,
      complete: true,
      created: 0,
      skipped: {},
    };
    reports.push(report);
    const skip = (reason: string) => {
      report.skipped[reason] = (report.skipped[reason] ?? 0) + 1;
    };
    try {
      const fetched = await fetchBuysSince(trader.wallet, since, delayMs);
      const buys = fetched.trades.filter(
        (t) => t.side === "BUY" && t.timestamp >= since,
      );
      report.trades = buys.length;
      report.complete = fetched.complete;
      if (buys.length === 0) continue;

      await pause(delayMs);
      const markets = new Map<string, PolymarketMarket>();
      for (const market of await fetchMarkets(
        buys.map((t) => t.conditionId),
        true,
        delayMs,
      ))
        markets.set(market.conditionId, market);

      const candidates = rowsFor(trader, buys, markets, now, skip);
      const known = await knownKeys(candidates.map((r) => r.externalId));
      const fresh = candidates.filter((r) => {
        if (known.has(r.externalId)) skip("already imported");
        return !known.has(r.externalId);
      });
      if (fresh.length === 0) continue;

      const user = await upsertSourceUser(getDb(), {
        platform: "polymarket",
        handle: trader.wallet,
        displayName: trader.name,
        url: `${POLYMARKET_SITE}/profile/${trader.wallet}`,
      });
      for (let i = 0; i < fresh.length; i += INSERT_CHUNK) {
        const inserted = await getDb()
          .insert(historyPicks)
          .values(
            fresh
              .slice(i, i + INSERT_CHUNK)
              .map((row) => ({ ...row, userId: user.id })),
          )
          .onConflictDoNothing()
          .returning({ id: historyPicks.id });
        report.created += inserted.length;
      }
    } catch (error) {
      skip(error instanceof Error ? error.message : "history failed");
    }
    await pause(delayMs);
  }
  return reports;
}
