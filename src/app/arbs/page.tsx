import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { AutoRefresh } from "@/components/refresh";
import { Chip, Empty, FilterRow, PageHeader, Panel, Unreachable } from "@/components/ui";
import { api, load } from "@/lib/api/client";
import { ago, bookName, kickoff, marketName, money, odds, param, percent, query, sideName, until } from "@/lib/format";

export const metadata: Metadata = { title: "Arbitrage" };

const TOTAL = 100;

export default async function Arbs(props: PageProps<"/arbs">) {
  await connection();
  const sp = await props.searchParams;
  const all = param(sp.all);
  const data = await load(
    api.GET("/v1/arbs", { params: { query: { include_check: !!all } }, cache: "no-store" }),
  );
  const now = Date.now();
  if (!data) return <Unreachable />;

  return (
    <>
      <AutoRefresh seconds={15} />
      <PageHeader eyebrow="Sure bets" title="Arbitrage">
        Back every outcome at the book paying the most and the return is the same whatever happens. Stakes below split{" "}
        {TOTAL} so every outcome pays out the same. Arbs close fast: confirm every leg before placing the first one.
      </PageHeader>

      <FilterRow label="Show">
        <Chip active={!all} href={query("/arbs", {})}>
          Trusted
        </Chip>
        <Chip active={!!all} href={query("/arbs", { all: "1" })}>
          Include likely stale (over 5%)
        </Chip>
      </FilterRow>

      {data.length === 0 ? (
        <Panel>
          <Empty>
            No arbitrage right now. Soft books rarely disagree by enough at the same time; they show up most around
            team news and line moves.
          </Empty>
        </Panel>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((a) => (
            <Panel
              key={a.id}
              title={`${percent(a.profit, 2)} profit`}
              action={a.check ? <span className="text-[11px] text-bad">probably stale</span> : undefined}
            >
              <div className="px-4 pt-3">
                <Link href={`/games/${encodeURIComponent(a.game_id)}`} className="hover:underline">
                  {a.home} <span className="text-muted">v</span> {a.away}
                </Link>
                <div className="text-[11px] text-muted">
                  {a.league}, {kickoff(a.starts_at)}, {until(a.starts_at, now)}
                </div>
                <div className="mt-1 text-xs text-muted">{marketName(a)}</div>
              </div>
              <table className="mt-2 w-full text-sm">
                <tbody>
                  {a.legs.map((l) => (
                    <tr key={l.key} className="border-t border-line/60">
                      <td className="px-4 py-2">{sideName({ market: a.market, side: l.side, line: a.line, home: a.home, away: a.away })}</td>
                      <td className="px-4 py-2 text-muted">{bookName(l.book)}</td>
                      <td className="tabular px-4 py-2 text-right font-mono">{odds(l.odds)}</td>
                      <td className="tabular px-4 py-2 text-right font-mono">{(l.stake_share * TOTAL).toFixed(2)}</td>
                      <td className="tabular px-4 py-2 text-right font-mono text-[11px] text-muted">{ago(l.seen_at, now)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-line px-4 py-2 text-xs text-muted">
                Stake {TOTAL}, return {money(TOTAL * (1 + a.profit))} on any result
              </div>
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}
