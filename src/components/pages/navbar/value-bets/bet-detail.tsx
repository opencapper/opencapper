"use client";

import { LiveStatusBadge } from "@/components/elements/live/live-status";
import { PriceAge } from "@/components/elements/live/price-age";
import { TickText } from "@/components/elements/live/tick-cell";
import { ConfidenceBadge } from "@/components/elements/odds/confidence-badge";
import { Ev } from "@/components/elements/odds/ev";
import { LeagueLabel } from "@/components/elements/flag/league-label";
import { Matchup } from "@/components/elements/participant/matchup";
import { VendorLabel, VendorLogo } from "@/components/elements/vendor/vendor-logo";
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
import { TrackBet } from "@/components/elements/account/track-bet";
import { bookName } from "@/lib/config/vendor-registry";
import { ago, count, DEFAULT_PLAN, feeOf, kickoff, marketName, netOdds, odds, oddsOf, percent, prob, sideName, until, type BookFee, type StakePlan } from "@/lib/format";
import { useLiveQuery, useNow } from "@/hooks/live/use-live-query-hook";
import { applyBet, betNeedsReload } from "@/lib/live/apply";
import { fetchBet } from "@/lib/live/actions";
import { queryKeys } from "@/lib/react-query/keys";
import { useLocale, useTranslations } from "next-intl";

// Blue for the book you would bet, grey for the reference: green stays reserved for value.
const BOOK_COLOR = "var(--chart-1)";
const SHARP_COLOR = "var(--chart-3)";

const METHODS = [
  { key: "power", label: "METHOD_POWER", note: "METHOD_POWER_NOTE" },
  { key: "multiplicative", label: "METHOD_MULT", note: "METHOD_MULT_NOTE" },
  { key: "additive", label: "METHOD_ADD", note: "METHOD_ADD_NOTE" },
  { key: "worst_case", label: "METHOD_WORST", note: "METHOD_WORST_NOTE" },
] as const;

const HEAD = "eyebrow text-foreground/45 px-4 py-2 text-[10px] font-normal";

export function BetDetailView(props: { id: string; data?: BetDetail; fees: BookFee[]; plan?: StakePlan; now: number }) {
  const t = useTranslations();
  const tb = useTranslations("BET");
  const locale = useLocale();
  const id = props.id;
  const live = useLiveQuery({
    queryKey: queryKeys.bet(id),
    initialData: props.data ?? null,
    fetch: () => fetchBet(id),
    topic: `bet:${id}`,
    apply: applyBet,
    reloadWhen: betNeedsReload,
  });
  const now = useNow(props.now);
  const status = <LiveStatusBadge status={live.status} />;

  if (!live.data) {
    return (
      <PageShell>
        <PageHeading
          className="mb-0"
          status={status}
          label={tb("LABEL")}
          title={tb("GONE_TITLE")}
          description={tb("GONE_BODY")}
        />
        <div>
          <Button variant="outline" nativeButton={false} render={<Link href="/value-bets" />}>
            <Icon name="chevron-left" />
            {tb("BACK")}
          </Button>
        </div>
      </PageShell>
    );
  }

  const data = live.data;
  const b = data.bet;
  const book = bookName(b.book);
  const fee = feeOf(props.fees, b.book);
  const net = netOdds(Number(b.odds), fee);
  const title = tb("TITLE", { bet: sideName(b, t), book });
  const outcome = data.market.outcomes.find((o) => o.side === b.side);
  const others = outcome?.prices.filter((p) => p.book !== b.book) ?? [];

  return (
    <PageShell>
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
        status={status}
        label={`${b.league}, ${kickoff(b.starts_at, locale)}, ${until(b.starts_at, now, locale, t)}`}
        title={
          <span className="inline-flex items-center gap-3">
            <VendorLogo vendorKey={b.book} size={32} />
            <span>{title}</span>
          </span>
        }
        description={tb("SUMMARY", {
          market: marketName(b, t),
          home: b.home,
          away: b.away,
          book,
          odds: odds(b.odds),
          fair: odds(b.fair_odds),
          chance: prob(b.fair_probability),
        })}
      >
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <Link href={`/games/${encodeURIComponent(b.game_id)}`} className="underline-offset-4 hover:underline">
            <Matchup event={data.game} size="default" />
          </Link>
          <LeagueLabel event={data.game} className="text-muted-foreground text-xs" />
        </div>
        <div className="mt-4">
          <TrackBet
            source={{ from_value_bet: b.id }}
            odds={b.odds}
            probability={b.fair_probability}
            fee={fee}
            title={title}
            plan={props.plan}
          />
        </div>
      </PageHeading>

      <StatGrid className="sm:grid-cols-5">
        <StatCard label={tb("STAT_EV")} value={<TickText value={b.ev}>{percent(b.ev)}</TickText>} tone="win" />
        <StatCard
          label={tb("STAT_SAFE_EV")}
          value={percent(b.ev_conservative)}
          tone={b.ev_conservative > 0 ? "win" : "warn"}
          hint={tb("SAFE_HINT")}
        />
        <StatCard
          label={tb("STAT_ODDS")}
          value={<TickText value={Number(b.odds)}>{odds(b.odds)}</TickText>}
          note={<PriceAge iso={b.book_seen_at} serverNow={props.now} prefix={book} />}
        />
        <StatCard
          label={tb("STAT_FAIR")}
          value={<TickText value={Number(b.fair_odds)}>{odds(b.fair_odds)}</TickText>}
          note={
            <PriceAge
              iso={b.sharp_seen_at}
              serverNow={props.now}
              prefix={
                b.exchange_probability
                  ? `${t("LANDING.BOARD.REF_PINNACLE", { odds: odds(b.sharp_odds) })}, ${t("LANDING.BOARD.REF_EXCHANGE", { odds: oddsOf(b.exchange_probability) })}`
                  : t("LANDING.BOARD.REF_PINNACLE", { odds: odds(b.sharp_odds) })
              }
            />
          }
        />
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
                    <th className={`${HEAD} text-right`}>{tb("COL_EV_AT", { odds: odds(net) })}</th>
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
                          <Ev value={net * p - 1} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {fee && (
              <p className="text-warning border-t px-4 py-3 text-xs leading-relaxed">
                {fee.commission
                  ? tb("FEE_COMMISSION", {
                      book,
                      commission: `${Math.round(fee.commission * 1000) / 10}%`,
                      odds: odds(b.odds),
                      net: odds(net),
                    })
                  : tb("FEE_TAKER", {
                      book,
                      fee: `${Math.round((fee.taker_fee ?? 0) * 1000) / 10}%`,
                      odds: odds(b.odds),
                      net: odds(net),
                    })}
              </p>
            )}
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
            <StakeCalculator odds={net} probability={b.fair_probability} plan={props.plan ?? DEFAULT_PLAN} />
          </Panel>

          <Panel title={tb("ELSEWHERE_TITLE")}>
            {others.length === 0 ? (
              <p className="text-muted-foreground px-4 py-3 text-sm">{tb("ELSEWHERE_EMPTY")}</p>
            ) : (
              <ul className="divide-y text-sm">
                {others.map((p) => (
                  <li key={p.key} className="flex items-center justify-between gap-2 px-4 py-2">
                    <VendorLabel vendorKey={p.book} />
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
