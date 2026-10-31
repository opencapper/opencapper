"use client";

import { CARD_LABEL } from "@/components/elements/page/page-heading";
import { ParticipantAvatar } from "@/components/elements/participant/participant-avatar";
import { SportIcon } from "@/components/elements/sport/sport-icon";
import {
  VendorLabel,
  VendorLogo,
} from "@/components/elements/vendor/vendor-logo";
import type { SlipSelection } from "@/components/pages/navbar/picks/new/slip";
import { Button, buttonVariants } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { useEventOddsQuery } from "@/hooks/picks/picks-hook";
import { useCopyToClipboard } from "@/hooks/ui/use-copy-to-clipboard-hook";
import { getPathname, Link } from "@/i18n/navigation";
import {
  PICK_MARKETS,
  PICK_UNITS_MAX,
  PICK_UNITS_MIN,
  PICK_UNITS_STEP,
  type PickMarket,
} from "@/lib/api/typebox/picks";
import { env } from "@/lib/config/env";
import {
  DRAW_SELECTION,
  hasDrawOutcome,
  isMarket,
  MARKET_KEY,
} from "@/lib/config/markets";
import { isFighterGroup, PICK_LEAGUES, sportGroup } from "@/lib/config/sports";
import { vendorName } from "@/lib/config/vendor-registry";
import type { ApiPick } from "@/lib/types";
import { cn } from "@/lib/utils";
import { apiErrorText } from "@/lib/utils/api-error";
import {
  formatDayHeading,
  formatRelative,
  formatTime,
} from "@/lib/utils/format/date";
import {
  formatAmericanOdds,
  formatPlainUnits,
} from "@/lib/utils/format/number";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

const UNIT_PRESETS = [0.5, 1, 2, 3, 5];

export function PickSlip(props: {
  selection: SlipSelection | null;
  onSelect: (next: SlipSelection) => void;
  onClear: () => void;
  units: number;
  onUnits: (value: number) => void;
  locking: boolean;
  error: string | null;
  onLock: () => void;
  created: ApiPick | null;
  onAnother: () => void;
  className?: string;
}) {
  const t = useTranslations("PICK_NEW.SLIP");
  return (
    <section
      aria-label={t("TITLE")}
      className={cn(
        "bg-card text-card-foreground ring-foreground/10 flex flex-col overflow-hidden rounded-xl ring-1",
        props.className,
      )}
    >
      <header className="border-border flex items-center justify-between gap-3 border-b px-4 py-3">
        <h2 className={CARD_LABEL}>{t("TITLE")}</h2>
        {props.selection && !props.created && (
          <span className="bg-primary text-primary-foreground tabular inline-flex size-5 items-center justify-center rounded-full text-[11px] font-semibold">
            1
          </span>
        )}
      </header>
      {props.created ? (
        <SlipDone pick={props.created} onAnother={props.onAnother} />
      ) : props.selection ? (
        <SlipBody
          selection={props.selection}
          onSelect={props.onSelect}
          onClear={props.onClear}
          units={props.units}
          onUnits={props.onUnits}
          locking={props.locking}
          error={props.error}
          onLock={props.onLock}
        />
      ) : (
        <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
          <span className="border-border text-muted-foreground mb-2 inline-flex size-11 items-center justify-center rounded-full border border-dashed">
            <Icon name="plus" className="size-5" />
          </span>
          <p className="font-medium">{t("EMPTY_TITLE")}</p>
          <p className="text-muted-foreground text-sm">{t("EMPTY_HINT")}</p>
        </div>
      )}
    </section>
  );
}

function SlipBody(props: {
  selection: SlipSelection;
  onSelect: (next: SlipSelection) => void;
  onClear: () => void;
  units: number;
  onUnits: (value: number) => void;
  locking: boolean;
  error: string | null;
  onLock: () => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const sel = props.selection;
  const league = PICK_LEAGUES.find((l) => l.sportKey === sel.sportKey);
  const fighters = isFighterGroup(sportGroup(sel.sportKey));

  const chooseMarket = (market: PickMarket) => {
    if (market === sel.market) return;
    props.onSelect({
      ...sel,
      market,
      selection: null,
      odds: null,
      bookmaker: null,
    });
  };

  return (
    <div className="flex flex-col gap-5 p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <SportIcon sportKey={sel.sportKey} className="size-3.5" />
            {league?.label ?? null}
            <Dot />
            <span className="tabular">
              {formatDayHeading(sel.event.commenceTime, locale)},{" "}
              {formatTime(sel.event.commenceTime, locale)}
            </span>
            <Dot />
            {formatRelative(sel.event.commenceTime, locale)}
          </p>
          <div className="mt-2 flex flex-col gap-1.5">
            {(["away", "home"] as const).map((side) => (
              <span key={side} className="flex items-center gap-2 text-sm">
                <ParticipantAvatar
                  name={sel.event[side]}
                  imageUrl={sel.event[`${side}Image`]}
                  country={sel.event[`${side}Country`]}
                  photo={fighters}
                />
                <span className="truncate font-medium">{sel.event[side]}</span>
              </span>
            ))}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("PICK_NEW.SLIP.REMOVE")}
          onClick={props.onClear}
        >
          <Icon name="x" />
        </Button>
      </div>

      <div
        role="radiogroup"
        aria-label={t("PICK_NEW.SLIP.MARKET")}
        className="bg-muted grid grid-cols-3 gap-1 rounded-lg p-1"
      >
        {PICK_MARKETS.map((market) => (
          <button
            key={market}
            type="button"
            role="radio"
            aria-checked={market === sel.market}
            onClick={() => chooseMarket(market)}
            className={cn(
              "focus-visible:ring-ring/50 h-8 rounded-md text-xs font-medium transition-colors outline-none focus-visible:ring-3",
              market === sel.market
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(MARKET_KEY[market])}
          </button>
        ))}
      </div>

      <MarketOutcomes selection={sel} onSelect={props.onSelect} />

      {sel.selection && (
        <div className="border-border flex items-center justify-between gap-3 rounded-lg border p-3">
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs">
              {t(MARKET_KEY[sel.market])}
            </p>
            <p className="truncate font-semibold">
              {sel.selection === DRAW_SELECTION
                ? t("PICK_NEW.BOARD.DRAW")
                : sel.selection}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            {sel.odds !== null && (
              <span className="tabular text-2xl leading-none font-semibold">
                {formatAmericanOdds(sel.odds)}
              </span>
            )}
            {sel.bookmaker && (
              <span className="text-muted-foreground inline-flex items-center gap-1 text-[11px]">
                {t("PICK_NEW.SLIP.INDICATIVE")}
                <VendorLogo vendorKey={sel.bookmaker} size={12} />
                {vendorName(sel.bookmaker)}
              </span>
            )}
          </div>
        </div>
      )}
      {sel.selection && (
        <p className="text-muted-foreground -mt-3 flex items-center gap-1.5 text-xs">
          <Icon name="clock" className="size-3.5 shrink-0" />
          {t("PICK_NEW.SLIP.INDICATIVE_NOTE")}
        </p>
      )}

      <UnitsField value={props.units} onChange={props.onUnits} />

      <div className="bg-foreground/[0.03] border-border flex gap-3 rounded-lg border border-dashed p-3 text-xs">
        <Icon
          name="lock"
          className="text-foreground/60 mt-0.5 size-4 shrink-0"
        />
        <div className="flex flex-col gap-0.5">
          <p className="font-medium">{t("PICK_NEW.SLIP.LOCK_NOTE_TITLE")}</p>
          <p className="text-muted-foreground">
            {t("PICK_NEW.SLIP.LOCK_NOTE")}
          </p>
        </div>
      </div>

      {props.error && (
        <div
          role="alert"
          className="bg-destructive/10 text-destructive flex gap-2 rounded-lg p-3 text-sm"
        >
          <Icon name="triangle-alert" className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium">{t("PICK_NEW.SLIP.NOT_SAVED")}</p>
            <p>{props.error}</p>
          </div>
        </div>
      )}

      <Button
        size="lg"
        className="h-12 w-full text-base"
        disabled={!sel.selection || props.locking}
        onClick={props.onLock}
      >
        <Icon
          name={props.locking ? "loader" : "lock"}
          className={cn(props.locking && "animate-spin")}
        />
        {t("PICK_NEW.SLIP.LOCK")}
        {sel.selection && (
          <span className="tabular opacity-70">
            {t("PICK_NEW.SLIP.UNITS_VALUE", {
              units: formatPlainUnits(props.units, locale),
            })}
          </span>
        )}
      </Button>
    </div>
  );
}

function MarketOutcomes(props: {
  selection: SlipSelection;
  onSelect: (next: SlipSelection) => void;
}) {
  const t = useTranslations("PICK_NEW.SLIP");
  const tRoot = useTranslations();
  const sel = props.selection;
  const fromBoard = sel.market === "h2h";
  const lines = useEventOddsQuery(
    fromBoard ? null : sel.sportKey,
    fromBoard ? null : sel.event.id,
  );

  const pick = (
    outcome: { selection: string; odds: number | null },
    bookmaker: string | null,
  ) =>
    props.onSelect({
      ...sel,
      selection: outcome.selection,
      odds: outcome.odds,
      bookmaker,
    });

  if (fromBoard) {
    const line = sel.event.moneyline;
    const outcomes = [
      {
        selection: sel.event.away,
        label: sel.event.away,
        odds: line?.away ?? null,
      },
      {
        selection: sel.event.home,
        label: sel.event.home,
        odds: line?.home ?? null,
      },
    ];
    if (hasDrawOutcome(sel.sportKey))
      outcomes.splice(1, 0, {
        selection: DRAW_SELECTION,
        label: tRoot("PICK_NEW.BOARD.DRAW"),
        odds: line?.draw ?? null,
      });
    return (
      <OutcomeGrid label={t("CHOOSE_LINE")} columns={outcomes.length}>
        {outcomes.map((o) => (
          <OutcomeButton
            key={o.selection}
            label={o.label}
            odds={o.odds}
            active={sel.selection === o.selection}
            onClick={() => pick(o, line?.bookmaker ?? null)}
          />
        ))}
      </OutcomeGrid>
    );
  }

  if (lines.isPending)
    return (
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-14 rounded-lg" />
        <Skeleton className="h-14 rounded-lg" />
      </div>
    );
  if (lines.isError)
    return (
      <p className="text-destructive text-sm">
        {apiErrorText(tRoot, lines.error, t("LINES_ERROR"))}
      </p>
    );
  if (lines.data.markets.length === 0)
    return <p className="text-muted-foreground text-sm">{t("NO_MARKETS")}</p>;
  const market = lines.data.markets.find((m) => m.market === sel.market);
  if (!market)
    return (
      <p className="text-muted-foreground text-sm">{t("MARKET_UNAVAILABLE")}</p>
    );

  return (
    <OutcomeGrid label={t("CHOOSE_LINE")}>
      {market.outcomes.map((o) => (
        <OutcomeButton
          key={o.selection}
          label={o.selection}
          odds={o.odds}
          active={sel.selection === o.selection}
          onClick={() => pick(o, market.bookmaker)}
        />
      ))}
    </OutcomeGrid>
  );
}

function OutcomeGrid(props: {
  label: string;
  columns?: number;
  children: ReactNode;
}) {
  return (
    <div
      role="group"
      aria-label={props.label}
      className={cn(
        "grid gap-2",
        props.columns === 3 ? "grid-cols-3" : "grid-cols-2",
      )}
    >
      {props.children}
    </div>
  );
}

function OutcomeButton(props: {
  label: string;
  odds: number | null;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={props.active}
      onClick={props.onClick}
      className={cn(
        "focus-visible:ring-ring/50 flex min-h-14 flex-col items-start justify-center gap-0.5 rounded-lg border px-3 py-2 text-left transition-colors outline-none focus-visible:ring-3",
        props.active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background hover:border-foreground/40 hover:bg-muted",
      )}
    >
      <span className="line-clamp-2 text-xs font-medium">{props.label}</span>
      {props.odds !== null && (
        <span className="tabular text-sm font-semibold">
          {formatAmericanOdds(props.odds)}
        </span>
      )}
    </button>
  );
}

function UnitsField(props: { value: number; onChange: (v: number) => void }) {
  const t = useTranslations("PICK_NEW.SLIP");
  const locale = useLocale();
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className={CARD_LABEL}>{t("UNITS")}</span>
        <span className="tabular text-lg font-semibold">
          {t("UNITS_VALUE", { units: formatPlainUnits(props.value, locale) })}
        </span>
      </div>
      <div
        role="radiogroup"
        aria-label={t("UNITS")}
        className="grid grid-cols-5 gap-1.5"
      >
        {UNIT_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            role="radio"
            aria-checked={props.value === preset}
            onClick={() => props.onChange(preset)}
            className={cn(
              "tabular focus-visible:ring-ring/50 h-9 rounded-md border text-sm font-medium transition-colors outline-none focus-visible:ring-3",
              props.value === preset
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:bg-muted",
            )}
          >
            {formatPlainUnits(preset, locale)}
          </button>
        ))}
      </div>
      <Slider
        aria-label={t("UNITS")}
        min={PICK_UNITS_MIN}
        max={PICK_UNITS_MAX}
        step={PICK_UNITS_STEP}
        value={props.value}
        onValueChange={(value) =>
          props.onChange(typeof value === "number" ? value : value[0])
        }
      />
      <p className="text-muted-foreground text-xs">{t("UNITS_HINT")}</p>
    </div>
  );
}

function SlipDone(props: { pick: ApiPick; onAnother: () => void }) {
  const t = useTranslations("PICK_NEW.DONE");
  const tm = useTranslations();
  const locale = useLocale();
  const clipboard = useCopyToClipboard();
  const profile = {
    params: { username: props.pick.username },
    query: { pick: props.pick.id },
  };
  const shareUrl = `${env.siteOrigin}${getPathname({
    locale,
    href: { pathname: "/u/[username]", ...profile },
  })}`;

  const facts: { label: string; value: ReactNode }[] = [
    {
      label: t("CAPTURED"),
      value: (
        <span className="inline-flex items-center gap-2">
          <span className="tabular text-base font-semibold">
            {formatAmericanOdds(props.pick.odds)}
          </span>
          <VendorLabel
            vendorKey={props.pick.bookmaker}
            size={14}
            className="text-muted-foreground text-xs"
          />
        </span>
      ),
    },
    {
      label: t("SEQUENCE"),
      value: <span className="tabular">#{props.pick.sequence}</span>,
    },
  ];
  if (props.pick.logSeq != null)
    facts.push({
      label: t("LOG"),
      value: <span className="tabular">#{props.pick.logSeq}</span>,
    });

  return (
    <div className="flex flex-col gap-5 p-4">
      <div className="flex flex-col items-center gap-2 pt-2 text-center">
        <span className="bg-primary text-primary-foreground inline-flex size-12 items-center justify-center rounded-full">
          <Icon name="check" className="size-6" />
        </span>
        <p className="text-lg font-semibold">{t("TITLE")}</p>
        <p className="text-muted-foreground text-sm">{t("DESCRIPTION")}</p>
      </div>

      <div className="border-border rounded-lg border p-3">
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
          {tm(
            MARKET_KEY[isMarket(props.pick.market) ? props.pick.market : "h2h"],
          )}
          <Dot />
          {formatRelative(props.pick.commenceTime, locale)}
        </p>
        <p className="mt-0.5 font-semibold">{props.pick.selection}</p>
        <p className="text-muted-foreground text-xs">
          {props.pick.away} {tm("PARTICIPANT.AT")} {props.pick.home}
        </p>
        <dl className="divide-border mt-3 divide-y text-sm">
          {facts.map((fact) => (
            <div
              key={fact.label}
              className="flex items-center justify-between gap-3 py-2"
            >
              <dt className="text-muted-foreground">{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          onClick={() => clipboard.copy(shareUrl, { withToast: t("COPIED") })}
        >
          <Icon name={clipboard.isCopied ? "check" : "link"} />
          {t("COPY_LINK")}
        </Button>
        <Link
          href={{ pathname: "/u/[username]", ...profile }}
          className={buttonVariants({ variant: "outline" })}
        >
          <Icon name="user" />
          {t("VIEW_PROFILE")}
        </Link>
      </div>
      <Button size="lg" className="h-11 w-full" onClick={props.onAnother}>
        <Icon name="plus" />
        {t("ANOTHER")}
      </Button>
    </div>
  );
}

function Dot() {
  return <span aria-hidden className="bg-foreground/30 size-1 rounded-full" />;
}
