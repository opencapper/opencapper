"use client";

import { LiveStatusBadge } from "@/components/elements/live/live-status";
import { PriceAge } from "@/components/elements/live/price-age";
import { TickText } from "@/components/elements/live/tick-cell";
import { ConfidenceBadge } from "@/components/elements/odds/confidence-badge";
import { VendorLogo } from "@/components/elements/vendor/vendor-logo";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/i18n/navigation";
import type { ValueBet, ValueBetList } from "@/lib/api/client";
import { bookName } from "@/lib/config/vendor-registry";
import {
  count,
  kickoffShort,
  marketName,
  matchup,
  odds,
  oddsOf,
  percent,
  sideName,
  until,
  type Translate,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { boardGroups, liveEdges, useBoardBets } from "./landing-live";
import { BOARD_ROWS } from "./landing-ui";

const COLS =
  "lg:grid lg:grid-cols-[150px_minmax(0,1fr)_60px_60px_140px_88px_92px_96px_92px] lg:items-center lg:gap-4";

function BoardRow(props: { bet: ValueBet; now: number; t: Translate }) {
  const t = props.t;
  const locale = useLocale();
  const b = props.bet;
  const href = `/value-bets/${encodeURIComponent(b.id)}`;
  const exchange = b.exchange_probability
    ? oddsOf(b.exchange_probability)
    : undefined;
  return (
    <Link
      href={href}
      className="hover:bg-muted/50 block h-[76px] border-b px-4 py-3 transition-colors last:border-b-0 lg:h-14 lg:py-0"
    >
      {/* Phone: two lines, the EV fixed on the right. */}
      <div className="flex h-full flex-col justify-center gap-1 lg:hidden">
        <div className="flex items-center gap-2">
          <VendorLogo vendorKey={b.book} size={18} className="rounded-sm" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {sideName(b, t)}
            <span className="text-muted-foreground font-normal">
              {" "}
              {matchup(b.home, b.away, t)}
            </span>
          </span>
          <TickText value={b.ev} className="tabular text-success text-sm font-semibold">
            {percent(b.ev)}
          </TickText>
        </div>
        <div className="text-muted-foreground flex items-center gap-3 pl-[26px] text-xs">
          <span className="tabular text-foreground font-medium">{odds(b.odds)}</span>
          <span className="tabular">
            {t("LANDING.BOARD.FAIR_SHORT", { odds: odds(b.fair_odds) })}
          </span>
          <span className="tabular truncate">
            {t("LANDING.BOARD.REF_PINNACLE", { odds: odds(b.sharp_odds) })}
          </span>
          <PriceAge iso={b.book_seen_at} serverNow={props.now} className="ml-auto" />
        </div>
      </div>

      <div className={cn("hidden h-full", COLS)}>
        <span className="flex min-w-0 items-center gap-2 text-sm">
          <VendorLogo vendorKey={b.book} size={20} className="rounded-sm" />
          <span className="truncate">{bookName(b.book)}</span>
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">
            {sideName(b, t)}
          </span>
          <span className="text-muted-foreground block truncate text-xs">
            {matchup(b.home, b.away, t)}, {marketName(b, t)}
          </span>
        </span>
        <TickText
          value={Number(b.odds)}
          className="tabular text-right text-sm font-semibold"
        >
          {odds(b.odds)}
        </TickText>
        <span className="tabular text-muted-foreground text-right text-sm">
          {odds(b.fair_odds)}
        </span>
        <span className="text-muted-foreground min-w-0 text-xs leading-5">
          <span className="block truncate">
            {t("LANDING.BOARD.REF_PINNACLE", { odds: odds(b.sharp_odds) })}
          </span>
          <span className="block truncate">
            {exchange
              ? t("LANDING.BOARD.REF_EXCHANGE", { odds: exchange })
              : t("LANDING.BOARD.REF_NO_EXCHANGE")}
          </span>
        </span>
        <span className="text-right">
          <TickText value={b.ev} className="tabular text-success block text-sm font-semibold">
            {percent(b.ev)}
          </TickText>
          <span className="tabular text-muted-foreground block text-[11px]">
            {t("VALUE_BETS.SAFE_EV", { ev: percent(b.ev_conservative) })}
          </span>
        </span>
        <ConfidenceBadge value={b.confidence} />
        <PriceAge iso={b.book_seen_at} serverNow={props.now} />
        <span className="text-right text-xs leading-5" suppressHydrationWarning>
          <span className="tabular block whitespace-nowrap">{kickoffShort(b.starts_at, props.now, locale)}</span>
          <span className="text-muted-foreground block">
            {until(b.starts_at, props.now, locale, t)}
          </span>
        </span>
      </div>
    </Link>
  );
}

export function LiveBoard(props: {
  list: ValueBetList | null;
  edges: number;
  keys: string[];
  now: number;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const live = useBoardBets(props.list);
  const list = live.data;
  const rows = list ? boardGroups(list.bets, props.keys) : [];
  const updated = list?.stats.updated_at;

  return (
    <div className="bg-card overflow-hidden rounded-xl border shadow-sm">
      <div className="flex h-12 items-center justify-between gap-3 border-b px-4">
        <div className="flex min-w-0 items-center gap-3">
          <h2 className="truncate text-sm font-semibold">
            {t("LANDING.BOARD.HEADING")}
          </h2>
          <LiveStatusBadge status={live.status} />
        </div>
        <div className="flex shrink-0 items-center gap-4">
          {updated && (
            <PriceAge
              iso={updated}
              serverNow={props.now}
              dot={false}
              prefix={t("COMMON.UPDATED")}
              className="hidden sm:inline-flex"
            />
          )}
          <Link
            href="/value-bets"
            className="text-primary inline-flex items-center gap-1 text-xs font-medium hover:underline"
          >
            {t("LANDING.BOARD.ALL", { count: count(liveEdges(list, props.list, props.edges), locale) })}
            <Icon name="arrow-right" className="size-3.5" />
          </Link>
        </div>
      </div>

      <div
        className={cn(
          "bg-subtle eyebrow hidden h-9 border-b px-4",
          COLS,
        )}
      >
        <span>{t("VALUE_BETS.COL_BOOK")}</span>
        <span>{t("LANDING.BOARD.SELECTION")}</span>
        <span className="text-right">{t("VALUE_BETS.COL_ODDS")}</span>
        <span className="text-right">{t("VALUE_BETS.COL_FAIR")}</span>
        <span>{t("LANDING.BOARD.REFERENCE")}</span>
        <span className="text-right">{t("VALUE_BETS.COL_EV")}</span>
        <span>{t("VALUE_BETS.COL_CONFIDENCE")}</span>
        <span>{t("LANDING.BOARD.AGE")}</span>
        <span className="text-right">{t("LANDING.BOARD.KICKOFF")}</span>
      </div>

      {/* Reserved height for every row: a bet leaving the board never moves the page. */}
      <div className="min-h-[456px] lg:min-h-[336px]">
        {rows.length === 0 ? (
          <p className="text-muted-foreground flex h-[336px] items-center justify-center px-6 text-center text-sm">
            {list ? t("LANDING.BOARD.EMPTY") : t("LANDING.BOARD.OFFLINE")}
          </p>
        ) : (
          rows
            .slice(0, BOARD_ROWS)
            .map((g) => <BoardRow key={g.key} bet={g.best} now={props.now} t={t} />)
        )}
      </div>

      <p className="text-muted-foreground bg-subtle border-t px-4 py-2.5 text-xs leading-relaxed">
        {t("LANDING.BOARD.METHOD")}
      </p>
    </div>
  );
}
