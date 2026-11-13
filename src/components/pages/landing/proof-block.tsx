"use client";

import { ResultBadge } from "@/components/elements/odds/result-badge";
import { unitsTone } from "@/components/elements/odds/ledger-result";
import { StatCard } from "@/components/elements/odds/stat-card";
import { VendorLogo } from "@/components/elements/vendor/vendor-logo";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/i18n/navigation";
import type { LedgerEntry, LedgerStats } from "@/lib/api/client";
import { bookName } from "@/lib/config/vendor-registry";
import {
  count,
  matchup,
  odds,
  percent,
  prob,
  score,
  sideName,
  units,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { useLedgerStats } from "./landing-live";

function stamp(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : locale, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  }).format(new Date(iso));
}

function clvTone(x: number | null | undefined): string {
  if (x === null || x === undefined || x === 0) return "text-muted-foreground";
  return x > 0 ? "text-success" : "text-destructive";
}

const ROW =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3 sm:grid-cols-[96px_minmax(0,1fr)_120px_52px_64px_88px]";

function ResultRow(props: { entry: LedgerEntry }) {
  const t = useTranslations();
  const locale = useLocale();
  const e = props.entry;
  const final = score(e);
  return (
    <li className={cn(ROW, "border-b last:border-b-0")}>
      <span className="tabular text-muted-foreground hidden text-xs sm:block">
        {stamp(e.alerted_at, locale)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">
          {sideName(e, t)}
        </span>
        <span className="text-muted-foreground block truncate text-xs">
          {matchup(e.home, e.away, t)}
          {final ? `, ${final}` : ""}
          <span className="sm:hidden">, {stamp(e.alerted_at, locale)}</span>
        </span>
      </span>
      <span className="hidden min-w-0 items-center gap-2 text-sm sm:flex">
        <VendorLogo vendorKey={e.book} size={18} className="rounded-sm" />
        <span className="truncate">{bookName(e.book)}</span>
      </span>
      <span className="tabular hidden text-right text-sm sm:block">
        {odds(e.alert_odds)}
      </span>
      <span
        className={cn("tabular hidden text-right text-sm sm:block", clvTone(e.clv))}
      >
        {e.clv === null || e.clv === undefined ? t("FORMAT.NA") : percent(e.clv)}
      </span>
      <span className="flex flex-col items-end gap-0.5">
        {e.result ? (
          <ResultBadge value={e.result} />
        ) : (
          <span className="text-muted-foreground text-xs">
            {t("LANDING.PROOF.PENDING")}
          </span>
        )}
        {e.profit_units !== null && e.profit_units !== undefined && (
          <span className={cn("tabular text-[11px]", unitsTone(e.profit_units))}>
            {t("PROOF.UNITS_VALUE", { units: units(e.profit_units) })}
          </span>
        )}
      </span>
    </li>
  );
}

export function ProofBlock(props: {
  stats: LedgerStats | null;
  results: LedgerEntry[];
}) {
  const t = useTranslations("LANDING.PROOF");
  const tr = useTranslations();
  const locale = useLocale();
  const live = useLedgerStats(props.stats);
  const s = live.data;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      {s ? (
        <div className="flex flex-col gap-3">
          <div className="bg-card rounded-lg border p-5">
            <div className="text-muted-foreground text-sm">{t("CLV")}</div>
            <div
              className={cn(
                "tabular mt-1 text-4xl font-semibold",
                clvTone(s.avg_clv),
              )}
            >
              {s.avg_clv === null || s.avg_clv === undefined
                ? tr("FORMAT.NA")
                : percent(s.avg_clv, 2)}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              {t("CLV_NOTE", { count: count(s.closed, locale) })}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label={t("BEAT_CLOSE")}
              value={s.closed > 0 ? prob(s.beat_close / s.closed) : tr("FORMAT.NA")}
              note={t("BEAT_CLOSE_NOTE", {
                beat: count(s.beat_close, locale),
                closed: count(s.closed, locale),
              })}
            />
            <StatCard
              label={t("ALERTS")}
              value={count(s.alerts, locale)}
              note={t("ALERTS_NOTE")}
            />
            <StatCard
              label={t("RECORD")}
              value={t("RECORD_VALUE", {
                won: count(s.won, locale),
                lost: count(s.lost, locale),
                push: count(s.push, locale),
              })}
              note={t("RECORD_NOTE", { count: count(s.settled, locale) })}
            />
            <StatCard
              label={t("UNITS")}
              value={s.settled > 0 ? units(s.units) : tr("FORMAT.NA")}
              tone={s.settled > 0 && s.units !== 0 ? (s.units > 0 ? "win" : "bad") : undefined}
              note={t("UNITS_NOTE")}
            />
          </div>
        </div>
      ) : (
        <div className="bg-card text-muted-foreground rounded-lg border p-5 text-sm">
          {t("EMPTY")}
        </div>
      )}

      <div className="bg-card overflow-hidden rounded-lg border">
        <div
          className={cn(
            ROW,
            "bg-subtle eyebrow hidden border-b py-2 sm:grid",
          )}
        >
          <span>{t("COL_TIME")}</span>
          <span>{tr("PROOF.COL_BET")}</span>
          <span>{tr("PROOF.COL_BOOK")}</span>
          <span className="text-right">{tr("PROOF.COL_ODDS")}</span>
          <span className="text-right">{tr("PROOF.COL_CLV")}</span>
          <span className="text-right">{tr("PROOF.COL_RESULT")}</span>
        </div>
        {props.results.length === 0 ? (
          <p className="text-muted-foreground px-4 py-10 text-center text-sm">
            {t("EMPTY")}
          </p>
        ) : (
          <ul>
            {props.results.map((e) => (
              <ResultRow key={e.id} entry={e} />
            ))}
          </ul>
        )}
        <div className="flex items-center justify-between gap-3 border-t px-4 py-2.5">
          <span className="text-muted-foreground text-xs">{t("LEDGER_NOTE")}</span>
          <Link
            href="/proof"
            className="text-primary inline-flex shrink-0 items-center gap-1 text-xs font-medium hover:underline"
          >
            {t("CTA")}
            <Icon name="arrow-right" className="size-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
