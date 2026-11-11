import {
  api,
  load,
  type BetDetail,
  type BookStatus,
  type LedgerEntry,
  type LedgerView,
  type ValueBetList,
} from "@/lib/api/client";
import { featuredGroups, groupBets, type GroupedBet } from "@/lib/group";

export type LandingLive = {
  list: ValueBetList;
  groups: GroupedBet[];
  featured: GroupedBet[];
  detail?: BetDetail;
  books: BookStatus[];
  soft: BookStatus[];
  ledger: LedgerView;
  closed: LedgerEntry[];
};

export type LandingData = {
  live?: LandingLive;
  signedIn: boolean;
  now: number;
};

const FEATURED = 5;

// One alert fires per book on the same selection; showing each selection once keeps the list varied.
export function firstPerSelection(entries: LedgerEntry[]): LedgerEntry[] {
  const seen = new Set<string>();
  return entries.filter((e) => {
    if (seen.has(e.sharp_key)) return false;
    seen.add(e.sharp_key);
    return true;
  });
}

export async function loadLanding(signedIn: boolean): Promise<LandingData> {
  const results = await Promise.all([
    load(api.GET("/v1/value-bets", { params: { query: { limit: 1000 } }, cache: "no-store" })),
    load(api.GET("/v1/books", { cache: "no-store" })),
    load(api.GET("/v1/ledger", { params: { query: { limit: 500 } }, cache: "no-store" })),
  ]);
  const now = Date.now();
  const list = results[0];
  const books = results[1];
  const ledger = results[2];
  if (!list || !books || !ledger) return { signedIn, now };

  const groups = groupBets(list.bets);
  const featured = featuredGroups(list.bets, FEATURED);
  const top = featured[0];
  const detail = top
    ? await load(
        api.GET("/v1/value-bets/{id}", {
          params: { path: { id: top.best.id } },
          cache: "no-store",
        }),
      )
    : undefined;

  return {
    live: {
      list,
      groups,
      featured,
      detail,
      books,
      soft: books.filter((b) => b.book !== "pinnacle"),
      ledger,
      closed: firstPerSelection(ledger.entries.filter((e) => e.status === "closed")).slice(0, 6),
    },
    signedIn,
    now,
  };
}
