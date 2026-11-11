import Link from "next/link";
import { connection } from "next/server";
import { api, type ValueBet } from "@/lib/api/client";
import {
  ago,
  bookName,
  groupBets,
  kickoff,
  marketName,
  odds,
  percent,
  selection,
  until,
} from "@/lib/format";
import { AutoRefresh } from "./refresh";

const MIN_EV_OPTIONS = [
  { label: "All", value: undefined },
  { label: "+2%", value: 0.02 },
  { label: "+5%", value: 0.05 },
];

const CONFIDENCE_STYLE: Record<ValueBet["confidence"], string> = {
  high: "text-win border-win/30 bg-win/10",
  medium: "text-warn border-warn/30 bg-warn/10",
  low: "text-muted border-line bg-panel",
  check: "text-bad border-bad/30 bg-bad/10",
};

const CONFIDENCE_HINT: Record<ValueBet["confidence"], string> = {
  high: "Pinnacle takes 1,000+ on this market",
  medium: "Pinnacle takes 500 to 1,000",
  low: "Thin sharp market, fair price less certain",
  check: "EV too high to trust, likely a stale price",
};

function href(params: Record<string, string | undefined>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
  const s = q.toString();
  return s ? `/?${s}` : "/";
}

function Chip({ active, to, children }: { active: boolean; to: string; children: React.ReactNode }) {
  return (
    <Link
      href={to}
      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
        active ? "border-foreground/40 bg-foreground/10 text-foreground" : "border-line text-muted hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-panel px-4 py-3">
      <div className="text-[11px] uppercase tracking-wider text-muted">{label}</div>
      <div className="tabular mt-1 font-mono text-lg">{value}</div>
    </div>
  );
}

export default async function Home({ searchParams }: PageProps<"/">) {
  await connection();
  const sp = await searchParams;
  const book = typeof sp.book === "string" ? sp.book : undefined;
  const minEv = typeof sp.min === "string" ? Number(sp.min) : undefined;

  const { data, error } = await api.GET("/v1/value-bets", {
    params: { query: { book, min_ev: minEv, limit: 300 } },
    cache: "no-store",
  });
  const now = Date.now();

  if (error || !data) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-16 text-muted">
        The odds engine is not reachable right now. Try again in a minute.
      </main>
    );
  }

  const { bets, stats } = data;
  const groups = groupBets(bets);
  const books = Object.keys(stats.books).filter((b) => b !== "pinnacle").sort();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
      <AutoRefresh seconds={20} />
      <header className="flex flex-col gap-2">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted">OpenEV preview</div>
        <h1 className="text-2xl font-semibold sm:text-3xl">Value bets, priced against the sharp line</h1>
        <p className="max-w-2xl text-sm text-muted">
          Prices from six UK bookmakers on the Kambi platform, compared with Pinnacle after removing its margin.
          A bet shows up when the bookmaker pays more than the fair odds. Every price carries the time it was
          last confirmed, and the confidence says how much money stands behind the fair line.
        </p>
      </header>

      <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard label="Value bets" value={String(groups.length)} />
        <StatCard label="Games matched" value={`${stats.matched_events} / ${stats.book_events}`} />
        <StatCard label="Prices compared" value={stats.compared_prices.toLocaleString("en-GB")} />
        <StatCard label="Sharp games" value={String(stats.sharp_events)} />
        <StatCard label="Updated" value={stats.updated_at ? ago(stats.updated_at, now) : "never"} />
      </section>

      <section className="mt-6 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs text-muted">Book</span>
        <Chip active={!book} to={href({ min: sp.min as string | undefined })}>
          All
        </Chip>
        {books.map((b) => (
          <Chip key={b} active={book === b} to={href({ book: b, min: sp.min as string | undefined })}>
            {bookName(b)}
          </Chip>
        ))}
        <span className="ml-4 mr-1 text-xs text-muted">Min EV</span>
        {MIN_EV_OPTIONS.map((o) => (
          <Chip
            key={o.label}
            active={minEv === o.value}
            to={href({ book, min: o.value === undefined ? undefined : String(o.value) })}
          >
            {o.label}
          </Chip>
        ))}
      </section>

      <section className="mt-4 overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-line bg-panel text-[11px] uppercase tracking-wider text-muted">
            <tr>
              <th className="px-3 py-2">EV</th>
              <th className="px-3 py-2">Match</th>
              <th className="px-3 py-2">Bet</th>
              <th className="px-3 py-2">Book</th>
              <th className="px-3 py-2 text-right">Odds</th>
              <th className="px-3 py-2 text-right">Fair</th>
              <th className="px-3 py-2 text-right">Pinnacle</th>
              <th className="px-3 py-2">Confidence</th>
              <th className="px-3 py-2">Seen</th>
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-10 text-center text-muted">
                  No value right now with these filters. Prices update every few seconds.
                </td>
              </tr>
            )}
            {groups.map(({ key, best: b, offers }) => (
              <tr key={key} className="border-b border-line/60 last:border-0 hover:bg-panel/60">
                <td className="px-3 py-2.5 align-top">
                  <div className="tabular font-mono font-medium text-win">{percent(b.ev)}</div>
                  <div className="tabular font-mono text-[11px] text-muted" title="Against the worst case devig">
                    {percent(b.ev_conservative)} safe
                  </div>
                </td>
                <td className="px-3 py-2.5 align-top">
                  <div>
                    {b.home} <span className="text-muted">v</span> {b.away}
                  </div>
                  <div className="text-[11px] text-muted">
                    {b.league} · {kickoff(b.starts_at)} · {until(b.starts_at, now)}
                  </div>
                </td>
                <td className="px-3 py-2.5 align-top">
                  <div>{selection(b)}</div>
                  <div className="text-[11px] text-muted">{marketName(b)}</div>
                </td>
                <td className="px-3 py-2.5 align-top">
                  <div>{bookName(b.book)}</div>
                  {offers.length > 1 && (
                    <div
                      className="text-[11px] text-muted"
                      title={offers
                        .slice(1)
                        .map((o) => `${bookName(o.book)} ${odds(o.odds)}`)
                        .join(", ")}
                    >
                      +{offers.length - 1} more {offers.length - 1 === 1 ? "book" : "books"}
                    </div>
                  )}
                </td>
                <td className="tabular px-3 py-2.5 text-right align-top font-mono">{odds(b.odds)}</td>
                <td className="tabular px-3 py-2.5 text-right align-top font-mono text-muted">{odds(b.fair_odds)}</td>
                <td className="tabular px-3 py-2.5 text-right align-top font-mono text-muted">
                  <div>{odds(b.sharp_odds)}</div>
                  <div className="text-[11px]">max {b.sharp_max_stake ? Number(b.sharp_max_stake).toLocaleString("en-GB") : "n/a"}</div>
                </td>
                <td className="px-3 py-2.5 align-top">
                  <span
                    title={CONFIDENCE_HINT[b.confidence]}
                    className={`rounded border px-2 py-0.5 text-[11px] capitalize ${CONFIDENCE_STYLE[b.confidence]}`}
                  >
                    {b.confidence}
                  </span>
                </td>
                <td className="tabular px-3 py-2.5 align-top font-mono text-[11px] text-muted">{ago(b.book_seen_at, now)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <footer className="mt-8 grid gap-3 text-xs text-muted sm:grid-cols-3">
        <p>
          <span className="text-foreground">Fair odds</span> come from Pinnacle with its margin removed (power method).
          The safe EV uses the least favourable method, so it is the cautious number.
        </p>
        <p>
          <span className="text-foreground">Confidence</span> follows Pinnacle&apos;s maximum stake on the market:
          the more money it accepts, the more the fair price can be trusted.
        </p>
        <p>
          <span className="text-foreground">Freshness</span>: a price that is not reconfirmed within five minutes
          drops off the board. Always check the price at the bookmaker before betting.
        </p>
      </footer>
    </main>
  );
}
