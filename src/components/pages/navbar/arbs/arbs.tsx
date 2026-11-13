"use client";

import { LiveStatusBadge } from "@/components/elements/live/live-status";
import { PriceAge } from "@/components/elements/live/price-age";
import { TickCell } from "@/components/elements/live/tick-cell";
import { LeagueLabel } from "@/components/elements/flag/league-label";
import { Chip, FilterRow } from "@/components/elements/odds/filter-chips";
import { Matchup } from "@/components/elements/participant/matchup";
import { VendorLabel } from "@/components/elements/vendor/vendor-logo";
import { Empty, Panel, Unreachable } from "@/components/elements/odds/panel";
import { PageHeading } from "@/components/elements/page/page-heading";
import { PageShell } from "@/components/elements/page/page-shell";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import type { Arb } from "@/lib/api/client";
import { kickoff, marketName, money, odds, percent, query, sideName, until } from "@/lib/format";
import { useLiveQuery, useNow } from "@/hooks/live/use-live-query-hook";
import { useRowFlash } from "@/hooks/live/use-row-flash-hook";
import { applyArbs } from "@/lib/live/apply";
import { fetchArbs } from "@/lib/live/actions";
import { queryKeys } from "@/lib/react-query/keys";
import { useLocale, useTranslations } from "next-intl";

const TOTAL = 100;

function keyOf(a: Arb): string {
  return a.id;
}

function sigOf(a: Arb): string {
  return `${a.profit.toFixed(5)}:${a.check}:${a.legs.map((l) => `${l.key}@${l.odds}`).join(",")}`;
}

export function Arbs(props: { data?: Arb[]; all: boolean; now: number }) {
  const t = useTranslations();
  const ta = useTranslations("ARBS");
  const locale = useLocale();
  const all = props.all;
  const live = useLiveQuery({
    queryKey: queryKeys.arbs(all),
    initialData: props.data ?? null,
    fetch: () => fetchArbs(all),
    topic: "arbs",
    filters: { include_check: all },
    apply: applyArbs,
  });
  const now = useNow(props.now);
  const data = live.data;
  const shown = useRowFlash(data ?? [], String(all), keyOf, sigOf);

  return (
    <PageShell>
      <PageHeading
        className="mb-0"
        status={<LiveStatusBadge status={live.status} />}
        label={ta("LABEL")}
        title={ta("HEADING")}
        description={ta("SUBHEADING", { total: String(TOTAL) })}
      />

      <FilterRow label={ta("FILTER_SHOW")}>
        <Chip active={!props.all} href={query("/arbs", {})}>
          {ta("TRUSTED")}
        </Chip>
        <Chip active={props.all} href={query("/arbs", { all: "1" })}>
          {ta("INCLUDE_STALE")}
        </Chip>
      </FilterRow>

      {!data && <Unreachable />}
      {data && data.length === 0 && (
        <Panel>
          <Empty>{ta("EMPTY")}</Empty>
        </Panel>
      )}
      {data && data.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {shown.rows.map((a) => (
            <Panel
              key={a.id}
              className={shown.flash(a.id)}
              title={ta("PROFIT", { profit: percent(a.profit, 2) })}
              action={
                a.check ? (
                  <Badge variant="destructive" className="rounded-sm font-normal">
                    {ta("STALE")}
                  </Badge>
                ) : undefined
              }
            >
              <div className="px-4 pt-3">
                <Link href={`/games/${encodeURIComponent(a.game_id)}`} className="underline-offset-4 hover:underline">
                  <Matchup event={a} />
                </Link>
                <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-1 text-[11px]">
                  <LeagueLabel event={a} />
                  <span>
                    {kickoff(a.starts_at, locale)}, {until(a.starts_at, now, locale, t)}
                  </span>
                </div>
                <div className="text-muted-foreground mt-1 text-xs">{marketName(a, t)}</div>
              </div>
              <div className="thin-scrollbar overflow-x-auto">
                <table className="mt-2 w-full text-sm">
                  <tbody>
                    {a.legs.map((l) => (
                      <tr key={l.key} className="border-t">
                        <td className="px-4 py-2">
                          {sideName({ market: a.market, side: l.side, line: a.line, home: a.home, away: a.away }, t)}
                        </td>
                        <td className="text-muted-foreground px-4 py-2 whitespace-nowrap">
                          <VendorLabel vendorKey={l.book} />
                        </td>
                        <TickCell value={Number(l.odds)} className="tabular px-4 py-2 text-right">
                          {odds(l.odds)}
                        </TickCell>
                        <td className="tabular px-4 py-2 text-right" title={ta("STAKE_HINT")}>
                          {(l.stake_share * TOTAL).toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <PriceAge iso={l.seen_at} serverNow={props.now} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-muted-foreground border-t px-4 py-2 text-xs">
                {ta("RETURN", { total: String(TOTAL), payout: money(TOTAL * (1 + a.profit), locale) })}
              </p>
            </Panel>
          ))}
        </div>
      )}
    </PageShell>
  );
}
