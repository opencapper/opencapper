import { Chip, FilterRow } from "@/components/elements/odds/filter-chips";
import { Empty, Panel, Unreachable } from "@/components/elements/odds/panel";
import { StatCard, StatGrid } from "@/components/elements/odds/stat-card";
import { VendorLabel } from "@/components/elements/vendor/vendor-logo";
import { PageHeading } from "@/components/elements/page/page-heading";
import { PageShell } from "@/components/elements/page/page-shell";
import type { Bet, BetStats, BetStatus, BetTotals } from "@/lib/api/client";
import { count, currency, percent, query } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { AddBet } from "./add-bet";
import { BET_STATUSES, statusLabel } from "./bet-status";
import { BetsTable } from "./bets-table";
import { ProfitChart } from "./profit-chart";
import { TrackerTabs } from "./tracker-tabs";

const HEAD = "label-mono text-foreground/45 px-4 py-2 text-[10px] font-normal";

function tone(value: number): string | undefined {
  if (value > 0) return "text-success";
  if (value < 0) return "text-destructive";
  return undefined;
}

export function TrackerShell(props: { active: "/tracker" | "/tracker/health"; children: ReactNode }) {
  const t = useTranslations("TRACKER");
  return (
    <PageShell>
      <PageHeading className="mb-0" label={t("LABEL")} title={t("HEADING")} description={t("SUBHEADING")} />
      <TrackerTabs active={props.active} />
      {props.children}
    </PageShell>
  );
}

function TotalsTable(props: {
  title: string;
  first: string;
  rows: { key: string; label: ReactNode; totals: BetTotals }[];
  currency: string;
}) {
  const t = useTranslations("TRACKER");
  const locale = useLocale();
  return (
    <Panel title={props.title}>
      {props.rows.length === 0 ? (
        <Empty>{t("TOTALS_EMPTY")}</Empty>
      ) : (
        <div className="thin-scrollbar overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className={`${HEAD} text-left`}>{props.first}</th>
                <th className={`${HEAD} text-right`}>{t("KPI_BETS")}</th>
                <th className={`${HEAD} text-right`}>{t("KPI_STAKED")}</th>
                <th className={`${HEAD} text-right`}>{t("KPI_PROFIT")}</th>
                <th className={`${HEAD} text-right`}>{t("KPI_ROI")}</th>
              </tr>
            </thead>
            <tbody>
              {props.rows.map((r) => (
                <tr key={r.key} className="border-b last:border-0">
                  <td className="px-4 py-2 whitespace-nowrap">{r.label}</td>
                  <td className="tabular px-4 py-2 text-right">{count(r.totals.bets, locale)}</td>
                  <td className="tabular px-4 py-2 text-right whitespace-nowrap">
                    {currency(Number(r.totals.staked), locale, props.currency)}
                  </td>
                  <td className={cn("tabular px-4 py-2 text-right whitespace-nowrap", tone(Number(r.totals.profit)))}>
                    {currency(Number(r.totals.profit), locale, props.currency)}
                  </td>
                  <td className={cn("tabular px-4 py-2 text-right", tone(r.totals.roi ?? 0))}>
                    {r.totals.roi === null || r.totals.roi === undefined ? "" : percent(r.totals.roi)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function monthLabel(month: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${month.slice(0, 7)}-01T00:00:00Z`));
}

export function Tracker(props: {
  stats?: BetStats;
  bets?: Bet[];
  books: string[];
  status?: BetStatus;
  currency: string;
}) {
  const t = useTranslations();
  const tt = useTranslations("TRACKER");
  const locale = useLocale();
  if (!props.stats || !props.bets) {
    return (
      <TrackerShell active="/tracker">
        <Unreachable />
      </TrackerShell>
    );
  }
  const s = props.stats.totals;
  const profit = Number(s.profit);
  const money = (x: string) => currency(Number(x), locale, props.currency);

  return (
    <TrackerShell active="/tracker">
      <StatGrid className="sm:grid-cols-4 lg:grid-cols-7">
        <StatCard
          icon="hash"
          label={tt("KPI_BETS")}
          value={count(s.bets, locale)}
          hint={tt("KPI_BETS_HINT", { open: String(s.open), won: String(s.won), lost: String(s.lost) })}
        />
        <StatCard icon="coins" label={tt("KPI_STAKED")} value={money(s.staked)} />
        <StatCard
          icon="trending-up"
          label={tt("KPI_PROFIT")}
          value={money(s.profit)}
          tone={profit > 0 ? "win" : profit < 0 ? "bad" : undefined}
          hint={tt("KPI_EXPECTED", { expected: money(s.expected_profit) })}
        />
        <StatCard
          icon="percent"
          label={tt("KPI_ROI")}
          value={s.roi === null || s.roi === undefined ? t("FORMAT.NA") : percent(s.roi)}
          tone={s.roi ? (s.roi > 0 ? "win" : "bad") : undefined}
        />
        <StatCard
          icon="target"
          label={tt("KPI_EV")}
          value={s.avg_ev_at_bet === null || s.avg_ev_at_bet === undefined ? t("FORMAT.NA") : percent(s.avg_ev_at_bet)}
        />
        <StatCard
          icon="chart-line"
          label={tt("KPI_CLV")}
          value={s.avg_clv === null || s.avg_clv === undefined ? t("FORMAT.NA") : percent(s.avg_clv)}
          tone={s.avg_clv ? (s.avg_clv > 0 ? "win" : "bad") : undefined}
          hint={tt("KPI_CLV_HINT")}
        />
        <StatCard
          icon="shield-check"
          label={tt("KPI_BEAT")}
          value={
            s.beat_close_share === null || s.beat_close_share === undefined
              ? t("FORMAT.NA")
              : `${Math.round(s.beat_close_share * 100)}%`
          }
          hint={tt("KPI_BEAT_HINT", { closed: String(s.closed) })}
        />
      </StatGrid>

      <Panel title={tt("CHART_TITLE")}>
        <ProfitChart daily={props.stats.daily} currency={props.currency} />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <TotalsTable
          title={tt("BY_BOOK")}
          first={tt("COL_BOOK")}
          currency={props.currency}
          rows={props.stats.by_book.map((b) => ({ key: b.book, label: <VendorLabel vendorKey={b.book} />, totals: b.totals }))}
        />
        <TotalsTable
          title={tt("BY_MONTH")}
          first={tt("MONTH")}
          currency={props.currency}
          rows={props.stats.by_month.map((m) => ({ key: m.month, label: monthLabel(m.month, locale), totals: m.totals }))}
        />
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FilterRow label={tt("FILTER_STATUS")}>
            <Chip active={!props.status} href="/tracker">
              {t("COMMON.ALL")}
            </Chip>
            {BET_STATUSES.map((st) => (
              <Chip key={st} active={props.status === st} href={query("/tracker", { status: st })}>
                {statusLabel(st, t)}
              </Chip>
            ))}
          </FilterRow>
          <AddBet books={props.books} />
        </div>
        <BetsTable bets={props.bets} currency={props.currency} />
      </section>
    </TrackerShell>
  );
}
