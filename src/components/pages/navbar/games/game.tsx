import { LeagueLabel } from "@/components/elements/flag/league-label";
import { AutoRefresh } from "@/components/elements/odds/auto-refresh";
import { Matchup } from "@/components/elements/participant/matchup";
import { MarketTable } from "@/components/elements/odds/market-table";
import { Panel } from "@/components/elements/odds/panel";
import { StatCard, StatGrid } from "@/components/elements/odds/stat-card";
import { PageHeading } from "@/components/elements/page/page-heading";
import { PageShell } from "@/components/elements/page/page-shell";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/i18n/navigation";
import type { Game } from "@/lib/api/client";
import { bookName } from "@/lib/config/vendor-registry";
import { count, kickoff, percent, until } from "@/lib/format";
import { useLocale, useTranslations } from "next-intl";

export function GameView(props: { data?: Game; now: number }) {
  const t = useTranslations();
  const tg = useTranslations("GAME");
  const locale = useLocale();
  const now = props.now;

  if (!props.data) {
    return (
      <PageShell>
        <PageHeading className="mb-0" label={t("NAV.ODDS")} title={tg("GONE_TITLE")} description={tg("GONE_BODY")} />
        <div>
          <Button variant="outline" nativeButton={false} render={<Link href="/games" />}>
            <Icon name="chevron-left" />
            {tg("BACK")}
          </Button>
        </div>
      </PageShell>
    );
  }

  const g = props.data.summary;
  return (
    <PageShell>
      <AutoRefresh seconds={30} />
      <nav className="text-muted-foreground flex flex-wrap items-center gap-1 text-xs">
        <Link href="/games" className="hover:text-foreground">
          {t("NAV.ODDS")}
        </Link>
        <span>/</span>
        <LeagueLabel event={g} />
      </nav>
      <PageHeading
        className="mb-0"
        label={`${g.league}, ${kickoff(g.starts_at, locale)}, ${until(g.starts_at, now, locale, t)}`}
        title={<Matchup event={g} size="default" className="gap-x-3" />}
        description={tg("SUBHEADING")}
      />
      <StatGrid className="sm:grid-cols-4">
        <StatCard icon="store" label={tg("STAT_BOOKS")} value={count(g.books.length, locale)} hint={g.books.map(bookName).join(", ")} />
        <StatCard icon="hash" label={tg("STAT_MARKETS")} value={count(g.markets, locale)} />
        <StatCard
          icon="trending-up"
          label={tg("STAT_VALUE")}
          value={count(g.value_bets, locale)}
          tone={g.value_bets > 0 ? "win" : undefined}
        />
        <StatCard
          icon="percent"
          label={tg("STAT_BEST_EV")}
          value={g.best_ev ? percent(g.best_ev) : tg("NONE")}
          tone={g.best_ev ? "win" : undefined}
        />
      </StatGrid>
      {props.data.markets.map((m) => (
        <Panel key={`${m.kind}:${m.period}:${m.line ?? ""}`}>
          <MarketTable market={m} home={g.home} away={g.away} now={now} valueLinks />
        </Panel>
      ))}
    </PageShell>
  );
}
