"use server";

import {
  api,
  load,
  type Arb,
  type BetDetail,
  type Game,
  type LedgerView,
  type ValueBetList,
} from "@/lib/api/client";

// Fallback reads while the socket is down; the browser never reaches the API directly.

export async function fetchValueBets(
  book?: string,
  min?: string,
): Promise<ValueBetList | null> {
  const data = await load(
    api.GET("/v1/value-bets", {
      params: {
        query: { book, min_ev: min ? Number(min) : undefined, limit: 1000 },
      },
      cache: "no-store",
    }),
  );
  return data ?? null;
}

export async function fetchBet(id: string): Promise<BetDetail | null> {
  const data = await load(
    api.GET("/v1/value-bets/{id}", {
      params: { path: { id } },
      cache: "no-store",
    }),
  );
  return data ?? null;
}

export async function fetchArbs(all: boolean): Promise<Arb[] | null> {
  const data = await load(
    api.GET("/v1/arbs", {
      params: { query: { include_check: all } },
      cache: "no-store",
    }),
  );
  return data ?? null;
}

export async function fetchGame(id: string): Promise<Game | null> {
  const data = await load(
    api.GET("/v1/games/{id}", { params: { path: { id } }, cache: "no-store" }),
  );
  return data ?? null;
}

export async function fetchLedger(): Promise<LedgerView | null> {
  const data = await load(
    api.GET("/v1/ledger", {
      params: { query: { limit: 500 } },
      cache: "no-store",
    }),
  );
  return data ?? null;
}
