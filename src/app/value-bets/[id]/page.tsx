import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { MarketTable } from "@/components/market-table";
import { PriceChart } from "@/components/price-chart";
import { AutoRefresh } from "@/components/refresh";
import { StakeCalculator } from "@/components/stake-calculator";
import { ConfidenceBadge, Ev, PageHeader, Panel, Stat } from "@/components/ui";
import { api, load } from "@/lib/api/client";
import { ago, bookName, kickoff, marketName, odds, percent, prob, sideName, until } from "@/lib/format";

export const metadata: Metadata = { title: "Bet detail" };

const BOOK_COLOR = "#3b82f6";
const SHARP_COLOR = "#d97706";

const METHODS = [
  { key: "power", label: "Power", note: "Used for the headline EV. Takes more margin off long shots, as books do." },
  { key: "multiplicative", label: "Multiplicative", note: "Scales every outcome by the same factor." },
  { key: "additive", label: "Additive", note: "Removes the same amount from every outcome." },
  { key: "worst_case", label: "Worst case", note: "The least favourable of the others for this bet. The safe EV." },
] as const;

export default async function BetDetail(props: PageProps<"/value-bets/[id]">) {
  await connection();
  const params = await props.params;
  const id = decodeURIComponent(params.id);
  const data = await load(api.GET("/v1/value-bets/{id}", { params: { path: { id } }, cache: "no-store" }));
  const now = Date.now();

  if (!data) {
    return (
      <>
        <PageHeader eyebrow="Value bet" title="This price is no longer value">
          The bookmaker moved, the fair line moved, or the game started. Value bets live only while the price beats the
          fair odds.
        </PageHeader>
        <Link href="/value-bets" className="text-sm underline">
          Back to value bets
        </Link>
      </>
    );
  }

  const b = data.bet;
  const outcome = data.market.outcomes.find((o) => o.side === b.side);
  const others = outcome?.prices.filter((p) => p.book !== b.book) ?? [];

  return (
    <>
      <AutoRefresh seconds={30} />
      <div className="text-xs text-muted">
        <Link href="/value-bets" className="hover:text-foreground">
          Value bets
        </Link>{" "}
        /{" "}
        <Link href={`/games/${encodeURIComponent(b.game_id)}`} className="hover:text-foreground">
          {b.home} v {b.away}
        </Link>
      </div>
      <PageHeader eyebrow={`${b.league}, ${kickoff(b.starts_at)}, ${until(b.starts_at, now)}`} title={`${sideName(b)} at ${bookName(b.book)}`}>
        {marketName(b)} in {b.home} v {b.away}. {bookName(b.book)} pays {odds(b.odds)} where the fair price is{" "}
        {odds(b.fair_odds)}, a {prob(b.fair_probability)} chance.
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat label="EV" value={percent(b.ev)} tone="win" />
        <Stat label="Safe EV" value={percent(b.ev_conservative)} tone={b.ev_conservative > 0 ? "win" : "warn"} hint="Against the worst case devig" />
        <Stat label="Odds" value={odds(b.odds)} />
        <Stat label="Fair odds" value={odds(b.fair_odds)} />
        <div className="flex flex-col justify-center gap-1 border border-line bg-panel px-4 py-3">
          <div className="text-[11px] uppercase tracking-wider text-muted">Confidence</div>
          <div>
            <ConfidenceBadge value={b.confidence} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <Panel title="The whole market">
            <MarketTable market={data.market} home={b.home} away={b.away} now={now} highlight={b.id} valueLinks />
          </Panel>

          <Panel title="Price history">
            <PriceChart
              now={now}
              series={[
                { label: bookName(b.book), color: BOOK_COLOR, points: data.book_history },
                { label: "Pinnacle", color: SHARP_COLOR, points: data.sharp_history },
              ]}
            />
          </Panel>

          <Panel title="How the fair price is built">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-[11px] uppercase tracking-wider text-muted">
                    <th className="px-4 py-2 text-left font-normal">Method</th>
                    <th className="px-4 py-2 text-right font-normal">Chance</th>
                    <th className="px-4 py-2 text-right font-normal">Fair odds</th>
                    <th className="px-4 py-2 text-right font-normal">EV at {odds(b.odds)}</th>
                  </tr>
                </thead>
                <tbody>
                  {METHODS.map((m) => {
                    const p = b.fair[m.key];
                    return (
                      <tr key={m.key} className="border-b border-line/60 last:border-0">
                        <td className="px-4 py-2.5">
                          <div>{m.label}</div>
                          <div className="text-[11px] text-muted">{m.note}</div>
                        </td>
                        <td className="tabular px-4 py-2.5 text-right font-mono">{prob(p)}</td>
                        <td className="tabular px-4 py-2.5 text-right font-mono">{odds(1 / p)}</td>
                        <td className="px-4 py-2.5 text-right">
                          <Ev value={Number(b.odds) * p - 1} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="border-t border-line px-4 py-3 text-xs leading-relaxed text-muted">
              Pinnacle prices this market with a {percent(b.sharp_overround)} margin and takes up to{" "}
              {b.sharp_max_stake ? Number(b.sharp_max_stake).toLocaleString("en-GB") : "an unknown amount"} on it. Pinnacle
              was last seen {ago(b.sharp_seen_at, now)}, {bookName(b.book)} {ago(b.book_seen_at, now)}.
            </div>
          </Panel>
        </div>

        <div className="flex flex-col gap-6">
          <Panel title="Stake">
            <StakeCalculator odds={Number(b.odds)} probability={b.fair_probability} />
          </Panel>

          <Panel title="Same bet elsewhere">
            {others.length === 0 ? (
              <div className="px-4 py-3 text-sm text-muted">No other book prices this outcome.</div>
            ) : (
              <ul className="divide-y divide-line/60 text-sm">
                {others.map((p) => (
                  <li key={p.key} className="flex items-center justify-between px-4 py-2">
                    <span>{bookName(p.book)}</span>
                    <span className="flex items-center gap-3">
                      <Ev value={p.ev} className="text-xs" />
                      <span className="tabular w-12 text-right font-mono">{odds(p.odds)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Before you bet">
            <ul className="flex list-disc flex-col gap-1.5 py-3 pl-8 pr-4 text-xs leading-relaxed text-muted">
              <li>Check the price at {bookName(b.book)} is still {odds(b.odds)} or better.</li>
              <li>Below {odds(b.fair_odds)} the bet has no edge. Skip it.</li>
              <li>Round the stake to a normal number. Odd amounts get accounts flagged.</li>
              <li>Mix in normal bets so the account does not look like it only takes value.</li>
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
