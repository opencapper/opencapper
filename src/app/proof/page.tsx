import type { Metadata } from "next";
import { connection } from "next/server";
import { ConfidenceBadge, Empty, Ev, PageHeader, Panel, Stat, Unreachable, td, th } from "@/components/ui";
import { api, load, type LedgerEntry } from "@/lib/api/client";
import { bookName, kickoff, marketName, odds, percent, sideName } from "@/lib/format";

export const metadata: Metadata = { title: "Proof" };

const STATUS: Record<LedgerEntry["status"], string> = {
  open: "Before kickoff",
  closed: "Closed",
  no_close: "No closing price",
};

export default async function Proof() {
  await connection();
  const data = await load(api.GET("/v1/ledger", { params: { query: { limit: 500 } }, cache: "no-store" }));
  if (!data) return <Unreachable />;
  const s = data.stats;
  const beat = s.closed > 0 ? s.beat_close / s.closed : undefined;

  return (
    <>
      <PageHeader eyebrow="Public record" title="Every alert, next to the closing line">
        Each bet that crosses +2% EV is written down the moment it is found, with the price and the fair odds at that
        moment. Nothing is removed afterwards. At kickoff the last Pinnacle fair price becomes the closing line. Beating
        the close is the best evidence an edge was real, long before results settle it.
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat label="Alerts" value={String(s.alerts)} />
        <Stat label="Waiting for kickoff" value={String(s.open)} />
        <Stat label="Closed" value={String(s.closed)} />
        <Stat
          label="Beat the close"
          value={beat === undefined ? "n/a" : `${(beat * 100).toFixed(0)}%`}
          tone={beat === undefined ? undefined : beat >= 0.5 ? "win" : "bad"}
        />
        <Stat
          label="Average CLV"
          value={s.avg_clv === null || s.avg_clv === undefined ? "n/a" : percent(s.avg_clv)}
          tone={s.avg_clv ? (s.avg_clv > 0 ? "win" : "bad") : undefined}
          hint="Alert odds against the closing fair odds"
        />
      </div>

      <Panel title="Ledger">
        {data.entries.length === 0 ? (
          <Empty>No alerts yet.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-line">
                <tr>
                  <th className={th}>Alerted</th>
                  <th className={th}>Bet</th>
                  <th className={th}>Book</th>
                  <th className={`${th} text-right`}>Odds</th>
                  <th className={`${th} text-right`}>Fair then</th>
                  <th className={`${th} text-right`}>EV then</th>
                  <th className={`${th} text-right`}>Fair at close</th>
                  <th className={`${th} text-right`}>CLV</th>
                  <th className={th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.entries.map((e) => (
                  <tr key={e.id} className="border-b border-line/60 last:border-0">
                    <td className={`${td} whitespace-nowrap text-xs text-muted`}>{kickoff(e.alerted_at)}</td>
                    <td className={td}>
                      <div>{sideName(e)}</div>
                      <div className="text-[11px] text-muted">
                        {marketName(e)}, {e.home} v {e.away}
                      </div>
                    </td>
                    <td className={td}>
                      <div>{bookName(e.book)}</div>
                      <ConfidenceBadge value={e.confidence} />
                    </td>
                    <td className={`${td} tabular text-right font-mono`}>{odds(e.alert_odds)}</td>
                    <td className={`${td} tabular text-right font-mono text-muted`}>{odds(e.alert_fair_odds)}</td>
                    <td className={`${td} text-right`}>
                      <Ev value={e.alert_ev} />
                    </td>
                    <td className={`${td} tabular text-right font-mono text-muted`}>
                      {e.closing_fair_odds ? odds(e.closing_fair_odds) : e.last_fair_odds ? `${odds(e.last_fair_odds)} now` : "n/a"}
                    </td>
                    <td className={`${td} text-right`}>
                      <Ev value={e.clv} />
                    </td>
                    <td className={`${td} text-xs text-muted`}>{STATUS[e.status]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
