"use client";

import { useLiveQuery } from "@/hooks/live/use-live-query-hook";
import type {
  LedgerStats,
  ServerMessage,
  ValueBetList,
} from "@/lib/api/client";
import { applyValueBets } from "@/lib/live/apply";
import { fetchLedger, fetchValueBets } from "@/lib/live/actions";
import { queryKeys } from "@/lib/react-query/keys";
import { useQuery } from "@tanstack/react-query";
import {
  edgeCount,
  featuredGroups,
  groupBets,
  type GroupedBet,
} from "@/lib/group";
import { BOARD_ROWS } from "./landing-ui";

// Rows the server picked stay put while their prices move; a row is replaced only once its bet is gone.
export function boardGroups(
  bets: ValueBetList["bets"],
  keys: string[],
): GroupedBet[] {
  const byKey = new Map(groupBets(bets).map((g) => [g.key, g]));
  const kept = keys
    .map((k) => byKey.get(k))
    .filter((g): g is GroupedBet => g !== undefined);
  const fill = featuredGroups(bets, BOARD_ROWS + keys.length).filter(
    (g) => !keys.includes(g.key),
  );
  return [...kept, ...fill].slice(0, BOARD_ROWS);
}

export function useBoardBets(list: ValueBetList | null) {
  return useLiveQuery({
    queryKey: queryKeys.boardBets(),
    initialData: list,
    fetch: () => fetchValueBets(),
    topic: "value_bets",
    apply: applyValueBets,
  });
}

// Reads the cache the board keeps live, without a second socket subscription.
export function useBoardSnapshot(
  list: ValueBetList | null,
): ValueBetList | null {
  const query = useQuery({
    queryKey: queryKeys.boardBets(),
    queryFn: () => fetchValueBets(),
    initialData: list,
    staleTime: Infinity,
    enabled: false,
  });
  return query.data ?? null;
}

function applyStats(
  prev: LedgerStats | null,
  frames: ServerMessage[],
): LedgerStats | null {
  let stats = prev;
  for (const f of frames) {
    if (
      f.type === "ledger_snapshot" ||
      f.type === "ledger_added" ||
      f.type === "ledger_updated" ||
      f.type === "ledger_closed"
    )
      stats = f.stats;
  }
  return stats;
}

export function useLedgerStats(stats: LedgerStats | null) {
  return useLiveQuery({
    queryKey: queryKeys.ledgerStats(),
    initialData: stats,
    fetch: async () => (await fetchLedger())?.stats ?? null,
    topic: "ledger",
    apply: applyStats,
  });
}

// Until the socket snapshot lands the cache holds the trimmed seed, so the server count stands in.
export function liveEdges(
  list: ValueBetList | null,
  seed: ValueBetList | null,
  edges: number,
): number {
  return list === seed ? edges : edgeCount(list);
}

