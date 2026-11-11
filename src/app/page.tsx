import Link from "next/link";
import { connection } from "next/server";
import { AutoRefresh } from "@/components/refresh";
import { ConfidenceBadge, Ev, PageHeader, Panel, Stat, Unreachable } from "@/components/ui";
import { api, load } from "@/lib/api/client";
import { groupBets } from "@/lib/group";
import { ago, bookName, marketName, odds, percent, sideName, until } from "@/lib/format";

export default async function Overview() {
  await connection();
  const [bets, arbs, ledger, books] = await Promise.all([
    load(api.GET("/v1/value-bets", { params: { query: { limit: 1000 } }, cache: "no-store" })),
    load(api.GET("/v1/arbs", { params: { query: {} }, cache: "no-store" })),
    load(api.GET("/v1/ledger", { params: { query: { limit: 0 } }, cache: "no-store" })),
    load(api.GET("/v1/books", { cache: "no-store" })),
  ]);
  const now = Date.now();
  if (!bets || !arbs || !ledger || !books) return <Unreachable />;

  const top = groupBets(bets.bets.filter((b) => b.confidence !== "low")).slice(0, 8);
  const soft = books.filter((b) => b.book !== "pinnacle");
  const l = ledger.stats;

  return (
    <>
      <AutoRefresh seconds={20} />
      <PageHeader eyebrow="OpenEV preview" title="Where the bookmakers are wrong right now">
        Prices from {soft.length} bookmakers compared live with Pinnacle, the sharpest market, after removing its margin.
        Every alert goes into a public record with the closing line next to it, losers included.
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Value bets" value={String(groupBets(bets.bets).length)} tone="win" />
        <Stat label="Arbs" value={String(arbs.length)} />
        <Stat label="Games matched" value={String(bets.stats.matched_events)} />
        <Stat label="Live prices" value={bets.stats.quotes.toLocaleString("en-GB")} />
        <Stat label="Alerts recorded" value={String(l.alerts)} />
        <Stat label="Updated" value={bets.stats.updated_at ? ago(bets.stats.updated_at, now) : "never"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <Panel
          title="Best value with solid liquidity"
          action={
            <Link href="/value-bets" className="text-xs text-muted hover:text-foreground">
              All value bets
            </Link>
          }
        >
          <ul className="divide-y divide-line/60">
            {top.length === 0 && <li className="px-4 py-8 text-center text-sm text-muted">Nothing above low confidence right now.</li>}
            {top.map((g) => (
              <li key={g.key}>
                <Link
                  href={`/value-bets/${encodeURIComponent(g.best.id)}`}
                  className="grid grid-cols-[64px_1fr_auto] items-center gap-3 px-4 py-2.5 text-sm hover:bg-foreground/5"
                >
                  <Ev value={g.best.ev} className="font-medium" />
                  <span className="min-w-0">
                    <span className="block truncate">
                      {sideName(g.best)} <span className="text-muted">at {bookName(g.best.book)}</span>
                    </span>
                    <span className="block truncate text-[11px] text-muted">
                      {marketName(g.best)}, {g.best.home} v {g.best.away}, {until(g.best.starts_at, now)}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="tabular font-mono">{odds(g.best.odds)}</span>
                    <ConfidenceBadge value={g.best.confidence} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="flex flex-col gap-6">
          <Panel
            title="Proof so far"
            action={
              <Link href="/proof" className="text-xs text-muted hover:text-foreground">
                Ledger
              </Link>
            }
          >
            <dl className="tabular grid grid-cols-2 gap-y-1.5 px-4 py-3 font-mono text-sm">
              <dt className="font-sans text-muted">Alerts</dt>
              <dd className="text-right">{l.alerts}</dd>
              <dt className="font-sans text-muted">Closed</dt>
              <dd className="text-right">{l.closed}</dd>
              <dt className="font-sans text-muted">Beat the close</dt>
              <dd className="text-right">{l.closed > 0 ? `${Math.round((l.beat_close / l.closed) * 100)}%` : "n/a"}</dd>
              <dt className="font-sans text-muted">Average CLV</dt>
              <dd className="text-right">{l.avg_clv === null || l.avg_clv === undefined ? "n/a" : percent(l.avg_clv)}</dd>
            </dl>
          </Panel>
          <Panel
            title="Sources"
            action={
              <Link href="/books" className="text-xs text-muted hover:text-foreground">
                All
              </Link>
            }
          >
            <ul className="divide-y divide-line/60 text-sm">
              {books.map((b) => (
                <li key={b.book} className="flex justify-between px-4 py-1.5">
                  <span>{bookName(b.book)}</span>
                  <span className="tabular font-mono text-xs text-muted">{b.events} games</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
