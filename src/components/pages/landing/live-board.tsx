"use client";

import { VendorLogo } from "@/components/elements/vendor/vendor-logo";
import { useLiveQuery } from "@/hooks/live/use-live-query-hook";
import { Link } from "@/i18n/navigation";
import type { BetDetail, ValueBet, ValueBetList } from "@/lib/api/client";
import { bookName } from "@/lib/config/vendor-registry";
import {
  ago,
  countdown,
  marketName,
  matchup,
  odds,
  percent,
  sideName,
  type Translate,
} from "@/lib/format";
import { applyBet, betNeedsReload } from "@/lib/live/apply";
import { fetchBet } from "@/lib/live/actions";
import { queryKeys } from "@/lib/react-query/keys";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { Flaps } from "./flaps";

import {
  boardGroups,
  ladderBetId,
  useBoardBets,
  useClock,
} from "./landing-live";
import { LiveDot } from "./landing-ui";

const STRIPE: Record<ValueBet["confidence"], string> = {
  high: "bg-vermilion",
  medium: "bg-gold",
  low: "bg-chalk/40",
  check: "bg-chalk/20",
};

const TILE =
  "h-[30px] w-[17px] text-[21px] sm:h-[34px] sm:w-[19px] sm:text-[24px]";
const COLS =
  "grid grid-cols-[6px_minmax(0,1fr)_86px_58px] gap-2.5 sm:grid-cols-[6px_minmax(0,1fr)_26px_94px_94px_60px_64px] sm:gap-3";
const EDGE_FULL = 0.1;

function BoardRow(props: { bet: ValueBet; now: number; t: Translate }) {
  const locale = useLocale();
  const b = props.bet;
  const ko = countdown(b.starts_at, props.now, locale, props.t);
  return (
    <Link
      href={`/value-bets/${encodeURIComponent(b.id)}`}
      className={cn(
        COLS,
        "items-center border-b border-[#24211d] px-1 py-2.5 last:border-b-0 hover:bg-white/[0.03]",
      )}
    >
      <span className={cn("h-9 w-1.5 rounded-[2px]", STRIPE[b.confidence])} />
      <span className="min-w-0">
        <span className="font-display block truncate text-[17px] leading-[1.1] uppercase sm:text-[19px]">
          {matchup(b.home, b.away, props.t)}
        </span>
        <span className="block truncate font-mono text-[11px] text-[#9a9186] sm:text-[12px]">
          {sideName(b, props.t)} / {marketName(b, props.t)}
        </span>
      </span>
      <VendorLogo
        vendorKey={b.book}
        size={26}
        className="hidden rounded-md sm:block"
      />
      <Flaps
        value={odds(b.odds)}
        tiles={5}
        tileClassName={cn(TILE, "text-gold")}
        className="text-gold"
      />
      <Flaps
        value={odds(b.fair_odds)}
        tiles={5}
        tileClassName={cn(TILE, "text-[#9ec9ae]")}
        className="hidden text-[#9ec9ae] sm:flex"
      />
      <span className="text-right">
        <span className="num text-vermilion block text-[19px] leading-none sm:text-[23px]">
          {percent(b.ev)}
        </span>
        <span className="mt-1.5 block h-[5px] overflow-hidden rounded-[3px] bg-[#2a2622]">
          <span
            className="bg-vermilion block h-full origin-left rounded-[3px] transition-transform duration-500 motion-reduce:transition-none"
            style={{ transform: `scaleX(${Math.min(1, b.ev / EDGE_FULL)})` }}
          />
        </span>
        <span
          className="mt-1 block font-mono text-[10px] leading-none text-[#9a9186] sm:hidden"
          suppressHydrationWarning
        >
          {ko}
        </span>
      </span>
      <span
        className="num hidden text-right text-[17px] leading-none text-[#cfc6b6] sm:block"
        suppressHydrationWarning
      >
        {ko}
      </span>
    </Link>
  );
}

function Ladder(props: { detail: BetDetail | null; t: Translate }) {
  const t = props.t;
  const detail = props.detail;
  const outcome = detail?.market.outcomes.find(
    (o) => o.side === detail.bet.side,
  );
  if (!detail || !outcome) {
    return (
      <div className="flex h-[264px] items-center justify-center px-4 text-center font-serif text-lg text-[#9a9186] italic">
        {t("LANDING.BOARD.LADDER_GONE")}
      </div>
    );
  }
  const b = detail.bet;
  const fair = Number(outcome.fair_odds ?? b.fair_odds);
  const prices = outcome.prices.filter((p) => !p.stale).slice(0, 7);
  const values = prices.map((p) => Number(p.odds));
  const lo = Math.min(fair, ...values) * 0.96;
  const hi = Math.max(fair * 1.02, ...values) * 1.01;
  const at = (x: number) => ((x - lo) / (hi - lo)) * 100;
  const fairAt = at(fair);

  return (
    <div className="px-1 pt-4">
      <div className="flex items-baseline justify-between gap-3 font-mono text-[10px] tracking-[0.14em] text-[#6f675d] uppercase">
        <span>{t("LANDING.BOARD.LADDER")}</span>
        <span className="truncate">{marketName(b, t)}</span>
      </div>
      <p className="font-display mt-1 truncate text-[19px] uppercase">
        {sideName(b, t)}
        <span className="text-[#9a9186]"> / {matchup(b.home, b.away, t)}</span>
      </p>
      <div className="relative mt-6 flex flex-col gap-[5px]">
        <span
          aria-hidden
          className="pointer-events-none absolute -top-5 -bottom-1.5 border-l-[1.5px] border-dashed border-[#7fd0a3]"
          style={{ left: `calc(28px + (100% - 80px) * ${fairAt / 100})` }}
        >
          <span className="absolute -top-0.5 left-1.5 font-mono text-[10px] font-medium tracking-[0.06em] whitespace-nowrap text-[#7fd0a3] uppercase">
            {t("LANDING.BOARD.LADDER_FAIR", { odds: odds(fair) })}
          </span>
        </span>
        {prices.map((p) => {
          const x = Number(p.odds);
          const w = at(x);
          const value = x > fair;
          return (
            <div
              key={p.key}
              className="grid h-[24px] grid-cols-[20px_1fr_44px] items-center gap-2"
            >
              <VendorLogo vendorKey={p.book} size={20} className="rounded" />
              <span className="relative h-[16px] overflow-hidden rounded-[2px] bg-[#1c1a17]">
                <span
                  className="absolute inset-y-0 left-0 origin-left transition-[width] duration-500 motion-reduce:transition-none"
                  style={{
                    width: `${w}%`,
                    background: value
                      ? `linear-gradient(90deg,#3a352f 0 ${(fairAt / w) * 100}%,var(--color-vermilion) ${(fairAt / w) * 100}%)`
                      : "#3a352f",
                  }}
                />
              </span>
              <span
                className={cn(
                  "num text-right text-[17px] leading-none",
                  value ? "text-vermilion" : "text-[#cfc6b6]",
                )}
              >
                {odds(p.odds)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-end justify-between gap-3 border-t border-dashed border-[#3a352f] pt-3">
        <span className="font-mono text-[11px] tracking-[0.08em] text-[#9a9186] uppercase">
          {t("LANDING.BOARD.LADDER_EDGE", { book: bookName(b.book) })}
        </span>
        <span className="num text-gold text-[30px] leading-none">
          {percent(b.ev)}
        </span>
      </div>
    </div>
  );
}

// Its own component so the socket topic and cache key change together when the ladder moves to another bet.
function LiveLadder(props: {
  id: string;
  initial: BetDetail | null;
  t: Translate;
}) {
  const ladder = useLiveQuery({
    queryKey: queryKeys.bet(props.id),
    initialData: props.initial,
    fetch: () => fetchBet(props.id),
    topic: `bet:${props.id}`,
    apply: applyBet,
    reloadWhen: betNeedsReload,
  });
  return <Ladder detail={ladder.data} t={props.t} />;
}

export function LiveBoard(props: {
  list: ValueBetList | null;
  keys: string[];
  featured: BetDetail | null;
  now: number;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const live = useBoardBets(props.list);
  const now = useClock(props.now);
  const list = live.data;
  const rows = list ? boardGroups(list.bets, props.keys) : [];
  const top = rows[0]?.best;
  const ladderId = ladderBetId(list, props.featured, rows);
  const updated = list?.stats.updated_at;

  return (
    <div className="relative">
      <div className="bg-board text-chalk relative z-[1] rounded-[14px] p-3 shadow-[0_30px_60px_-30px_rgba(20,18,16,0.6),0_0_0_6px_var(--color-ink)] sm:p-[18px] dark:shadow-[0_30px_60px_-30px_rgba(0,0,0,0.8),0_0_0_6px_#2a2622]">
        <div className="mb-2 flex items-center justify-between border-b border-dashed border-[#3a352f] px-1 pb-3 font-mono text-[11px] tracking-[0.12em] text-[#9a9186] uppercase sm:text-[12px]">
          <span>{t("LANDING.BOARD.TITLE")}</span>
          <span
            className={cn(
              "flex items-center gap-2",
              live.status === "live" ? "text-vermilion" : "text-[#9a9186]",
            )}
          >
            {live.status === "live" && <LiveDot />}
            {t(
              live.status === "live"
                ? "LIVE.LIVE"
                : live.status === "connecting"
                  ? "LIVE.CONNECTING"
                  : live.status === "reconnecting"
                    ? "LIVE.RECONNECTING"
                    : "LIVE.OFFLINE",
            )}
          </span>
        </div>
        <div
          className={cn(
            COLS,
            "px-1 py-1 font-mono text-[10px] tracking-[0.14em] text-[#6f675d] uppercase",
          )}
        >
          <span />
          <span>{t("LANDING.BOARD.FIXTURE")}</span>
          <span className="hidden sm:block" />
          <span className="text-right">{t("LANDING.BOARD.BOOK")}</span>
          <span className="hidden text-right sm:block">
            {t("LANDING.BOARD.FAIR")}
          </span>
          <span className="text-right">{t("LANDING.BOARD.EDGE")}</span>
          <span className="hidden text-right sm:block">
            {t("LANDING.BOARD.KICKOFF")}
          </span>
        </div>
        {/* Fixed height for six rows: a bet leaving the board never moves the page below. */}
        <div className="min-h-[342px] sm:min-h-[366px]">
          {rows.length === 0 ? (
            <p className="flex h-[300px] items-center justify-center px-6 text-center font-serif text-xl text-[#9a9186] italic">
              {list ? t("LANDING.BOARD.EMPTY") : t("LANDING.BOARD.OFFLINE")}
            </p>
          ) : (
            rows.map((g) => (
              <BoardRow key={g.key} bet={g.best} now={now} t={t} />
            ))
          )}
        </div>
        {ladderId && (
          <div className="mt-1 border-t border-dashed border-[#3a352f]">
            <LiveLadder
              key={ladderId}
              id={ladderId}
              initial={
                props.featured?.bet.id === ladderId ? props.featured : null
              }
              t={t}
            />
          </div>
        )}
        <div className="mt-3 flex justify-between gap-3 border-t border-dashed border-[#3a352f] px-1 pt-3 font-mono text-[10px] tracking-[0.08em] text-[#6f675d] uppercase sm:text-[11px]">
          <span className="truncate">{t("LANDING.BOARD.FOOT")}</span>
          <span className="shrink-0" suppressHydrationWarning>
            {updated
              ? t("LANDING.BOARD.UPDATED", { ago: ago(updated, now, locale) })
              : null}
          </span>
        </div>
      </div>
      {top && (
        <Link
          href={`/value-bets/${encodeURIComponent(top.id)}`}
          className="sticker-sway bg-vermilion text-ink absolute -bottom-20 -left-32 z-[2] hidden size-[150px] place-items-center rounded-full text-center shadow-[0_10px_30px_-10px_rgba(0,0,0,0.4)] lg:grid"
        >
          <span>
            <span className="num block text-[32px] leading-[0.9] sm:text-[42px]">
              {percent(top.ev)}
            </span>
            <span className="mt-1 block px-3 font-serif text-[13px] leading-[1.1] italic sm:text-[16px]">
              {t("LANDING.BOARD.STICKER", {
                bet: sideName(top, t),
                book: bookName(top.book),
              })}
            </span>
          </span>
        </Link>
      )}
    </div>
  );
}
