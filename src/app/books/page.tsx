import type { Metadata } from "next";
import { connection } from "next/server";
import { AutoRefresh } from "@/components/refresh";
import { PageHeader, Panel, Unreachable, td, th } from "@/components/ui";
import { api, load, type BookStatus } from "@/lib/api/client";
import { ago, bookName } from "@/lib/format";

export const metadata: Metadata = { title: "Bookmakers" };

const STALE_SECS = 180;

function role(b: BookStatus): string {
  if (b.book === "pinnacle") return "Sharp: sets the fair line";
  if (b.commission) return `Exchange, ${(b.commission * 100).toFixed(0)}% commission`;
  return "Bookmaker";
}

export default async function Books() {
  await connection();
  const data = await load(api.GET("/v1/books", { cache: "no-store" }));
  const now = Date.now();
  if (!data) return <Unreachable />;

  return (
    <>
      <AutoRefresh seconds={30} />
      <PageHeader eyebrow="Coverage" title="Bookmakers">
        Every source we read, how much it prices right now and when we last confirmed it. A price we cannot reconfirm
        within five minutes is dropped, so nothing here is older than that.
      </PageHeader>
      <Panel>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line">
            <tr>
              <th className={th}>Book</th>
              <th className={`${th} text-right`}>Games</th>
              <th className={`${th} text-right`}>Prices</th>
              <th className={`${th} text-right`} title="Games we could pair with a Pinnacle game">
                Matched
              </th>
              <th className={`${th} text-right`} title="Median difference in implied chance from Pinnacle on the same outcome">
                Gap to Pinnacle
              </th>
              <th className={th}>Last confirmed</th>
              <th className={th}>Role</th>
            </tr>
          </thead>
          <tbody>
            {data.map((b) => {
              const age = b.newest_seen_at ? (now - new Date(b.newest_seen_at).getTime()) / 1000 : Infinity;
              return (
                <tr key={b.book} className="border-b border-line/60 last:border-0">
                  <td className={td}>
                    <span className={`mr-2 inline-block h-2 w-2 rounded-full ${age < STALE_SECS ? "bg-win" : "bg-warn"}`} />
                    {bookName(b.book)}
                  </td>
                  <td className={`${td} tabular text-right font-mono`}>{b.events.toLocaleString("en-GB")}</td>
                  <td className={`${td} tabular text-right font-mono`}>{b.quotes.toLocaleString("en-GB")}</td>
                  <td className={`${td} tabular text-right font-mono text-muted`}>
                    {b.book === "pinnacle" ? "" : b.matched_events.toLocaleString("en-GB")}
                  </td>
                  <td className={`${td} tabular text-right font-mono text-muted`}>
                    {b.median_implied_gap === null || b.median_implied_gap === undefined
                      ? ""
                      : `${(b.median_implied_gap * 100).toFixed(2)}%`}
                  </td>
                  <td className={`${td} text-muted`}>{b.newest_seen_at ? ago(b.newest_seen_at, now) : "never"}</td>
                  <td className={`${td} text-muted`}>{role(b)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>
    </>
  );
}
