"use client";

import { VendorLogo } from "@/components/elements/vendor/vendor-logo";
import { Link } from "@/i18n/navigation";
import type { LinkHref } from "@/i18n/routing";
import type {
  BetDetail,
  BookHealth,
  BookStatus,
  ValueBetList,
} from "@/lib/api/client";
import { bookName } from "@/lib/config/vendor-registry";
import {
  count,
  DEFAULT_PLAN,
  feeOf,
  odds,
  percent,
  sideName,
  suggestedStake,
} from "@/lib/format";
import { featuredGroups } from "@/lib/group";
import { fetchBet } from "@/lib/live/actions";
import { queryKeys } from "@/lib/react-query/keys";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import {
  boardGroups,
  edgeCount,
  ladderBetId,
  useBoardSnapshot,
} from "./landing-live";
import { Arrow, LiveDot, SampleTag } from "./landing-ui";

function Card(props: {
  href: LinkHref;
  title: string;
  note: ReactNode;
  tag?: ReactNode;
  children: ReactNode;
}) {
  const t = useTranslations("LANDING.TOOLS");
  return (
    <Link
      href={props.href}
      className="group border-foreground bg-card flex min-h-[300px] flex-col rounded-[18px] border-2 p-5 transition-transform duration-200 hover:-translate-y-1 motion-reduce:transition-none sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="headline text-[30px] leading-[0.95]">{props.title}</h3>
        {props.tag ?? (
          <span className="text-vermilion flex items-center gap-1.5 font-mono text-[10px] tracking-[0.12em] uppercase">
            <LiveDot className="size-1.5" />
            {t("LIVE")}
          </span>
        )}
      </div>
      <div className="my-5 flex flex-1 flex-col justify-center">
        {props.children}
      </div>
      <div className="border-foreground/15 flex items-center justify-between gap-3 border-t pt-3">
        <span className="text-foreground/65 min-w-0 font-mono text-[11px] tracking-[0.04em] uppercase">
          {props.note}
        </span>
        <Arrow className="shrink-0 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

function Gauge(props: { value: number; tone: string; label: string }) {
  return (
    <span className="relative inline-grid size-[92px] place-items-center">
      <svg
        viewBox="0 0 40 40"
        className="absolute inset-0 size-full -rotate-90"
      >
        <circle
          cx="20"
          cy="20"
          r="16"
          fill="none"
          strokeWidth="5"
          className="stroke-foreground/10"
        />
        <circle
          cx="20"
          cy="20"
          r="16"
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${props.value} 100`}
          className="ring-fill"
          stroke={props.tone}
        />
      </svg>
      <span className="text-center">
        <b
          className="num block text-[30px] leading-none"
          style={{ color: props.tone }}
        >
          {props.value}
        </b>
        <span className="font-mono text-[9px] tracking-[0.1em] uppercase opacity-60">
          {props.label}
        </span>
      </span>
    </span>
  );
}

// The API grades risk in steps; the gauge needs a number, so each step gets a fixed reading.
export const RISK_SCORE: Record<BookHealth["risk"], number> = {
  low: 86,
  medium: 58,
  high: 31,
  unknown: 0,
};

export function riskTone(score: number): string {
  if (score > 70) return "#2e9d5b";
  if (score > 45) return "#e0a21b";
  return "var(--color-vermilion)";
}

export function ToolsGrid(props: {
  list: ValueBetList | null;
  featured: BetDetail | null;
  keys: string[];
  books: BookStatus[];
  clv: number[];
  health?: BookHealth[];
}) {
  const t = useTranslations("LANDING.TOOLS");
  const tr = useTranslations();
  const locale = useLocale();
  const list = useBoardSnapshot(props.list);
  const ladderId =
    ladderBetId(
      list,
      props.featured,
      list ? boardGroups(list.bets, props.keys) : [],
    ) ?? "";
  // The board's ladder keeps this bet live in the cache; the card only reads it.
  const detailQuery = useQuery({
    queryKey: queryKeys.bet(ladderId),
    queryFn: () => fetchBet(ladderId),
    initialData:
      props.featured?.bet.id === ladderId ? props.featured : undefined,
    staleTime: Infinity,
    enabled: false,
  });
  const detail = detailQuery.data ?? null;
  const top = list ? featuredGroups(list.bets, 3) : [];
  const best = top[0]?.best;
  const arbs = list?.stats.arbs ?? 0;
  const health = props.health?.[0];
  const healthScore = health ? RISK_SCORE[health.risk] : 74;
  const maxClv = Math.max(0.05, ...props.clv.map((x) => Math.abs(x)));

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
      <Card
        href="/value-bets"
        title={t("VALUE")}
        note={t("VALUE_NOTE", { count: count(edgeCount(list), locale) })}
      >
        <ul className="flex flex-col gap-2">
          {top.map((g) => (
            <li
              key={g.key}
              className="border-foreground/12 grid grid-cols-[22px_minmax(0,1fr)_auto_auto] items-center gap-2.5 border-b pb-2 last:border-b-0"
            >
              <VendorLogo
                vendorKey={g.best.book}
                size={22}
                className="rounded"
              />
              <span className="truncate text-[14px] font-bold">
                {sideName(g.best, tr)}
              </span>
              <span className="num text-[20px] leading-none">
                {odds(g.best.odds)}
              </span>
              <span className="num text-vermilion w-[64px] text-right text-[20px] leading-none">
                {percent(g.best.ev)}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card
        href="/arbs"
        title={t("ARBS")}
        note={arbs > 0 ? t("ARBS_NOTE") : t("ARBS_EMPTY")}
      >
        <div className="flex items-end gap-4">
          <b className="num text-[96px] leading-[0.8]">{count(arbs, locale)}</b>
          <span className="pb-1 font-serif text-[20px] leading-tight italic">
            {t("ARBS_NOW")}
          </span>
        </div>
        <div className="mt-5 flex h-3 overflow-hidden rounded-full">
          <span className="bg-foreground h-full flex-1" />
          <span className="bg-vermilion h-full w-1.5" />
          <span className="bg-foreground/60 h-full flex-1" />
        </div>
        <div className="mt-1.5 flex justify-between font-mono text-[10px] tracking-[0.1em] uppercase opacity-60">
          <span>{t("ARBS_LEG_A")}</span>
          <span>{t("ARBS_LEG_B")}</span>
        </div>
      </Card>

      <Card
        href={
          detail ? `/games/${encodeURIComponent(detail.bet.game_id)}` : "/games"
        }
        title={t("ODDS")}
        note={t("ODDS_NOTE", { count: count(props.books.length, locale) })}
      >
        {detail ? (
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${detail.market.outcomes.length}, minmax(0,1fr))`,
            }}
          >
            {detail.market.outcomes.map((o) => {
              const price = o.prices.find((p) => !p.stale);
              return (
                <div
                  key={o.side}
                  className="bg-foreground/5 rounded-xl p-3 text-center"
                >
                  <span className="block truncate font-mono text-[10px] tracking-[0.08em] uppercase opacity-70">
                    {sideName(
                      {
                        market: detail.bet.market,
                        side: o.side,
                        line: detail.bet.line,
                        home: detail.bet.home,
                        away: detail.bet.away,
                      },
                      tr,
                    )}
                  </span>
                  <b
                    className={cn(
                      "num mt-1 block text-[30px] leading-none",
                      o.side === detail.bet.side && "text-vermilion",
                    )}
                  >
                    {price ? odds(price.odds) : "-"}
                  </b>
                  {price && (
                    <span className="mt-2 flex items-center justify-center gap-1.5 text-[11px] font-semibold">
                      <VendorLogo
                        vendorKey={price.book}
                        size={16}
                        className="rounded-sm"
                      />
                      <span className="truncate">{bookName(price.book)}</span>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="font-serif text-xl italic">{t("ODDS_EMPTY")}</p>
        )}
      </Card>

      <Card
        href="/tracker"
        title={t("TRACKER")}
        note={t("TRACKER_NOTE", { count: String(props.clv.length) })}
        tag={<SampleTag>{t("PUBLIC")}</SampleTag>}
      >
        <svg
          viewBox={`0 0 ${Math.max(1, props.clv.length) * 8} 80`}
          className="h-[110px] w-full"
          preserveAspectRatio="none"
          aria-hidden
        >
          <line
            x1="0"
            x2={props.clv.length * 8}
            y1="40"
            y2="40"
            className="stroke-foreground/25"
            strokeWidth="1"
          />
          {props.clv.map((x, i) => {
            const h = (Math.abs(x) / maxClv) * 38;
            return (
              <rect
                key={i}
                x={i * 8 + 1}
                width="6"
                y={x >= 0 ? 40 - h : 40}
                height={Math.max(1, h)}
                className={
                  x >= 0 ? "fill-pitch dark:fill-[#3fae74]" : "fill-vermilion"
                }
              />
            );
          })}
        </svg>
      </Card>

      <Card
        href="/tracker/health"
        title={t("HEALTH")}
        note={
          health
            ? t("HEALTH_NOTE_REAL", { book: bookName(health.book) })
            : t("HEALTH_NOTE")
        }
        tag={health ? undefined : <SampleTag>{t("SAMPLE")}</SampleTag>}
      >
        <div className="flex items-center gap-5">
          <Gauge
            value={healthScore}
            tone={riskTone(healthScore)}
            label={t("HEALTH_SCORE")}
          />
          <ul className="flex flex-col gap-1.5 font-serif text-[17px] leading-tight italic">
            <li>{t("HEALTH_POINT_ROUND")}</li>
            <li>{t("HEALTH_POINT_MIX")}</li>
            <li>{t("HEALTH_POINT_CLOSE")}</li>
          </ul>
        </div>
      </Card>

      <Card href="/tools" title={t("CALC")} note={t("CALC_NOTE")}>
        {best ? (
          <div>
            <span className="font-mono text-[11px] tracking-[0.08em] uppercase opacity-70">
              {t("CALC_FOR", {
                bet: sideName(best, tr),
                odds: odds(best.odds),
              })}
            </span>
            <div className="mt-2 flex items-end gap-3">
              <b className="num text-[84px] leading-[0.8]">
                {count(
                  suggestedStake(
                    Number(best.odds),
                    best.fair_probability,
                    feeOf(props.books, best.book),
                    DEFAULT_PLAN,
                  ),
                  locale,
                )}
              </b>
              <span className="pb-1 font-serif text-[20px] leading-tight italic">
                {t("CALC_UNIT", {
                  bankroll: count(DEFAULT_PLAN.bankroll, locale),
                })}
              </span>
            </div>
          </div>
        ) : (
          <p className="font-serif text-xl italic">{t("ODDS_EMPTY")}</p>
        )}
      </Card>
    </div>
  );
}
