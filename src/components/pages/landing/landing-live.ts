"use client";

import { useLiveQuery } from "@/hooks/live/use-live-query-hook";
import type {
  BetDetail,
  LedgerStats,
  ServerMessage,
  ValueBetList,
} from "@/lib/api/client";
import { applyValueBets } from "@/lib/live/apply";
import { fetchLedger, fetchValueBets } from "@/lib/live/actions";
import { queryKeys } from "@/lib/react-query/keys";
import { useQuery } from "@tanstack/react-query";
import { featuredGroups, groupBets, type GroupedBet } from "@/lib/group";
import { useEffect, useState } from "react";
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

// The ladder shows the server's featured bet while it lasts, then whatever leads the board.
export function ladderBetId(
  list: ValueBetList | null,
  featured: BetDetail | null,
  rows: GroupedBet[],
): string | undefined {
  const id = featured?.bet.id;
  if (id && list?.bets.some((b) => b.id === id)) return id;
  return rows[0]?.best.id ?? id;
}

export function useBoardBets(list: ValueBetList | null) {
  return useLiveQuery({
    queryKey: queryKeys.valueBets(),
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
    queryKey: queryKeys.valueBets(),
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

// Second hand for kickoff countdowns; starts from the server clock so the first render matches.
export function useClock(initial: number): number {
  const state = useState(initial);
  const setNow = state[1];
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [setNow]);
  return state[0];
}

// Check confidence prices are likely stale, so they never count as an edge.
export function edgeCount(list: ValueBetList | null): number {
  return list ? list.bets.filter((b) => b.confidence !== "check").length : 0;
}
