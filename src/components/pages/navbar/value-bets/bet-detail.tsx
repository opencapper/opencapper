import { AutoRefresh } from "@/components/elements/odds/auto-refresh";
import { ConfidenceBadge } from "@/components/elements/odds/confidence-badge";
import { Ev } from "@/components/elements/odds/ev";
import { MarketTable } from "@/components/elements/odds/market-table";
import { Panel } from "@/components/elements/odds/panel";
import { PriceChart } from "@/components/elements/odds/price-chart";
import { StakeCalculator } from "@/components/elements/odds/stake-calculator";
import { StatCard, StatGrid } from "@/components/elements/odds/stat-card";
import { PageHeading } from "@/components/elements/page/page-heading";
import { PageShell } from "@/components/elements/page/page-shell";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/i18n/navigation";
import type { BetDetail } from "@/lib/api/client";
import { ago, bookName, count, kickoff, marketName, odds, percent, prob, sideName, until } from "@/lib/format";
import { useLocale, useTranslations } from "next-intl";

const BOOK_COLOR = "#3b82f6";
const SHARP_COLOR = "#d97706";

const METHODS = [
  { key: "power", label: "METHOD_POWER", note: "METHOD_POWER_NOTE" },
  { key: "multiplicative", label: "METHOD_MULT", note: "METHOD_MULT_NOTE" },
  { key: "additive", label: "METHOD_ADD", note: "METHOD_ADD_NOTE" },
  { key: "worst_case", label: "METHOD_WORST", note: "METHOD_WORST_NOTE" },
] as const;

const HEAD = "label-mono text-foreground/45 px-4 py-2 text-[10px] font-normal";

export function BetDetailView(props: { data?: BetDetail; now: number }) {
  const t = useTranslations();
  const tb = useTranslations("BET");
  const locale = useLocale();
  const now = props.now;

  if (!props.data) {
    return (
      <PageShell>
        <PageHeading className="mb-0" label={tb("LABEL")} title={tb("GONE_TITLE")} description={tb("GONE_BODY")} />
        <div>
          <Button variant="outline" nativeButton={false} render={<Link href="/value-bets" />}>
            <Icon name="chevron-left" />
            {tb("BACK")}
          </Button>
        </div>
      </PageShell>
    );
  }

  const data = props.data;
  const b = data.bet;
  const book = bookName(b.book);
  const outcome = data.market.outcomes.find((o) => o.side === b.side);
  const others = outcome?.prices.filter((p) => p.book !== b.book) ?? [];

  return (
    <PageShell>
      <AutoRefresh seconds={30} />
      <nav className="text-muted-foreground flex flex-wrap items-center gap-1 text-xs">
        <Link href="/value-bets" className="hover:text-foreground">
          {t("NAV.VALUE_BETS")}
        </Link>
        <span>/</span>
        <Link href={`/games/${encodeURIComponent(b.game_id)}`} className="hover:text-foreground">
          {b.home} {t("FORMAT.VS")} {b.away}
        </Link>
      </nav>
      <PageHeading
        className="mb-0"
        label={`${b.league}, ${kickoff(b.starts_at, locale)}, ${until(b.starts_at, now, locale, t)}`}
        title={tb("TITLE", { bet: sideName(b, t), book })}
        description={tb("SUMMARY", {
          market: marketName(b, t),
          home: b.home,
          away: b.away,
          book,
          odds: odds(b.odds),
          fair: odds(b.fair_odds),
          chance: prob(b.fair_probability),
        })}
      />

      <StatGrid className="sm:grid-cols-5">
        <StatCard label={tb("STAT_EV")} value={percent(b.ev)} tone="win" />
        <StatCard
          label={tb("STAT_SAFE_EV")}
          value={percent(b.ev_conservative)}
          tone={b.ev_conservative > 0 ? "win" : "warn"}
          hint={tb("SAFE_HINT")}
        />
        <StatCard label={tb("STAT_ODDS")} value={odds(b.odds)} />
        <StatCard label={tb("STAT_FAIR")} value={odds(b.fair_odds)} />
        <StatCard label={tb("STAT_CONFIDENCE")} value={<ConfidenceBadge value={b.confidence} />} />
      </StatGrid>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Panel title={tb("MARKET_TITLE")}>
            <MarketTable market={data.market} home={b.home} away={b.away} now={now} highlight={b.id} valueLinks />
          </Panel>

          <Panel title={tb("HISTORY_TITLE")}>
            <PriceChart
              bookLabel={book}
              bookColor={BOOK_COLOR}
              sharpColor={SHARP_COLOR}
              book={data.book_history}
              sharp={data.sharp_history}
              now={now}
            />
          </Panel>

          <Panel title={tb("DEVIG_TITLE")}>
            <div className="thin-scrollbar overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className={`${HEAD} text-left`}>{tb("COL_METHOD")}</th>
                    <th className={`${HEAD} text-right`}>{tb("COL_CHANCE")}</th>
                    <th className={`${HEAD} text-right`}>{tb("COL_FAIR_ODDS")}</th>
                    <th className={`${HEAD} text-right`}>{tb("COL_EV_AT", { odds: odds(b.odds) })}</th>
                  </tr>
                </thead>
                <tbody>
                  {METHODS.map((m) => {
                    const p = b.fair[m.key];
                    return (
                      <tr key={m.key} className="border-b last:border-0">
                        <td className="px-4 py-2.5">
                          <div>{tb(m.label)}</div>
                          <div className="text-muted-foreground text-[11px]">{tb(m.note)}</div>
                        </td>
                        <td className="tabular px-4 py-2.5 text-right">{prob(p)}</td>
                        <td className="tabular px-4 py-2.5 text-right">{odds(1 / p)}</td>
                        <td className="px-4 py-2.5 text-right">
                          <Ev value={Number(b.odds) * p - 1} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-muted-foreground border-t px-4 py-3 text-xs leading-relaxed">
              {tb("DEVIG_NOTE", {
                margin: percent(b.sharp_overround),
                stake: b.sharp_max_stake ? count(Number(b.sharp_max_stake), locale) : tb("UNKNOWN_STAKE"),
                sharpSeen: ago(b.sharp_seen_at, now, locale),
                book,
                bookSeen: ago(b.book_seen_at, now, locale),
              })}
            </p>
          </Panel>
        </div>

        <div className="flex flex-col gap-6">
          <Panel title={tb("STAKE_TITLE")}>
            <StakeCalculator odds={Number(b.odds)} probability={b.fair_probability} />
          </Panel>

          <Panel title={tb("ELSEWHERE_TITLE")}>
            {others.length === 0 ? (
              <p className="text-muted-foreground px-4 py-3 text-sm">{tb("ELSEWHERE_EMPTY")}</p>
            ) : (
              <ul className="divide-y text-sm">
                {others.map((p) => (
                  <li key={p.key} className="flex items-center justify-between px-4 py-2">
                    <span>{bookName(p.book)}</span>
                    <span className="flex items-center gap-3">
                      <Ev value={p.ev} className="text-xs" />
                      <span className="tabular w-12 text-right">{odds(p.odds)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title={tb("BEFORE_TITLE")}>
            <ul className="text-muted-foreground flex list-disc flex-col gap-1.5 py-3 pr-4 pl-8 text-xs leading-relaxed">
              <li>{tb("BEFORE_PRICE", { book, odds: odds(b.odds) })}</li>
              <li>{tb("BEFORE_FAIR", { fair: odds(b.fair_odds) })}</li>
              <li>{tb("BEFORE_ROUND")}</li>
              <li>{tb("BEFORE_MIX")}</li>
            </ul>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
