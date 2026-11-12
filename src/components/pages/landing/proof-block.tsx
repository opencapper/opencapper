"use client";

import { statusLabel } from "@/components/elements/odds/bet-status";
import { VendorLogo } from "@/components/elements/vendor/vendor-logo";
import { TickText } from "@/components/elements/live/tick-cell";
import type { LedgerEntry, LedgerStats } from "@/lib/api/client";
import { bookName } from "@/lib/config/vendor-registry";
import {
  count,
  matchup,
  odds,
  percent,
  score,
  sideName,
  units,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { useLedgerStats } from "./landing-live";
import { Arrow, Pill } from "./landing-ui";

const BADGE: Record<NonNullable<LedgerEntry["result"]>, string> = {
  won: "bg-pitch text-chalk",
  half_won: "bg-pitch/70 text-chalk",
  lost: "bg-vermilion text-ink",
  half_lost: "bg-vermilion/70 text-ink",
  push: "bg-paper-2 text-ink",
};

function shortDay(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : locale, {
    day: "2-digit",
    month: "short",
    timeZone: "Europe/London",
  }).format(new Date(iso));
}

function ResultRow(props: { entry: LedgerEntry }) {
  const t = useTranslations();
  const locale = useLocale();
  const e = props.entry;
  const final = score(e);
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_78px] items-center gap-3 border-b border-[#3b3631] py-4 sm:grid-cols-[64px_minmax(0,1fr)_120px_70px_86px] sm:gap-4">
      <span className="hidden font-mono text-[12px] text-[#9a9186] uppercase sm:block">
        {shortDay(e.alerted_at, locale)}
      </span>
      <span className="min-w-0">
        <span className="font-display block truncate text-[21px] leading-[1.05] uppercase sm:text-[24px]">
          {matchup(e.home, e.away, t)}
          {final && <span className="text-gold ml-2.5">{final}</span>}
        </span>
        <span className="block truncate font-serif text-[18px] text-[#b9b0a4] italic">
          {t("LANDING.PROOF.AT", {
            bet: sideName(e, t),
            odds: odds(e.alert_odds),
          })}
        </span>
      </span>
      <span className="hidden min-w-0 items-center gap-2 text-[13px] font-semibold sm:flex">
        <VendorLogo vendorKey={e.book} size={24} className="rounded-md" />
        <span className="truncate">{bookName(e.book)}</span>
      </span>
      <span
        className={cn(
          "num hidden text-right text-[18px] sm:block",
          e.clv !== null && e.clv !== undefined && e.clv < 0
            ? "text-vermilion"
            : "text-chalk",
        )}
      >
        {e.clv !== null && e.clv !== undefined ? percent(e.clv) : ""}
      </span>
      <span
        className={cn(
          "font-display rounded-md py-1.5 text-center text-[15px] tracking-[0.04em] uppercase",
          e.result
            ? BADGE[e.result]
            : "border border-dashed border-[#6a6158] text-[#9a9186]",
        )}
      >
        {e.result ? statusLabel(e.result, t) : t("LANDING.PROOF.PENDING")}
      </span>
    </li>
  );
}

function Stat(props: {
  label: string;
  value: string;
  tick: number;
  note?: string;
  tone?: string;
  small?: boolean;
}) {
  return (
    <div className="min-w-0 border-t border-[#d8cfbf] pt-4 dark:border-[#3b3631]">
      <span className="block font-mono text-[10px] tracking-[0.12em] text-[#7a7166] uppercase">
        {props.label}
      </span>
      <span className="mt-1 flex h-11 items-end">
        <TickText
          value={props.tick}
          className={cn(
            "num block leading-none whitespace-nowrap",
            props.small
              ? "text-[30px] sm:text-[32px]"
              : "text-[40px] sm:text-[44px]",
            props.tone,
          )}
        >
          {props.value}
        </TickText>
      </span>
      {props.note && (
        <span className="mt-1 block font-serif text-[16px] leading-tight text-[#7a7166] italic">
          {props.note}
        </span>
      )}
    </div>
  );
}

export function ProofBlock(props: {
  stats: LedgerStats | null;
  results: LedgerEntry[];
}) {
  const t = useTranslations("LANDING.PROOF");
  const locale = useLocale();
  const live = useLedgerStats(props.stats);
  const s = live.data;
  if (!s) return null;
  const clv = s.avg_clv ?? 0;
  const share = s.closed > 0 ? s.beat_close / s.closed : 0;

  return (
    <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-12">
      <div>
        {props.results.length === 0 ? (
          <p className="border-t-[3px] border-[#f7f3ea] py-10 font-serif text-2xl italic">
            {t("EMPTY")}
          </p>
        ) : (
          <ul className="border-chalk border-t-[3px]">
            {props.results.map((e) => (
              <ResultRow key={e.id} entry={e} />
            ))}
          </ul>
        )}
        <div className="mt-8">
          <Pill href="/proof" tone="chalk">
            {t("CTA")}
            <Arrow />
          </Pill>
        </div>
      </div>

      <div className="bg-paper text-ink dark:text-chalk rounded-[22px] p-6 sm:p-8 lg:sticky lg:top-24 dark:bg-[#1b1916]">
        <span className="block font-mono text-[11px] tracking-[0.12em] text-[#7a7166] uppercase">
          {t("CLV")}
        </span>
        <TickText
          value={clv}
          className={cn(
            "num mt-1 block text-[80px] leading-[0.9] sm:text-[96px]",
            clv < 0
              ? "text-vermilion-2 dark:text-vermilion"
              : "text-pitch dark:text-[#3fae74]",
          )}
        >
          {percent(clv, 2)}
        </TickText>
        <span className="mt-1 block font-serif text-[20px] leading-tight italic">
          {t("CLV_NOTE", { count: count(s.closed, locale) })}
        </span>
        <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5">
          <Stat
            label={t("ALERTS")}
            value={count(s.alerts, locale)}
            tick={s.alerts}
            note={t("ALERTS_NOTE")}
          />
          <Stat
            label={t("BEAT_CLOSE")}
            value={`${(share * 100).toFixed(1)}%`}
            tick={share}
            note={t("BEAT_CLOSE_NOTE", {
              beat: count(s.beat_close, locale),
              closed: count(s.closed, locale),
            })}
          />
          <Stat
            label={t("RECORD")}
            value={t("RECORD_VALUE", {
              won: String(s.won + s.half_won),
              lost: String(s.lost + s.half_lost),
              push: String(s.push),
            })}
            tick={s.settled}
            small
            note={t("RECORD_NOTE", { count: count(s.settled, locale) })}
          />
          <Stat
            label={t("UNITS")}
            value={units(s.units)}
            tick={s.units}
            tone={
              s.units < 0 ? "text-vermilion-2 dark:text-vermilion" : undefined
            }
            note={t("UNITS_NOTE")}
          />
        </div>
      </div>
    </div>
  );
}
