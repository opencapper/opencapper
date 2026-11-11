import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { AutoRefresh } from "@/components/refresh";
import { Chip, ConfidenceBadge, Empty, Ev, FilterRow, PageHeader, Stat, Unreachable, td, th } from "@/components/ui";
import { api, load } from "@/lib/api/client";
import { groupBets } from "@/lib/group";
import { ago, bookName, kelly, kickoff, marketName, money, odds, param, query, sideName, until } from "@/lib/format";

export const metadata: Metadata = { title: "Value bets" };

const MIN_EV = [
  { label: "All", value: undefined },
  { label: "+1%", value: "0.01" },
  { label: "+2%", value: "0.02" },
  { label: "+5%", value: "0.05" },
];

const MARKETS = [
  { label: "All", value: undefined },
  { label: "Match result", value: "three_way" },
  { label: "Totals", value: "total" },
  { label: "Handicap", value: "asian_handicap" },
  { label: "Moneyline", value: "two_way" },
];

const BANKROLL = 1000;
const KELLY_FRACTION = 0.25;

export default async function ValueBets(props: PageProps<"/value-bets">) {
  await connection();
  const sp = await props.searchParams;
  const book = param(sp.book);
  const min = param(sp.min);
  const market = param(sp.market);
  const solid = param(sp.solid);
  const data = await load(
    api.GET("/v1/value-bets", {
      params: { query: { book, min_ev: min ? Number(min) : undefined, limit: 1000 } },
      cache: "no-store",
    }),
  );
  const now = Date.now();
  if (!data) return <Unreachable />;

  const filtered = data.bets
    .filter((b) => !market || b.market === market)
    .filter((b) => !solid || b.confidence !== "low");
  const groups = groupBets(filtered);
  const books = Object.keys(data.stats.books).filter((b) => b !== "pinnacle").sort();
  const state = { book, min, market, solid };
  const link = (patch: Partial<typeof state>) => query("/value-bets", { ...state, ...patch });

  return (
    <>
      <AutoRefresh seconds={20} />
      <PageHeader eyebrow="Positive EV" title="Value bets">
        A bet shows up when a bookmaker pays more than the fair odds, which come from Pinnacle with its margin
        removed. Click a bet to see every book on that market, how the fair price was built and how the price moved.
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Selections" value={String(groups.length)} />
        <Stat label="Games matched" value={`${data.stats.matched_events} / ${data.stats.book_events}`} />
        <Stat label="Prices compared" value={data.stats.compared_prices.toLocaleString("en-GB")} />
        <Stat label="Updated" value={data.stats.updated_at ? ago(data.stats.updated_at, now) : "never"} />
      </div>

      <div className="flex flex-col gap-2">
        <FilterRow label="Book">
          <Chip active={!book} href={link({ book: undefined })}>
            All
          </Chip>
          {books.map((b) => (
            <Chip key={b} active={book === b} href={link({ book: b })}>
              {bookName(b)}
            </Chip>
          ))}
        </FilterRow>
        <FilterRow label="Market">
          {MARKETS.map((m) => (
            <Chip key={m.label} active={market === m.value} href={link({ market: m.value })}>
              {m.label}
            </Chip>
          ))}
        </FilterRow>
        <FilterRow label="Min EV">
          {MIN_EV.map((m) => (
            <Chip key={m.label} active={min === m.value} href={link({ min: m.value })}>
              {m.label}
            </Chip>
          ))}
          <span className="mx-2 h-4 w-px bg-line" />
          <Chip active={!!solid} href={link({ solid: solid ? undefined : "1" })}>
            Hide low confidence
          </Chip>
        </FilterRow>
      </div>

      <div className="overflow-x-auto border border-line">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-line bg-panel">
            <tr>
              <th className={th}>EV</th>
              <th className={th}>Event</th>
              <th className={th}>Bet</th>
              <th className={th}>Book</th>
              <th className={`${th} text-right`}>Odds</th>
              <th className={`${th} text-right`}>Fair</th>
              <th className={`${th} text-right`} title={`Quarter Kelly on a ${BANKROLL} bankroll`}>
                Stake
              </th>
              <th className={th}>Confidence</th>
              <th className={th}>Seen</th>
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 && (
              <tr>
                <td colSpan={9}>
                  <Empty>No value right now with these filters. Prices update every few seconds.</Empty>
                </td>
              </tr>
            )}
            {groups.map((g) => {
              const b = g.best;
              const stake = kelly(Number(b.odds), b.fair_probability, KELLY_FRACTION) * BANKROLL;
              const href = `/value-bets/${encodeURIComponent(b.id)}`;
              return (
                <tr key={g.key} className="border-b border-line/60 last:border-0 hover:bg-panel">
                  <td className={td}>
                    <Link href={href} className="block">
                      <Ev value={b.ev} className="font-medium" />
                      <div className="tabular font-mono text-[11px] text-muted" title="Against the worst case devig">
                        {b.ev_conservative >= 0 ? "+" : ""}
                        {(b.ev_conservative * 100).toFixed(1)}% safe
                      </div>
                    </Link>
                  </td>
                  <td className={td}>
                    <Link href={`/games/${encodeURIComponent(b.game_id)}`} className="hover:underline">
                      {b.home} <span className="text-muted">v</span> {b.away}
                    </Link>
                    <div className="text-[11px] text-muted">
                      {b.league}, {kickoff(b.starts_at)}, {until(b.starts_at, now)}
                    </div>
                  </td>
                  <td className={td}>
                    <Link href={href} className="hover:underline">
                      {sideName(b)}
                    </Link>
                    <div className="text-[11px] text-muted">{marketName(b)}</div>
                  </td>
                  <td className={td}>
                    <div>{bookName(b.book)}</div>
                    {g.offers.length > 1 && (
                      <div
                        className="text-[11px] text-muted"
                        title={g.offers
                          .slice(1)
                          .map((o) => `${bookName(o.book)} ${odds(o.odds)}`)
                          .join(", ")}
                      >
                        +{g.offers.length - 1} more
                      </div>
                    )}
                  </td>
                  <td className={`${td} tabular text-right font-mono`}>{odds(b.odds)}</td>
                  <td className={`${td} tabular text-right font-mono text-muted`}>
                    <div>{odds(b.fair_odds)}</div>
                    <div className="text-[11px]">Pin {odds(b.sharp_odds)}</div>
                  </td>
                  <td className={`${td} tabular text-right font-mono`}>{stake >= 1 ? money(stake) : "<1"}</td>
                  <td className={td}>
                    <ConfidenceBadge value={b.confidence} />
                  </td>
                  <td className={`${td} tabular font-mono text-[11px] text-muted`}>{ago(b.book_seen_at, now)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 text-xs leading-relaxed text-muted sm:grid-cols-3">
        <p>
          <span className="text-foreground">Fair odds</span> use the power devig of Pinnacle. The safe EV uses the least
          favourable of four methods, so it is the cautious number.
        </p>
        <p>
          <span className="text-foreground">Confidence</span> follows Pinnacle&apos;s maximum stake on the market: the
          more money it accepts, the more the fair price can be trusted.
        </p>
        <p>
          <span className="text-foreground">Stake</span> is quarter Kelly on a bankroll of {BANKROLL}. A price not
          reconfirmed within five minutes drops off the board.
        </p>
      </div>
    </>
  );
}
