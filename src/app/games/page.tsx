import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Ev, PageHeader, Panel, Unreachable } from "@/components/ui";
import { api, load, type GameSummary } from "@/lib/api/client";
import { day, param, time, until } from "@/lib/format";

export const metadata: Metadata = { title: "Odds screen" };

function byDay(games: GameSummary[]): [string, GameSummary[]][] {
  const out = new Map<string, GameSummary[]>();
  for (const g of games) {
    const d = day(g.starts_at);
    out.set(d, [...(out.get(d) ?? []), g]);
  }
  return [...out.entries()];
}

export default async function Games(props: PageProps<"/games">) {
  await connection();
  const sp = await props.searchParams;
  const q = param(sp.q);
  const data = await load(api.GET("/v1/games", { params: { query: { q, limit: 400 } }, cache: "no-store" }));
  const now = Date.now();
  if (!data) return <Unreachable />;

  return (
    <>
      <PageHeader eyebrow="Odds screen" title="Games">
        Every game with a sharp price, by kickoff. Open a game to compare every bookmaker on every market against the
        fair line.
      </PageHeader>
      <form className="flex gap-2" action="/games">
        <input
          name="q"
          defaultValue={q}
          placeholder="Team or league"
          className="w-full max-w-sm border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-foreground/40"
        />
        <button type="submit" className="border border-line px-4 text-sm text-muted hover:text-foreground">
          Search
        </button>
      </form>
      {byDay(data).map((entry) => (
        <Panel key={entry[0]} title={entry[0]}>
          <ul className="divide-y divide-line/60">
            {entry[1].map((g) => (
              <li key={g.id}>
                <Link
                  href={`/games/${encodeURIComponent(g.id)}`}
                  className="grid grid-cols-[52px_1fr_auto] items-center gap-3 px-4 py-2.5 text-sm hover:bg-foreground/5 sm:grid-cols-[52px_1fr_180px_90px_70px]"
                >
                  <span className="tabular font-mono text-xs text-muted" title={until(g.starts_at, now)}>
                    {time(g.starts_at)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate">
                      {g.home} <span className="text-muted">v</span> {g.away}
                    </span>
                    <span className="block truncate text-[11px] text-muted">{g.league}</span>
                  </span>
                  <span className="hidden text-xs text-muted sm:block">
                    {g.books.length} {g.books.length === 1 ? "book" : "books"}, {g.markets} markets
                  </span>
                  <span className="hidden text-right text-xs sm:block">
                    {g.value_bets > 0 ? `${g.value_bets} value` : <span className="text-muted">no value</span>}
                  </span>
                  <span className="text-right text-xs">{g.best_ev ? <Ev value={g.best_ev} /> : null}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      ))}
      {data.length === 0 && <Panel><div className="px-4 py-12 text-center text-sm text-muted">No games found.</div></Panel>}
    </>
  );
}
