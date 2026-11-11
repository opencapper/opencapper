import { LogoImage } from "@/components/elements/brand/brand";
import { LeagueLabel } from "@/components/elements/flag/league-label";
import { ConfidenceBadge } from "@/components/elements/odds/confidence-badge";
import { Ev } from "@/components/elements/odds/ev";
import { Matchup } from "@/components/elements/participant/matchup";
import { VendorLabel, VendorStack } from "@/components/elements/vendor/vendor-logo";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/i18n/navigation";
import type { BookStatus } from "@/lib/api/client";
import { env } from "@/lib/config/env";
import { bookName } from "@/lib/config/vendor-registry";
import {
  BANKROLL,
  KELLY_FRACTION,
  count,
  feeOf,
  kelly,
  kickoff,
  marketName,
  netOdds,
  odds,
  roundStake,
  sideName,
} from "@/lib/format";
import type { GroupedBet } from "@/lib/group";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

function betHref(group: GroupedBet): string {
  return `/value-bets/${encodeURIComponent(group.best.id)}`;
}

function FormRow(props: { label: string; children: ReactNode }) {
  return (
    <div className="border-border grid grid-cols-[88px_1fr] items-center gap-3 border-b py-2.5 last:border-b-0">
      <span className="label-mono text-foreground/40 text-[10px]">{props.label}</span>
      <div className="text-foreground/85 min-w-0 text-[13px]">{props.children}</div>
    </div>
  );
}

function Field(props: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-foreground/50 text-[11px] font-semibold">{props.label}</div>
      <div className="text-foreground/85 tabular truncate text-[13px]">{props.children}</div>
    </div>
  );
}

export function BoardMock(props: { group: GroupedBet }) {
  const t = useTranslations();
  const locale = useLocale();
  const b = props.group.best;
  const others = props.group.offers.slice(1).map((o) => o.book);

  return (
    <div className="border-input bg-background mx-auto max-w-md overflow-hidden rounded-lg border">
      <div className="border-border flex items-center justify-between border-b px-4 py-2.5">
        <span className="text-foreground/90 text-sm font-medium">{t("BET.LABEL")}</span>
        <span className="label-mono text-foreground/35 hidden truncate text-[9px] sm:inline">
          {new URL(env.siteOrigin).host}/value-bets
        </span>
      </div>
      <div className="px-4 py-1">
        <FormRow label={t("LANDING.SHOWCASE.EVENT")}>
          <span className="flex min-w-0 flex-col gap-1">
            <Matchup event={b} size="xs" />
            <LeagueLabel event={b} className="text-foreground/45 text-[11px]" />
          </span>
        </FormRow>
        <FormRow label={t("LANDING.SHOWCASE.BET")}>
          <span className="flex flex-col">
            <span className="text-foreground/95 font-medium">{sideName(b, t)}</span>
            <span className="text-foreground/45 text-[11px]">{marketName(b, t)}</span>
          </span>
        </FormRow>
        <FormRow label={t("LANDING.SHOWCASE.BOOK")}>
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <VendorLabel vendorKey={b.book} />
            {others.length > 0 && (
              <span className="text-foreground/45 inline-flex items-center gap-1.5 text-[11px]">
                <VendorStack vendorKeys={others} size={12} max={4} />
              </span>
            )}
          </span>
        </FormRow>
        <FormRow label={t("LANDING.SHOWCASE.PRICE")}>
          <span className="tabular flex flex-wrap items-baseline gap-x-2">
            <span className="text-foreground/95 font-medium">{odds(b.odds)}</span>
            <span className="text-foreground/45 text-[11px]">
              {t("LANDING.SHOWCASE.FAIR_AT", { fair: odds(b.fair_odds) })}
            </span>
          </span>
        </FormRow>
        <FormRow label={t("LANDING.SHOWCASE.EDGE")}>
          <span className="flex items-center gap-2">
            <Ev value={b.ev} className="font-medium" />
            <ConfidenceBadge value={b.confidence} />
          </span>
        </FormRow>
        <FormRow label={t("LANDING.SHOWCASE.STARTS")}>
          <span className="tabular">{kickoff(b.starts_at, locale)}</span>
        </FormRow>
      </div>
      <div className="border-border flex items-center justify-between gap-3 border-t px-4 py-3">
        <span className="text-foreground/45 text-[11px]">{t("LANDING.SHOWCASE.BOARD_NOTE")}</span>
        <Link
          href={betHref(props.group)}
          className="bg-primary text-primary-foreground inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-90"
        >
          {t("LANDING.SHOWCASE.OPEN_BET")}
          <Icon name="arrow-right" className="size-3" />
        </Link>
      </div>
    </div>
  );
}

// The bot's Discord avatar: the favicon mark, dark square with a white ring, cropped round.
function BotAvatar(props: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-9 shrink-0 overflow-hidden rounded-full bg-[#fafafa]",
        props.className,
      )}
    >
      <LogoImage className="size-full text-[#0a0a0a]" />
    </span>
  );
}

export function DiscordMock(props: { group: GroupedBet }) {
  const t = useTranslations();
  const locale = useLocale();
  const b = props.group.best;

  return (
    <div className="mx-auto flex max-w-lg gap-3">
      <BotAvatar />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-foreground/90 text-sm font-medium">{env.appName}</span>
          <span className="rounded-[3px] bg-[#5865F2] px-1 py-px text-[9px] leading-none font-semibold text-white uppercase">
            {t("LANDING.SHOWCASE.DISCORD_APP")}
          </span>
          <span className="text-foreground/40 text-[11px]">{t("LANDING.SHOWCASE.DISCORD_TODAY")}</span>
        </div>
        <div className="border-success/50 bg-muted mt-1.5 max-w-md rounded-sm border-l-4 px-3 py-2.5">
          <p className="text-foreground/55 text-[11px]">{t("LANDING.SHOWCASE.DISCORD_AUTHOR")}</p>
          <p className="text-foreground/90 mt-0.5 text-sm font-semibold">
            {t("FORMAT.MATCHUP", { home: b.home, away: b.away })}
          </p>
          <p className="text-foreground/75 mt-1 text-[13px]">
            <span className="text-foreground/95 font-semibold">{sideName(b, t)}</span> ({marketName(b, t)})
          </p>
          <div className="mt-2.5 grid grid-cols-3 gap-x-3 gap-y-2">
            <Field label={t("LANDING.SHOWCASE.ODDS")}>{odds(b.odds)}</Field>
            <Field label={t("LANDING.SHOWCASE.FAIR")}>{odds(b.fair_odds)}</Field>
            <Field label={t("LANDING.SHOWCASE.EDGE")}>
              <Ev value={b.ev} />
            </Field>
            <Field label={t("LANDING.SHOWCASE.BOOK")}>
              <VendorLabel vendorKey={b.book} size={14} />
            </Field>
            <div className="col-span-2">
              <Field label={t("LANDING.SHOWCASE.STARTS")}>{kickoff(b.starts_at, locale)}</Field>
            </div>
          </div>
          <p className="text-foreground/50 mt-2.5 flex items-center gap-1.5 text-[11px]">
            <Icon name="shield-check" className="size-3" />
            {t("LANDING.SHOWCASE.DISCORD_LOGGED")}
          </p>
        </div>
      </div>
    </div>
  );
}

export function TrackerMock(props: { group: GroupedBet; books: BookStatus[] }) {
  const t = useTranslations();
  const locale = useLocale();
  const b = props.group.best;
  const net = netOdds(Number(b.odds), feeOf(props.books, b.book));
  const raw = kelly(net, b.fair_probability, KELLY_FRACTION) * BANKROLL;
  const rounded = roundStake(raw);

  return (
    <div className="border-input bg-background mx-auto max-w-md overflow-hidden rounded-lg border">
      <div className="border-border flex items-center justify-between border-b px-4 py-2.5">
        <span className="text-foreground/90 text-sm font-medium">{t("LANDING.SHOWCASE.TRACKER_TITLE")}</span>
        <span className="label-mono text-foreground/35 hidden truncate text-[9px] sm:inline">{new URL(env.siteOrigin).host}/tracker</span>
      </div>
      <div className="px-4 py-1">
        <FormRow label={t("LANDING.SHOWCASE.BET")}>
          <span className="flex min-w-0 flex-col">
            <span className="text-foreground/95 truncate font-medium">{sideName(b, t)}</span>
            <span className="text-foreground/45 truncate text-[11px]">
              {t("FORMAT.MATCHUP", { home: b.home, away: b.away })}
            </span>
          </span>
        </FormRow>
        <FormRow label={t("LANDING.SHOWCASE.BOOK")}>
          <VendorLabel vendorKey={b.book} />
        </FormRow>
        <FormRow label={t("LANDING.SHOWCASE.ODDS")}>
          <span className="tabular">{odds(b.odds)}</span>
        </FormRow>
        <FormRow label={t("LANDING.SHOWCASE.STAKE")}>
          <span className="flex flex-wrap items-baseline gap-x-2">
            {raw.toFixed(2) !== String(rounded) && (
              <span className="tabular text-foreground/35 line-through">{raw.toFixed(2)}</span>
            )}
            <span className="tabular text-foreground/95 font-medium">{count(rounded, locale)}</span>
            <span className="text-foreground/45 text-[11px]">
              {t("LANDING.SHOWCASE.STAKE_NOTE", { bankroll: count(BANKROLL, locale) })}
            </span>
          </span>
        </FormRow>
        <FormRow label={t("LANDING.SHOWCASE.CLV")}>
          <span className="text-foreground/50 text-[12px]">{t("LANDING.SHOWCASE.CLV_LATER")}</span>
        </FormRow>
      </div>
      <div className="border-border flex items-center justify-between gap-3 border-t px-4 py-3">
        <span className="text-foreground/45 text-[11px]">{t("LANDING.SHOWCASE.TRACKER_NOTE", { book: bookName(b.book) })}</span>
        <Link
          href={betHref(props.group)}
          className="bg-primary text-primary-foreground inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-90"
        >
          <Icon name="plus" className="size-3" />
          {t("LANDING.SHOWCASE.TRACK")}
        </Link>
      </div>
    </div>
  );
}
