import { AutoRefresh } from "@/components/elements/odds/auto-refresh";
import { Chip, FilterRow } from "@/components/elements/odds/filter-chips";
import { Empty, Panel, Unreachable } from "@/components/elements/odds/panel";
import { PageHeading } from "@/components/elements/page/page-heading";
import { PageShell } from "@/components/elements/page/page-shell";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import type { Arb } from "@/lib/api/client";
import { ago, bookName, kickoff, marketName, money, odds, percent, query, sideName, until } from "@/lib/format";
import { useLocale, useTranslations } from "next-intl";

const TOTAL = 100;

export function Arbs(props: { data?: Arb[]; all: boolean; now: number }) {
  const t = useTranslations();
  const ta = useTranslations("ARBS");
  const locale = useLocale();
  const now = props.now;
  const data = props.data;

  return (
    <PageShell>
      <AutoRefresh seconds={15} />
      <PageHeading
        className="mb-0"
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
          {data.map((a) => (
            <Panel
              key={a.id}
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
                  {a.home} <span className="text-muted-foreground">{t("FORMAT.VS")}</span> {a.away}
                </Link>
                <div className="text-muted-foreground text-[11px]">
                  {a.league}, {kickoff(a.starts_at, locale)}, {until(a.starts_at, now, locale, t)}
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
                        <td className="text-muted-foreground px-4 py-2 whitespace-nowrap">{bookName(l.book)}</td>
                        <td className="tabular px-4 py-2 text-right">{odds(l.odds)}</td>
                        <td className="tabular px-4 py-2 text-right" title={ta("STAKE_HINT")}>
                          {(l.stake_share * TOTAL).toFixed(2)}
                        </td>
                        <td className="tabular text-muted-foreground px-4 py-2 text-right text-[11px] whitespace-nowrap">
                          {ago(l.seen_at, now, locale)}
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
