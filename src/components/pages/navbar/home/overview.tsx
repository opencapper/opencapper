import { AutoRefresh } from "@/components/elements/odds/auto-refresh";
import { ConfidenceBadge } from "@/components/elements/odds/confidence-badge";
import { Ev } from "@/components/elements/odds/ev";
import { Panel, PanelLink, Unreachable } from "@/components/elements/odds/panel";
import { StatCard, StatGrid } from "@/components/elements/odds/stat-card";
import { VendorLabel, VendorLogo } from "@/components/elements/vendor/vendor-logo";
import { PageHeading } from "@/components/elements/page/page-heading";
import { PageShell } from "@/components/elements/page/page-shell";
import { Link } from "@/i18n/navigation";
import type { Arb, BookStatus, LedgerView, ValueBetList } from "@/lib/api/client";
import { bookName } from "@/lib/config/vendor-registry";
import { ago, count, marketName, odds, percent, sideName, until } from "@/lib/format";
import { groupBets } from "@/lib/group";
import { useLocale, useTranslations } from "next-intl";

export function Overview(props: {
  bets?: ValueBetList;
  arbs?: Arb[];
  ledger?: LedgerView;
  books?: BookStatus[];
  now: number;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const bets = props.bets;
  const arbs = props.arbs;
  const ledger = props.ledger;
  const books = props.books;
  if (!bets || !arbs || !ledger || !books) {
    return (
      <PageShell>
        <Unreachable />
      </PageShell>
    );
  }

  const top = groupBets(bets.bets.filter((b) => b.confidence !== "low")).slice(0, 8);
  const soft = books.filter((b) => b.book !== "pinnacle");
  const l = ledger.stats;
  const now = props.now;

  return (
    <PageShell>
      <AutoRefresh seconds={20} />
      <PageHeading
        className="mb-0"
        label={t("OVERVIEW.LABEL")}
        title={t("OVERVIEW.HEADING")}
        description={t("OVERVIEW.SUBHEADING", { books: String(soft.length) })}
      />

      <StatGrid className="sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon="trending-up" label={t("OVERVIEW.STAT_VALUE_BETS")} value={count(groupBets(bets.bets).length, locale)} tone="win" />
        <StatCard icon="scale" label={t("OVERVIEW.STAT_ARBS")} value={count(arbs.length, locale)} />
        <StatCard icon="target" label={t("OVERVIEW.STAT_MATCHED")} value={count(bets.stats.matched_events, locale)} />
        <StatCard icon="hash" label={t("OVERVIEW.STAT_PRICES")} value={count(bets.stats.quotes, locale)} />
        <StatCard icon="shield-check" label={t("OVERVIEW.STAT_ALERTS")} value={count(l.alerts, locale)} />
        <StatCard
          icon="clock"
          label={t("COMMON.UPDATED")}
          value={bets.stats.updated_at ? ago(bets.stats.updated_at, now, locale) : t("FORMAT.NEVER")}
        />
      </StatGrid>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <Panel
          title={t("OVERVIEW.TOP_TITLE")}
          action={<PanelLink href="/value-bets">{t("OVERVIEW.ALL_VALUE_BETS")}</PanelLink>}
        >
          <ul className="divide-y">
            {top.length === 0 && (
              <li className="text-muted-foreground px-4 py-8 text-center text-sm">{t("OVERVIEW.TOP_EMPTY")}</li>
            )}
            {top.map((g) => (
              <li key={g.key}>
                <Link
                  href={`/value-bets/${encodeURIComponent(g.best.id)}`}
                  className="hover:bg-muted/50 grid grid-cols-[64px_1fr_auto] items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                >
                  <Ev value={g.best.ev} className="font-medium" />
                  <span className="flex min-w-0 items-center gap-2.5">
                    <VendorLogo vendorKey={g.best.book} size={24} />
                    <span className="min-w-0">
                      <span className="block truncate">
                        {t("OVERVIEW.BET_AT", { bet: sideName(g.best, t), book: bookName(g.best.book) })}
                      </span>
                      <span className="text-muted-foreground block truncate text-[11px]">
                        {t("OVERVIEW.BET_CONTEXT", {
                          market: marketName(g.best, t),
                          home: g.best.home,
                          away: g.best.away,
                          when: until(g.best.starts_at, now, locale, t),
                        })}
                      </span>
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="tabular">{odds(g.best.odds)}</span>
                    <span className="hidden sm:inline">
                      <ConfidenceBadge value={g.best.confidence} />
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="flex flex-col gap-6">
          <Panel title={t("OVERVIEW.PROOF_TITLE")} action={<PanelLink href="/proof">{t("OVERVIEW.LEDGER")}</PanelLink>}>
            <dl className="tabular grid grid-cols-2 gap-y-1.5 px-4 py-3 text-sm">
              <dt className="text-muted-foreground font-sans">{t("PROOF.STAT_ALERTS")}</dt>
              <dd className="text-right">{count(l.alerts, locale)}</dd>
              <dt className="text-muted-foreground font-sans">{t("PROOF.STAT_CLOSED")}</dt>
              <dd className="text-right">{count(l.closed, locale)}</dd>
              <dt className="text-muted-foreground font-sans">{t("PROOF.STAT_BEAT")}</dt>
              <dd className="text-right">
                {l.closed > 0 ? `${Math.round((l.beat_close / l.closed) * 100)}%` : t("FORMAT.NA")}
              </dd>
              <dt className="text-muted-foreground font-sans">{t("PROOF.STAT_CLV")}</dt>
              <dd className="text-right">
                {l.avg_clv === null || l.avg_clv === undefined ? t("FORMAT.NA") : percent(l.avg_clv)}
              </dd>
            </dl>
          </Panel>
          <Panel title={t("OVERVIEW.SOURCES_TITLE")} action={<PanelLink href="/books">{t("OVERVIEW.ALL")}</PanelLink>}>
            <ul className="divide-y text-sm">
              {books.map((b) => (
                <li key={b.book} className="flex items-center justify-between gap-2 px-4 py-1.5">
                  <VendorLabel vendorKey={b.book} />
                  <span className="tabular text-muted-foreground text-xs">
                    {t("OVERVIEW.GAMES_COUNT", { count: b.events })}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
