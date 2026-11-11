import { LeagueLabel } from "@/components/elements/flag/league-label";
import { ConfidenceBadge } from "@/components/elements/odds/confidence-badge";
import { Ev, evTone } from "@/components/elements/odds/ev";
import { MarketTable } from "@/components/elements/odds/market-table";
import { PriceChart } from "@/components/elements/odds/price-chart";
import { Matchup } from "@/components/elements/participant/matchup";
import { VendorLabel, VendorLogo } from "@/components/elements/vendor/vendor-logo";
import { Link } from "@/i18n/navigation";
import type { BetDetail, BookStatus } from "@/lib/api/client";
import { bookName } from "@/lib/config/vendor-registry";
import { ago, count, feeOf, marketName, netOdds, odds, percent, prob, sideName, until } from "@/lib/format";
import type { GroupedBet } from "@/lib/group";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { FrameLink, HAIRLINE_GRID, Panel, Row, Stat, TD, TH } from "./dash-parts";

const METHODS = [
  { key: "power", label: "BET.METHOD_POWER" },
  { key: "multiplicative", label: "BET.METHOD_MULT" },
  { key: "additive", label: "BET.METHOD_ADD" },
  { key: "worst_case", label: "BET.METHOD_WORST" },
] as const;

function betHref(id: string): string {
  return `/value-bets/${encodeURIComponent(id)}`;
}

export function ValueBetsView(props: { groups: GroupedBet[]; top: GroupedBet[]; now: number }) {
  const t = useTranslations();
  const locale = useLocale();
  const high = props.groups.filter((g) => g.best.confidence === "high").length;
  const books = new Set(props.groups.flatMap((g) => g.offers.map((o) => o.book))).size;
  const best = props.top[0]?.best;

  return (
    <div className="flex flex-col gap-3">
      <div className={cn(HAIRLINE_GRID, "grid-cols-2 @2xl:grid-cols-4")}>
        <Stat
          icon="trending-up"
          label={t("LANDING.DASH.STAT_VALUE")}
          value={count(props.groups.length, locale)}
          hint={t("LANDING.DASH.STAT_VALUE_HINT")}
          tone="text-success"
        />
        <Stat
          icon="shield-check"
          label={t("LANDING.DASH.STAT_HIGH")}
          value={count(high, locale)}
          hint={t("CONFIDENCE.HINT_HIGH")}
        />
        <Stat
          icon="target"
          label={t("LANDING.DASH.STAT_BEST")}
          value={best ? percent(best.ev) : t("FORMAT.NA")}
          hint={best ? `${sideName(best, t)}, ${bookName(best.book)}` : t("FORMAT.NA")}
          tone={best ? evTone(best.ev) : undefined}
        />
        <Stat
          icon="store"
          label={t("LANDING.DASH.STAT_BOOKS")}
          value={count(books, locale)}
          hint={t("LANDING.DASH.STAT_BOOKS_HINT")}
        />
      </div>
      <Panel
        title={t("LANDING.DASH.TOP_TITLE")}
        icon="trending-up"
        meta={<FrameLink href="/value-bets">{t("LANDING.DASH.ALL_VALUE_BETS")}</FrameLink>}
      >
        <ul className="divide-foreground/6 divide-y">
          {props.top.map((g) => (
            <li key={g.key}>
              <Link
                href={betHref(g.best.id)}
                className="hover:bg-muted/50 grid grid-cols-[56px_1fr_auto] items-center gap-3 px-3 py-2 text-[12px] transition-colors @xl:grid-cols-[56px_1fr_150px_90px]"
              >
                <Ev value={g.best.ev} className="font-medium" />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-foreground/90 truncate">
                    {sideName(g.best, t)}
                    <span className="text-foreground/40 ml-1.5 text-[10px]">{marketName(g.best, t)}</span>
                  </span>
                  <Matchup event={g.best} size="xs" className="text-foreground/50 text-[11px]" />
                </span>
                <span className="text-foreground/70 hidden min-w-0 @xl:block">
                  <VendorLabel vendorKey={g.best.book} size={14} />
                </span>
                <span className="tabular flex flex-col items-end">
                  <span className="text-foreground/90">{odds(g.best.odds)}</span>
                  <span className="text-foreground/40 text-[10px]">{until(g.best.starts_at, props.now, locale, t)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

export function OddsView(props: { detail: BetDetail; now: number }) {
  const t = useTranslations();
  const b = props.detail.bet;
  const game = props.detail.game;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex min-w-0 flex-col gap-1 text-[13px]">
          <Matchup event={game} size="xs" className="text-foreground/90" />
          <LeagueLabel event={game} className="text-foreground/45 text-[11px]" />
        </span>
        <FrameLink href={`/games/${encodeURIComponent(b.game_id)}`}>{t("LANDING.DASH.OPEN_GAME")}</FrameLink>
      </div>
      <div className="border-foreground/6 overflow-hidden rounded-md border text-[12px] [&_table]:text-[12px]">
        <MarketTable market={props.detail.market} home={b.home} away={b.away} now={props.now} highlight={b.id} valueLinks />
      </div>
      <p className="text-foreground/45 text-[11px] leading-relaxed">{t("LANDING.DASH.ODDS_NOTE")}</p>
    </div>
  );
}

export function FairView(props: { detail: BetDetail; books: BookStatus[]; now: number }) {
  const t = useTranslations();
  const locale = useLocale();
  const b = props.detail.bet;
  const net = netOdds(Number(b.odds), feeOf(props.books, b.book));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2.5">
          <VendorLogo vendorKey={b.book} size={24} />
          <span className="flex min-w-0 flex-col">
            <span className="text-foreground/95 truncate text-[14px] font-medium tracking-tight">
              {t("BET.TITLE", { bet: sideName(b, t), book: bookName(b.book) })}
            </span>
            <span className="text-foreground/45 truncate text-[11px]">
              {marketName(b, t)}, {t("FORMAT.MATCHUP", { home: b.home, away: b.away })}
            </span>
          </span>
        </span>
        <FrameLink href={betHref(b.id)}>{t("LANDING.DASH.OPEN_BET")}</FrameLink>
      </div>
      <div className={cn(HAIRLINE_GRID, "@2xl:grid-cols-[1fr_260px]")}>
        <Panel title={t("BET.DEVIG_TITLE")} icon="scale">
          <table className="w-full text-[12px]">
            <thead className="border-foreground/6 border-b">
              <tr>
                <th className={TH}>{t("BET.COL_METHOD")}</th>
                <th className={cn(TH, "text-right")}>{t("BET.COL_CHANCE")}</th>
                <th className={cn(TH, "text-right")}>{t("BET.COL_FAIR_ODDS")}</th>
                <th className={cn(TH, "text-right")}>{t("BET.COL_EV_AT", { odds: odds(net) })}</th>
              </tr>
            </thead>
            <tbody>
              {METHODS.map((m) => {
                const p = b.fair[m.key];
                return (
                  <tr key={m.key} className="border-foreground/6 border-b last:border-b-0">
                    <td className={cn(TD, "text-foreground/80")}>{t(m.label)}</td>
                    <td className={cn(TD, "tabular text-foreground/70 text-right")}>{prob(p)}</td>
                    <td className={cn(TD, "tabular text-foreground/85 text-right")}>{odds(1 / p)}</td>
                    <td className={cn(TD, "text-right")}>
                      <Ev value={net * p - 1} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>
        <Panel title={t("LANDING.DASH.BREAKDOWN")} icon="target">
          <Row label={t("LANDING.DASH.SHARP_PRICE")}>{odds(b.sharp_odds)}</Row>
          <Row label={t("LANDING.DASH.SHARP_MARGIN")}>{percent(b.sharp_overround)}</Row>
          <Row label={t("LANDING.DASH.SHARP_LIMIT")}>
            {b.sharp_max_stake ? count(Number(b.sharp_max_stake), locale) : t("FORMAT.NA")}
          </Row>
          <Row label={t("BET.STAT_FAIR")}>{odds(b.fair_odds)}</Row>
          <Row label={bookName(b.book)}>{odds(b.odds)}</Row>
          <Row label={t("BET.STAT_EV")}>
            <Ev value={b.ev} />
          </Row>
          <Row label={t("BET.STAT_SAFE_EV")}>
            <Ev value={b.ev_conservative} />
          </Row>
          <div className="border-foreground/6 flex items-center justify-between gap-3 border-t px-3 py-2">
            <span className="text-foreground/50 text-[11px]">{t("BET.STAT_CONFIDENCE")}</span>
            <ConfidenceBadge value={b.confidence} />
          </div>
        </Panel>
      </div>
      <p className="text-foreground/45 text-[11px] leading-relaxed">
        {t("LANDING.DASH.FAIR_NOTE", {
          sharpSeen: ago(b.sharp_seen_at, props.now, locale),
          book: bookName(b.book),
          bookSeen: ago(b.book_seen_at, props.now, locale),
        })}
      </p>
    </div>
  );
}

export function HistoryView(props: { detail: BetDetail; now: number }) {
  const t = useTranslations();
  const b = props.detail.bet;
  return (
    <Panel
      title={t("BET.HISTORY_TITLE")}
      icon="chart-line"
      meta={t("BET.TITLE", { bet: sideName(b, t), book: bookName(b.book) })}
    >
      <PriceChart
        bookLabel={bookName(b.book)}
        bookColor="#3b82f6"
        sharpColor="#d97706"
        book={props.detail.book_history}
        sharp={props.detail.sharp_history}
        now={props.now}
      />
    </Panel>
  );
}
