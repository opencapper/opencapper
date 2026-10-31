import { POLYMARKET_DATA_BASE } from "@/server/constants";
import { serverEnv } from "@/server/env";
import { Type, type Static, type TSchema } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

const TradeSchema = Type.Object({
  proxyWallet: Type.String(),
  side: Type.String(),
  conditionId: Type.String(),
  size: Type.Number(),
  price: Type.Number(),
  timestamp: Type.Number(),
  title: Type.String(),
  eventSlug: Type.String(),
  outcome: Type.String(),
  outcomeIndex: Type.Number(),
  transactionHash: Type.String(),
});

const MarketSchema = Type.Object({
  conditionId: Type.String(),
  question: Type.String(),
  slug: Type.String(),
  outcomes: Type.String(),
  outcomePrices: Type.Optional(Type.String()),
  closed: Type.Optional(Type.Boolean()),
  umaResolutionStatus: Type.Optional(Type.String()),
  sportsMarketType: Type.Optional(Type.String()),
  line: Type.Optional(Type.Number()),
  groupItemTitle: Type.Optional(Type.String()),
  gameStartTime: Type.Optional(Type.String()),
  events: Type.Optional(
    Type.Array(
      Type.Object({
        slug: Type.String(),
        title: Type.String(),
        startTime: Type.Optional(Type.String()),
        live: Type.Optional(Type.Boolean()),
        ended: Type.Optional(Type.Boolean()),
      }),
    ),
  ),
});

const StringList = Type.Array(Type.String());

const ProfileSchema = Type.Object({
  profileImage: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  bio: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

export type PolymarketTrade = Static<typeof TradeSchema>;
export type PolymarketMarket = Static<typeof MarketSchema>;

const MARKETS_PER_REQUEST = 40;
const HISTORY_PAGE = 500;
const HISTORY_MAX_PAGES = 400;
const RATE_LIMIT_RETRIES = 3;

export function pause(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getJson<T extends TSchema>(url: URL, schema: T) {
  const request = () =>
    fetch(url, {
      signal: AbortSignal.timeout(15_000),
      headers: { accept: "application/json" },
    });
  let res = await request();
  for (
    let attempt = 1;
    res.status === 429 && attempt <= RATE_LIMIT_RETRIES;
    attempt++
  ) {
    const wait = Number(res.headers.get("retry-after"));
    await pause(
      Number.isFinite(wait) && wait > 0 ? wait * 1000 : attempt * 10_000,
    );
    res = await request();
  }
  if (!res.ok) throw new Error(`Polymarket ${url.pathname}: ${res.status}`);
  const body: unknown = await res.json();
  if (!Value.Check(schema, body))
    throw new Error(`Polymarket ${url.pathname}: unexpected response`);
  return body;
}

// Taker fills only: maker fills of resting quotes are liquidity provision, not a chosen position.
export function fetchTrades(wallet: string, limit = 500) {
  const url = new URL(`${POLYMARKET_DATA_BASE}/trades`);
  url.searchParams.set("user", wallet);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("takerOnly", "true");
  return getJson(url, Type.Array(TradeSchema));
}

function fetchPublicProfile(wallet: string) {
  const url = new URL(`${serverEnv.polymarketGammaBase}/public-profile`);
  url.searchParams.set("address", wallet);
  return getJson(url, ProfileSchema);
}

export async function fetchProfileImage(wallet: string) {
  return (await fetchPublicProfile(wallet)).profileImage || null;
}

export async function fetchProfileBio(wallet: string) {
  return (await fetchPublicProfile(wallet)).bio ?? "";
}

function tradeKey(trade: PolymarketTrade) {
  return `${trade.transactionHash}:${trade.conditionId}:${trade.outcomeIndex}:${trade.size}:${trade.price}`;
}

// The data API rejects offsets past 10000, so older pages are reached by moving `end` back instead.
export async function fetchBuysSince(
  wallet: string,
  since: number,
  delayMs: number,
): Promise<{ trades: PolymarketTrade[]; complete: boolean }> {
  const seen = new Map<string, PolymarketTrade>();
  let end: number | null = null;
  let offset = 0;
  for (let page = 0; page < HISTORY_MAX_PAGES; page++) {
    if (page > 0) await pause(delayMs);
    const url = new URL(`${POLYMARKET_DATA_BASE}/trades`);
    url.searchParams.set("user", wallet);
    url.searchParams.set("limit", String(HISTORY_PAGE));
    url.searchParams.set("offset", String(offset));
    url.searchParams.set("takerOnly", "true");
    url.searchParams.set("side", "BUY");
    url.searchParams.set("start", String(since));
    if (end !== null) url.searchParams.set("end", String(end));
    const batch = await getJson(url, Type.Array(TradeSchema));
    for (const trade of batch) seen.set(tradeKey(trade), trade);
    if (batch.length < HISTORY_PAGE)
      return { trades: [...seen.values()], complete: true };
    const oldest = Math.min(...batch.map((trade) => trade.timestamp));
    if (oldest < since) return { trades: [...seen.values()], complete: true };
    if (end !== null && oldest + 1 >= end) offset += HISTORY_PAGE;
    else {
      end = oldest + 1;
      offset = 0;
    }
  }
  return { trades: [...seen.values()], complete: false };
}

export async function fetchMarkets(
  conditionIds: readonly string[],
  closed: boolean,
  delayMs = 0,
): Promise<PolymarketMarket[]> {
  const ids = [...new Set(conditionIds)];
  const out: PolymarketMarket[] = [];
  for (let i = 0; i < ids.length; i += MARKETS_PER_REQUEST) {
    if (i > 0 && delayMs > 0) await pause(delayMs);
    const url = new URL(`${serverEnv.polymarketGammaBase}/markets`);
    url.searchParams.set("closed", String(closed));
    url.searchParams.set("limit", String(MARKETS_PER_REQUEST));
    for (const id of ids.slice(i, i + MARKETS_PER_REQUEST))
      url.searchParams.append("condition_ids", id);
    out.push(...(await getJson(url, Type.Array(MarketSchema))));
  }
  return out;
}

function parseList(raw: string | undefined): string[] | null {
  if (raw === undefined) return null;
  try {
    const value: unknown = JSON.parse(raw);
    return Value.Check(StringList, value) ? value : null;
  } catch {
    return null;
  }
}

export function marketOutcomes(market: PolymarketMarket): string[] {
  return parseList(market.outcomes) ?? [];
}

export function marketPrices(market: PolymarketMarket): number[] | null {
  const prices = parseList(market.outcomePrices)?.map(Number);
  return prices && prices.every(Number.isFinite) ? prices : null;
}

function parseStart(raw: string | undefined): Date | null {
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

// Gamma writes "2026-10-24 02:00:00+00" on markets and ISO on events; the two drift apart when a game moves, the earlier one wins.
export function marketStart(market: PolymarketMarket): Date | null {
  const starts = [
    parseStart(market.events?.[0]?.startTime),
    parseStart(
      market.gameStartTime?.replace(" ", "T").replace(/([+-]\d{2})$/, "$1:00"),
    ),
  ].filter((date) => date !== null);
  if (starts.length === 0) return null;
  return new Date(Math.min(...starts.map((date) => date.getTime())));
}

// Gamma flags a game in play or over, whatever start time it still shows.
export function marketStarted(market: PolymarketMarket): boolean {
  const event = market.events?.[0];
  return Boolean(event?.live || event?.ended);
}

export type MarketResolution = "win" | "loss" | "split";

export function resolveOutcome(
  market: PolymarketMarket,
  outcomeIndex: number,
): MarketResolution | null {
  if (!market.closed || market.umaResolutionStatus !== "resolved") return null;
  const price = marketPrices(market)?.[outcomeIndex];
  if (price === 1) return "win";
  if (price === 0) return "loss";
  if (price === 0.5) return "split";
  return null;
}
