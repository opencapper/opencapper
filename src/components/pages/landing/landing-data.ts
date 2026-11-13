import {
  api,
  load,
  type BetDetail,
  type BookStatus,
  type LedgerEntry,
  type LedgerStats,
  type ValueBetList,
} from "@/lib/api/client";
import { edgeCount, featuredGroups } from "@/lib/group";
import { BOARD_ROWS } from "./landing-ui";

const RESULT_ROWS = 6;

export type LandingData = {
  now: number;
  // Only the bets the board can show: the socket snapshot replaces it with the full list.
  list?: ValueBetList;
  edges: number;
  books: BookStatus[];
  stats?: LedgerStats;
  results: LedgerEntry[];
  boardKeys: string[];
  featured?: BetDetail;
  alert?: LedgerEntry;
  alertsByBook: Record<string, number>;
};

// Several alerts fire on one game (each book, each side); one row per game keeps the results varied.
function firstPerGame(entries: LedgerEntry[]): LedgerEntry[] {
  const seen = new Set<string>();
  return entries.filter((e) => {
    if (seen.has(e.game_id)) return false;
    seen.add(e.game_id);
    return true;
  });
}

function time(iso: string | null | undefined): number {
  return iso ? new Date(iso).getTime() : 0;
}

// Settled alerts lead, closed ones fill: a row with a final score says more than one without.
function resultRows(entries: LedgerEntry[]): LedgerEntry[] {
  const settled = entries
    .filter((e) => e.result)
    .sort((a, b) => time(b.settled_at) - time(a.settled_at));
  const closed = entries.filter((e) => !e.result && e.status === "closed");
  return firstPerGame([...settled, ...closed]).slice(0, RESULT_ROWS);
}

function pickAlert(entries: LedgerEntry[]): LedgerEntry | undefined {
  return (
    entries.find((e) => e.confidence === "high") ??
    entries.find((e) => e.confidence === "medium") ??
    entries[0]
  );
}

export async function loadLanding(): Promise<LandingData> {
  const results = await Promise.all([
    load(
      api.GET("/v1/value-bets", {
        params: { query: { limit: 1000 } },
        cache: "no-store",
      }),
    ),
    load(api.GET("/v1/books", { cache: "no-store" })),
    load(
      api.GET("/v1/ledger", {
        params: { query: { limit: 2000 } },
        cache: "no-store",
      }),
    ),
  ]);
  const list = results[0];
  const ledger = results[2];
  const entries = ledger?.entries ?? [];

  const groups = list ? featuredGroups(list.bets, BOARD_ROWS) : [];
  // A three way market makes the clearest margin diagram, so it leads when one is on the board.
  const lead = groups.find((g) => g.best.market === "three_way") ?? groups[0];
  const boardKeys = lead
    ? [lead.key, ...groups.filter((g) => g !== lead).map((g) => g.key)]
    : [];
  const featured = lead
    ? await load(
        api.GET("/v1/value-bets/{id}", {
          params: { path: { id: lead.best.id } },
          cache: "no-store",
        }),
      )
    : undefined;

  const seed = list
    ? new Set(
        featuredGroups(list.bets, BOARD_ROWS * 3).flatMap((g) =>
          g.offers.map((b) => b.id),
        ),
      )
    : undefined;

  const alertsByBook: Record<string, number> = {};
  for (const e of entries)
    alertsByBook[e.book] = (alertsByBook[e.book] ?? 0) + 1;

  return {
    now: Date.now(),
    list:
      list && seed
        ? { stats: list.stats, bets: list.bets.filter((b) => seed.has(b.id)) }
        : undefined,
    edges: edgeCount(list ?? null),
    books: results[1] ?? [],
    stats: ledger?.stats,
    results: resultRows(entries),
    boardKeys,
    featured,
    alert: pickAlert(entries),
    alertsByBook,
  };
}
