import { DRAW_SELECTION } from "@/lib/config/markets";
import { PICK_LEAGUE_KEYS, type PickLeagueKey } from "@/lib/config/sports";
import type { ApiBoard, ApiEvent } from "@/lib/types";
import { dayjs } from "@/lib/utils/format/date";
import { serverEnv } from "@/server/env";
import {
  bookmakerRank,
  fetchActiveSports,
  fetchSportOdds,
  listEvents,
  type EventOdds,
} from "@/server/odds/odds.service";
import { belowReserve } from "@/server/odds/credits";
import { saneOutcomes } from "@/server/odds/price";
import { isLookupPending } from "@/server/participants/participants.service";
import { toAmericanOdds } from "@/server/picks/picks.mapper";

// h2h over us,eu: 1 market times 2 regions.
const CREDITS_PER_REFRESH = 2;
const PRICES_TTL_MS = 15 * 60_000;
const FAILED_TTL_MS = 60_000;
const LEAGUES_TTL_MS = 6 * 60 * 60_000;

// Decimal prices of the best ranked bookmaker; `books` counts every bookmaker quoting the game.
type Offer = {
  bookmaker: string;
  home: number;
  away: number;
  draw: number | null;
  books: number;
};
type Prices = { pricedAt: string; byEvent: Map<string, Offer> };
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

export function getBoardBudget() {
  const left = creditsLeft();
  return {
    used: serverEnv.boardOddsCreditsPerDay - left,
    limit: serverEnv.boardOddsCreditsPerDay,
  };
}

function bestOffer(event: EventOdds): Offer | null {
  const offers = event.bookmakers
    .flatMap((bookmaker) => {
      const outcomes = bookmaker.markets.find((m) => m.key === "h2h")?.outcomes;
      const sane = outcomes ? saneOutcomes(bookmaker.key, "h2h", outcomes) : [];
      const price = (name: string) =>
        sane.find((o) => o.name === name)?.price ?? null;
      const home = price(event.home_team);
      const away = price(event.away_team);
      return home !== null && away !== null
        ? [
            {
              bookmaker: bookmaker.key,
              home,
              away,
              draw: price(DRAW_SELECTION),
            },
          ]
        : [];
    })
    .toSorted(
      (a, b) => bookmakerRank(a.bookmaker) - bookmakerRank(b.bookmaker),
    );
  const offer = offers[0];
  return offer ? { ...offer, books: offers.length } : null;
}

async function loadPrices(sportKey: string): Promise<Prices> {
  const events = await fetchSportOdds({ sportKey, markets: ["h2h"] });
  const byEvent = new Map<string, Offer>();
  for (const event of events) {
    const offer = bestOffer(event);
    if (offer) byEvent.set(event.id, offer);
  }
  return { pricedAt: dayjs().toISOString(), byEvent };
}

// Past the budget the last prices stay up (shown with their age) rather than the board going blank.
function boardPrices(sportKey: string): Promise<Prices | null> {
  const now = Date.now();
  const hit = priceCache.get(sportKey);
  if (hit && hit.expires > now) return hit.prices;
  if (
    !serverEnv.oddsApiKey ||
    creditsLeft() < CREDITS_PER_REFRESH ||
    belowReserve()
  )
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
    events: events.map((event) => {
      const offer = prices?.byEvent.get(event.id);
      return {
        ...event,
        moneyline: offer
          ? {
              bookmaker: offer.bookmaker,
              home: toAmericanOdds(offer.home),
              away: toAmericanOdds(offer.away),
              draw: offer.draw === null ? null : toAmericanOdds(offer.draw),
            }
          : null,
      };
    }),
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

const FEATURED_LEAGUES = [
  "americanfootball_nfl",
  "basketball_nba",
  "soccer_uefa_champs_league",
  "soccer_epl",
  "mma_mixed_martial_arts",
  "icehockey_nhl",
  "baseball_mlb",
  "soccer_spain_la_liga",
] satisfies PickLeagueKey[];
const FEATURED_WINDOW_HOURS = 72;

export type FeaturedEvent = {
  sportKey: PickLeagueKey;
  event: ApiEvent;
  offer: Offer;
  pricedAt: string;
};

// Bookmaker coverage is the popularity signal we already pay for: marquee games are quoted by far more books.
export async function getFeaturedEvents(
  limit: number,
): Promise<FeaturedEvent[]> {
  const active = new Set(await getActiveLeagues());
  const now = dayjs();
  const horizon = now.add(FEATURED_WINDOW_HOURS, "hour");
  const perLeague = await Promise.all(
    FEATURED_LEAGUES.filter((key) => active.has(key)).map(async (sportKey) => {
      const events = (await listEvents(sportKey).catch(() => [])).filter(
        (event) => dayjs(event.commenceTime).isBefore(horizon),
      );
      if (events.length === 0) return [];
      const prices = await boardPrices(sportKey);
      if (!prices) return [];
      return events.flatMap((event) => {
        const offer = prices.byEvent.get(event.id);
        return offer
          ? [{ sportKey, event, offer, pricedAt: prices.pricedAt }]
          : [];
      });
    }),
  );
  // Round robin over leagues so European soccer, quoted by the most books, does not fill every slot.
  const queues = perLeague.map((rows) =>
    rows.toSorted((a, b) => b.offer.books - a.offer.books),
  );
  const picked: FeaturedEvent[] = [];
  for (let round = 0; picked.length < limit; round++) {
    const layer = queues.flatMap((rows) => rows.slice(round, round + 1));
    if (layer.length === 0) break;
    picked.push(...layer.toSorted((a, b) => b.offer.books - a.offer.books));
  }
  return picked.slice(0, limit);
}
