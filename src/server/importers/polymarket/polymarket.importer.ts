import { getDb } from "@/lib/db/server/client";
import { pickSources } from "@/lib/db/schema/server";
import type { PickMarket } from "@/lib/api/typebox/picks";
import { dayjs, type Dayjs } from "@/lib/utils/format/date";
import { ApiError } from "@/server/errors";
import { EXCHANGE_BOOKMAKER } from "@/lib/api/typebox/sources";
import { POLYGONSCAN_TX, POLYMARKET_SITE } from "@/server/constants";
import {
  createCycle,
  emptyReport,
  findEvent,
  SOURCE_MAX_AGE_HOURS,
  teamMatches,
  toUnits,
  type ImportCycle,
  type ImportReport,
} from "@/server/importers/import.shared";
import {
  POLYMARKET_LEAGUES,
  type PolymarketLeague,
} from "@/server/importers/polymarket/leagues";
import {
  POLYMARKET_TRADERS,
  type PolymarketTrader,
} from "@/server/importers/polymarket/traders";
import {
  fetchMarkets,
  fetchTrades,
  marketOutcomes,
  marketStart,
  type PolymarketMarket,
  type PolymarketTrade,
} from "@/server/polymarket/polymarket.api";
import { createPick, type CreatePickInput } from "@/server/picks/picks.service";
import { hiddenHandles } from "@/server/users/hidden";
import { and, eq, inArray } from "drizzle-orm";

// 1 unit is the trader's median taker fill (USDC) over this window.
const UNIT_WINDOW_DAYS = 30;

type Candidate = {
  trader: PolymarketTrader;
  first: PolymarketTrade;
  notional: number;
  fills: number;
  unit: number;
};

export type MappedMarket = {
  league: PolymarketLeague;
  market: PickMarket;
  outcome: string;
  point: number | null;
  home: string;
  away: string;
  start: Date;
};

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = values.toSorted((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Extra lines of a game live in a sibling event "<game>-more-markets".
export function gameSlug(eventSlug: string) {
  return eventSlug.replace(/-more-markets$/, "");
}

export function notionalOf(trade: PolymarketTrade) {
  return trade.size * trade.price;
}

// "UFC Fight Night: A vs. B (Lightweight)" and "A vs. B - More Markets" both give [A, B].
function titleSides(title: string): [string, string] | null {
  const core = title
    .replace(/^[^:]*:\s*/, (prefix) => (/ vs\.? /i.test(prefix) ? prefix : ""))
    .replace(/\s*\([^)]*\)\s*$/, "")
    .replace(/\s+-\s+.*$/, "");
  const parts = core.split(/\s+vs\.?\s+/i);
  return parts.length === 2 && parts[0] && parts[1]
    ? [parts[0].trim(), parts[1].trim()]
    : null;
}

export function mapMarket(
  market: PolymarketMarket,
  outcomeIndex: number,
): MappedMarket | string {
  const event = market.events?.[0];
  const code = (event?.slug ?? market.slug).split("-")[0];
  const league = POLYMARKET_LEAGUES[code];
  if (!league) return `league ${code} not imported`;
  const start = marketStart(market);
  if (!start) return "no start time";
  const sides = titleSides(event?.title ?? market.question);
  if (!sides) return "no matchup in title";
  const [first, second] = sides;
  const home = league.ordering === "home" ? first : second;
  const away = league.ordering === "home" ? second : first;
  const outcomes = marketOutcomes(market);
  const name = outcomes[outcomeIndex];
  if (!name) return "unknown outcome";
  const base = { league, home, away, start };

  if (market.sportsMarketType === "moneyline") {
    const yesNo = outcomes.length === 2 && outcomes[0] === "Yes";
    if (!yesNo) return { ...base, market: "h2h", outcome: name, point: null };
    // Three way soccer markets are one Yes/No market per result; only "Yes" is a plain moneyline.
    if (outcomeIndex !== 0) return "No side of a three way market";
    const label = market.groupItemTitle ?? "";
    const outcome = label.startsWith("Draw") ? "Draw" : label;
    return outcome
      ? { ...base, market: "h2h", outcome, point: null }
      : "unknown three way side";
  }
  if (market.sportsMarketType === "spreads" && market.line !== undefined) {
    if (outcomes.length !== 2) return "unexpected spread outcomes";
    const point = outcomeIndex === 0 ? market.line : -market.line;
    return { ...base, market: "spreads", outcome: name, point };
  }
  if (market.sportsMarketType === "totals" && market.line !== undefined) {
    if (!/^(over|under)$/i.test(name)) return "unexpected total outcome";
    return { ...base, market: "totals", outcome: name, point: market.line };
  }
  return `market type ${market.sportsMarketType ?? "unknown"} not imported`;
}

function candidatesFor(
  trader: PolymarketTrader,
  trades: PolymarketTrade[],
  now: Dayjs,
): Candidate[] {
  const buys = trades.filter((t) => t.side === "BUY");
  const unitFrom = now.subtract(UNIT_WINDOW_DAYS, "day").unix();
  const unit = median(
    buys.filter((t) => t.timestamp >= unitFrom).map(notionalOf),
  );
  const freshFrom = now.subtract(SOURCE_MAX_AGE_HOURS, "hour").unix();
  const byMarket = new Map<string, PolymarketTrade[]>();
  for (const trade of buys.filter((t) => t.timestamp >= freshFrom))
    byMarket.set(trade.conditionId, [
      ...(byMarket.get(trade.conditionId) ?? []),
      trade,
    ]);

  // First side bought per market; a later hedge on the other side is not a new pick.
  return [...byMarket.values()].map((fills) => {
    const ordered = fills.toSorted((a, b) => a.timestamp - b.timestamp);
    const first = ordered[0];
    const same = ordered.filter((t) => t.outcomeIndex === first.outcomeIndex);
    const notional = same.reduce((sum, t) => sum + notionalOf(t), 0);
    return {
      trader,
      first,
      notional,
      fills: same.length,
      unit: unit ?? notional,
    };
  });
}

async function alreadyImported(ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  const rows = await getDb()
    .select({ externalId: pickSources.externalId })
    .from(pickSources)
    .where(
      and(
        eq(pickSources.platform, "polymarket"),
        inArray(pickSources.externalId, ids),
      ),
    );
  return new Set(rows.map((r) => r.externalId));
}

async function oddsApiInput(
  cycle: ImportCycle,
  mapped: MappedMarket,
): Promise<Pick<CreatePickInput, "sportKey" | "eventId" | "selection"> | null> {
  if (!mapped.league.oddsApi || mapped.market !== "h2h" || !cycle.hasBudget())
    return null;
  const event = await findEvent(cycle, {
    sportKey: mapped.league.sportKey,
    teams: [mapped.home, mapped.away],
    start: mapped.start,
  });
  if (!event || !cycle.canSpend(mapped.league.sportKey, event.id)) return null;
  const selection =
    mapped.outcome === "Draw"
      ? "Draw"
      : [event.home, event.away].find((team) =>
          teamMatches(mapped.outcome, team),
        );
  return selection
    ? { sportKey: mapped.league.sportKey, eventId: event.id, selection }
    : null;
}

export function round(value: number, digits: number) {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

async function importCandidate(
  cycle: ImportCycle,
  candidate: Candidate,
  mapped: MappedMarket,
  externalId: string,
  now: Dayjs,
): Promise<ImportReport["created"][number]> {
  const filledAt = dayjs.unix(candidate.first.timestamp);
  if (!dayjs(mapped.start).isAfter(now))
    throw new ApiError(409, "ERRORS.EVENT_STARTED");
  if (!filledAt.isBefore(mapped.start))
    throw new ApiError(409, "ERRORS.FILL_AFTER_START");

  const trade = candidate.first;
  const base: Omit<CreatePickInput, "sportKey" | "eventId" | "selection"> = {
    identity: {
      kind: "source",
      platform: "polymarket",
      handle: candidate.trader.wallet,
      displayName: candidate.trader.name,
      url: `${POLYMARKET_SITE}/profile/${candidate.trader.wallet}`,
    },
    guildId: null,
    market: mapped.market,
    units: toUnits(candidate.notional / candidate.unit),
    source: {
      platform: "polymarket",
      externalId,
      url: `${POLYGONSCAN_TX}/${trade.transactionHash}`,
      postedAt: filledAt.toDate(),
      rawText: `BUY ${round(trade.size, 2)} "${trade.outcome}" at ${round(trade.price, 4)} on "${trade.title}" (${candidate.fills} fills, ${round(candidate.notional, 2)} USDC, ${POLYMARKET_SITE}/event/${trade.eventSlug})`,
      marketRef: trade.conditionId,
      outcomeIndex: trade.outcomeIndex,
    },
  };

  const viaOddsApi = await oddsApiInput(cycle, mapped);
  if (viaOddsApi) {
    try {
      return await createPick({
        ...base,
        ...viaOddsApi,
        loadOdds: cycle.loadOdds,
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) throw error;
    }
  }

  return createPick({
    ...base,
    sportKey: mapped.league.sportKey,
    eventId: `pm:${gameSlug(trade.eventSlug)}`,
    selection: mapped.outcome,
    exchangeFill: {
      bookmaker: EXCHANGE_BOOKMAKER,
      home: mapped.home,
      away: mapped.away,
      commenceTime: mapped.start,
      outcome: mapped.outcome,
      point: mapped.point,
      oddsDecimal: round(1 / trade.price, 3),
      filledAt: filledAt.toDate(),
    },
  });
}

export async function importPolymarket(
  options: { now?: Dayjs; traders?: PolymarketTrader[] } = {},
): Promise<ImportReport> {
  const now = options.now ?? dayjs();
  const report = emptyReport();
  const cycle = createCycle(report);

  const hidden = await hiddenHandles("polymarket");
  const candidates: Candidate[] = [];
  for (const trader of (options.traders ?? POLYMARKET_TRADERS).filter(
    (t) => t.enabled && !hidden.has(t.wallet.toLowerCase()),
  )) {
    try {
      candidates.push(
        ...candidatesFor(trader, await fetchTrades(trader.wallet), now),
      );
    } catch (error) {
      report.skipped.push({
        ref: trader.name,
        reason: error instanceof Error ? error.message : "trades failed",
      });
    }
  }

  const markets = new Map<string, PolymarketMarket>();
  for (const market of await fetchMarkets(
    candidates.map((c) => c.first.conditionId),
    false,
  ))
    markets.set(market.conditionId, market);

  // One pick per trader, game and market type: laddering five total lines on one game is one opinion, not five.
  const mappedCandidates = candidates
    .toSorted((a, b) => a.first.timestamp - b.first.timestamp)
    .flatMap((candidate) => {
      const ref = `${candidate.trader.name} ${candidate.first.eventSlug} ${candidate.first.outcome}`;
      const market = markets.get(candidate.first.conditionId);
      const mapped = market
        ? mapMarket(market, candidate.first.outcomeIndex)
        : "market closed or not found";
      if (typeof mapped === "string") {
        report.skipped.push({ ref, reason: mapped });
        return [];
      }
      const externalId = `${candidate.trader.wallet}:${gameSlug(candidate.first.eventSlug)}:${mapped.market}`;
      return [{ ref, candidate, mapped, externalId }];
    });

  const done = await alreadyImported(mappedCandidates.map((c) => c.externalId));
  for (const entry of mappedCandidates) {
    if (done.has(entry.externalId)) continue;
    done.add(entry.externalId);
    try {
      report.created.push(
        await importCandidate(
          cycle,
          entry.candidate,
          entry.mapped,
          entry.externalId,
          now,
        ),
      );
    } catch (error) {
      report.skipped.push({
        ref: entry.ref,
        reason: error instanceof Error ? error.message : "import failed",
      });
    }
  }
  return report;
}
