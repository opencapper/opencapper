import { PICK_LEAGUE_KEYS, type PickLeagueKey } from "@/lib/config/sports";
import type { ApiBoard, ApiMoneyline } from "@/lib/types";
import { dayjs } from "@/lib/utils/format/date";
import { serverEnv } from "@/server/env";
import {
  bookmakerRank,
  fetchActiveSports,
  fetchSportOdds,
  listEvents,
  type EventOdds,
} from "@/server/odds/odds.service";
import { isLookupPending } from "@/server/participants/participants.service";
import { toAmericanOdds } from "@/server/picks/picks.mapper";

// h2h over us,eu: 1 market times 2 regions.
const CREDITS_PER_REFRESH = 2;
const PRICES_TTL_MS = 15 * 60_000;
const FAILED_TTL_MS = 60_000;
const LEAGUES_TTL_MS = 6 * 60 * 60_000;

type Prices = { pricedAt: string; byEvent: Map<string, ApiMoneyline> };
type PriceSlot = { expires: number; prices: Promise<Prices | null> };

const priceCache = new Map<string, PriceSlot>();
const budget = { day: "", used: 0 };

function creditsLeft(): number {
  const day = dayjs.utc().format("YYYY-MM-DD");
  if (budget.day !== day) {
    budget.day = day;
    budget.used = 0;
  }
  return serverEnv.boardOddsCreditsPerDay - budget.used;
}

function moneyline(event: EventOdds): ApiMoneyline | null {
  const offer = event.bookmakers
    .flatMap((bookmaker) => {
      const outcomes = bookmaker.markets.find((m) => m.key === "h2h")?.outcomes;
      const home = outcomes?.find((o) => o.name === event.home_team);
      const away = outcomes?.find((o) => o.name === event.away_team);
      return home && away
        ? [{ bookmaker: bookmaker.key, home: home.price, away: away.price }]
        : [];
    })
    .toSorted(
      (a, b) => bookmakerRank(a.bookmaker) - bookmakerRank(b.bookmaker),
    )[0];
  if (!offer) return null;
  return {
    bookmaker: offer.bookmaker,
    home: toAmericanOdds(offer.home),
    away: toAmericanOdds(offer.away),
  };
}

async function loadPrices(sportKey: string): Promise<Prices> {
  const events = await fetchSportOdds({ sportKey, markets: ["h2h"] });
  const byEvent = new Map<string, ApiMoneyline>();
  for (const event of events) {
    const line = moneyline(event);
    if (line) byEvent.set(event.id, line);
  }
  return { pricedAt: dayjs().toISOString(), byEvent };
}

// Past the budget the last prices stay up (shown with their age) rather than the board going blank.
function boardPrices(sportKey: string): Promise<Prices | null> {
  const now = Date.now();
  const hit = priceCache.get(sportKey);
  if (hit && hit.expires > now) return hit.prices;
  if (!serverEnv.oddsApiKey || creditsLeft() < CREDITS_PER_REFRESH)
    return hit?.prices ?? Promise.resolve(null);

  budget.used += CREDITS_PER_REFRESH;
  const slot: PriceSlot = {
    expires: now + PRICES_TTL_MS,
    prices: loadPrices(sportKey).catch(() => {
      slot.expires = Date.now() + FAILED_TTL_MS;
      return hit ? hit.prices : null;
    }),
  };
  priceCache.set(sportKey, slot);
  return slot.prices;
}

export async function getBoard(sportKey: PickLeagueKey): Promise<ApiBoard> {
  const [events, prices] = await Promise.all([
    listEvents(sportKey),
    boardPrices(sportKey),
  ]);
  return {
    sportKey,
    events: events.map((event) => ({
      ...event,
      moneyline: prices?.byEvent.get(event.id) ?? null,
    })),
    pricedAt: prices?.pricedAt ?? null,
    imagesPending: events.some(
      (event) =>
        isLookupPending(sportKey, event.home) ||
        isLookupPending(sportKey, event.away),
    ),
  };
}

let leaguesSlot: { expires: number; keys: Promise<PickLeagueKey[]> } | null =
  null;

// In season leagues from the free /sports list; without it every league is offered.
export function getActiveLeagues(): Promise<PickLeagueKey[]> {
  const now = Date.now();
  if (leaguesSlot && leaguesSlot.expires > now) return leaguesSlot.keys;
  if (!serverEnv.oddsApiKey) return Promise.resolve([...PICK_LEAGUE_KEYS]);
  const slot = {
    expires: now + LEAGUES_TTL_MS,
    keys: fetchActiveSports()
      .then((active) => PICK_LEAGUE_KEYS.filter((key) => active.has(key)))
      .catch(() => {
        slot.expires = Date.now() + FAILED_TTL_MS;
        return [...PICK_LEAGUE_KEYS];
      }),
  };
  leaguesSlot = slot;
  return slot.keys;
}
