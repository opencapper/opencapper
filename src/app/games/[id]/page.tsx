import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { MarketTable } from "@/components/market-table";
import { AutoRefresh } from "@/components/refresh";
import { PageHeader, Panel, Stat } from "@/components/ui";
import { api, load } from "@/lib/api/client";
import { bookName, kickoff, percent, until } from "@/lib/format";

export const metadata: Metadata = { title: "Game" };

export default async function GamePage(props: PageProps<"/games/[id]">) {
  await connection();
  const params = await props.params;
  const id = decodeURIComponent(params.id);
  const data = await load(api.GET("/v1/games/{id}", { params: { path: { id } }, cache: "no-store" }));
  const now = Date.now();

  if (!data) {
    return (
      <>
        <PageHeader eyebrow="Odds screen" title="Game not found">
          It has started or no book prices it any more.
        </PageHeader>
        <Link href="/games" className="text-sm underline">
          Back to games
        </Link>
      </>
    );
  }

  const g = data.summary;
  return (
    <>
      <AutoRefresh seconds={30} />
      <div className="text-xs text-muted">
        <Link href="/games" className="hover:text-foreground">
          Odds screen
        </Link>{" "}
        / {g.league}
      </div>
      <PageHeader eyebrow={`${g.league}, ${kickoff(g.starts_at)}, ${until(g.starts_at, now)}`} title={`${g.home} v ${g.away}`}>
        Green prices beat the fair line. Hover a price to see its EV and when it was last confirmed. Pinnacle is shown in
        amber.
      </PageHeader>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Books" value={String(g.books.length)} hint={g.books.map(bookName).join(", ")} />
        <Stat label="Markets" value={String(g.markets)} />
        <Stat label="Value bets" value={String(g.value_bets)} tone={g.value_bets > 0 ? "win" : undefined} />
        <Stat label="Best EV" value={g.best_ev ? percent(g.best_ev) : "none"} tone={g.best_ev ? "win" : undefined} />
      </div>
      {data.markets.map((m) => (
        <Panel key={`${m.kind}:${m.period}:${m.line ?? ""}`}>
          <MarketTable market={m} home={g.home} away={g.away} now={now} valueLinks />
        </Panel>
      ))}
    </>
  );
}
