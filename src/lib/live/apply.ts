import type {
  Arb,
  BetDetail,
  BookPrice,
  Game,
  LedgerView,
  LivePrice,
  Market,
  PricePoint,
  ServerMessage,
  ValueBetList,
} from "@/lib/api/client";

function upsert<T extends { id: string }>(list: T[], item: T): T[] {
  const i = list.findIndex((x) => x.id === item.id);
  if (i === -1) return [...list, item];
  const next = list.slice();
  next[i] = item;
  return next;
}

export function applyValueBets(
  prev: ValueBetList | null,
  frames: ServerMessage[],
): ValueBetList | null {
  let data = prev;
  for (const f of frames) {
    if (f.type === "value_bets_snapshot") {
      data = { bets: f.bets, stats: f.stats };
      continue;
    }
    if (!data) continue;
    if (f.type === "value_bet_added" || f.type === "value_bet_updated") {
      data = {
        bets: upsert(data.bets, f.bet),
        stats: { ...data.stats, updated_at: f.ts },
      };
    } else if (f.type === "value_bet_removed") {
      const id = f.id;
      data = {
        bets: data.bets.filter((b) => b.id !== id),
        stats: { ...data.stats, updated_at: f.ts },
      };
    }
  }
  if (data && data !== prev) data.bets.sort((a, b) => b.ev - a.ev);
  return data;
}

export function applyArbs(
  prev: Arb[] | null,
  frames: ServerMessage[],
): Arb[] | null {
  let data = prev;
  for (const f of frames) {
    if (f.type === "arbs_snapshot") data = f.arbs;
    else if (!data) continue;
    else if (f.type === "arb_added" || f.type === "arb_updated")
      data = upsert(data, f.arb);
    else if (f.type === "arb_removed") {
      const id = f.id;
      data = data.filter((a) => a.id !== id);
    }
  }
  if (data && data !== prev)
    data = data.slice().sort((a, b) => b.profit - a.profit);
  return data;
}

// The snapshot carries the newest hundred; older rows the page loaded stay.
export function applyLedger(
  prev: LedgerView | null,
  frames: ServerMessage[],
): LedgerView | null {
  let data = prev;
  for (const f of frames) {
    if (f.type === "ledger_snapshot") {
      let entries = (data?.entries ?? []).slice();
      for (const e of f.entries) entries = upsert(entries, e);
      data = { stats: f.stats, entries };
    } else if (
      data &&
      (f.type === "ledger_added" ||
        f.type === "ledger_updated" ||
        f.type === "ledger_closed")
    ) {
      data = { stats: f.stats, entries: upsert(data.entries, f.entry) };
    }
  }
  if (data && data !== prev) {
    data.entries.sort(
      (a, b) =>
        new Date(b.alerted_at).getTime() - new Date(a.alerted_at).getTime(),
    );
  }
  return data;
}

function sameMarket(m: Market, p: LivePrice): boolean {
  return (
    m.kind === p.market &&
    m.period === p.period &&
    (m.line ?? null) === (p.line ?? null)
  );
}

function moved(p: BookPrice, live: LivePrice): BookPrice {
  return {
    ...p,
    odds: live.odds,
    ev: live.ev,
    stale: live.stale,
    seen_at: live.seen_at,
  };
}

function fresh(live: LivePrice): BookPrice {
  return {
    book: live.book,
    key: live.key,
    odds: live.odds,
    ev: live.ev,
    stale: live.stale,
    seen_at: live.seen_at,
  };
}

export function applyPrice(m: Market, live: LivePrice): Market {
  if (!sameMarket(m, live)) return m;
  return {
    ...m,
    outcomes: m.outcomes.map((o) => {
      if (o.side !== live.side) return o;
      if (o.sharp?.key === live.key)
        return { ...o, sharp: moved(o.sharp, live) };
      const known = o.prices.some((p) => p.key === live.key);
      if (!known && live.book === "pinnacle" && !o.sharp)
        return { ...o, sharp: fresh(live) };
      const prices = known
        ? o.prices.map((p) => (p.key === live.key ? moved(p, live) : p))
        : [...o.prices, fresh(live)];
      prices.sort((a, b) => Number(b.odds) - Number(a.odds));
      return { ...o, prices };
    }),
  };
}

function dropPrice(m: Market, key: string): Market {
  return {
    ...m,
    outcomes: m.outcomes.map((o) => {
      if (o.sharp?.key === key) return { ...o, sharp: null };
      if (!o.prices.some((p) => p.key === key)) return o;
      return { ...o, prices: o.prices.filter((p) => p.key !== key) };
    }),
  };
}

export function applyGame(
  prev: Game | null,
  frames: ServerMessage[],
): Game | null {
  let data = prev;
  for (const f of frames) {
    if (f.type === "game_snapshot") data = f.game ?? null;
    else if (f.type === "game_removed") data = null;
    else if (!data) continue;
    else if (f.type === "price_changed") {
      const price = f.price;
      data = {
        ...data,
        markets: data.markets.map((m) => applyPrice(m, price)),
      };
    } else if (f.type === "price_removed") {
      const key = f.key;
      data = { ...data, markets: data.markets.map((m) => dropPrice(m, key)) };
    }
  }
  return data;
}

function append(history: PricePoint[], live: LivePrice): PricePoint[] {
  const last = history.at(-1);
  if (last && last.odds === live.odds && last.open) return history;
  return [...history, { at: live.seen_at, odds: live.odds, open: true }];
}

export function applyBet(
  prev: BetDetail | null,
  frames: ServerMessage[],
): BetDetail | null {
  let data = prev;
  for (const f of frames) {
    if (!data) continue;
    if (
      (f.type === "bet_snapshot" && f.bet) ||
      f.type === "value_bet_added" ||
      f.type === "value_bet_updated"
    ) {
      const bet = f.bet;
      if (bet) data = { ...data, bet };
    } else if (f.type === "price_changed") {
      const live = f.price;
      const bet = data.bet;
      data = { ...data, market: applyPrice(data.market, live) };
      if (live.key === bet.id) {
        data = {
          ...data,
          bet: {
            ...bet,
            odds: live.odds,
            ev: live.ev ?? bet.ev,
            book_seen_at: live.seen_at,
          },
          book_history: append(data.book_history, live),
        };
      } else if (live.key === bet.sharp_key) {
        data = {
          ...data,
          bet: { ...bet, sharp_odds: live.odds, sharp_seen_at: live.seen_at },
          sharp_history: append(data.sharp_history, live),
        };
      }
    } else if (f.type === "price_removed") {
      data = { ...data, market: dropPrice(data.market, f.key) };
    }
  }
  return data;
}

// A bet that leaves or returns changes the whole page shape; only the server can rebuild it.
export function betNeedsReload(
  prev: BetDetail | null,
  frames: ServerMessage[],
): boolean {
  return frames.some(
    (f) =>
      f.type === "value_bet_removed" ||
      (!prev &&
        ((f.type === "bet_snapshot" && !!f.bet) ||
          f.type === "value_bet_added")),
  );
}
