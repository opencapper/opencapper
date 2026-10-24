"use client";

import { useHydrated } from "@/hooks/ui/use-hydrated-hook";
import { ParticipantAvatar } from "@/components/elements/participant/participant-avatar";
import { VendorLogo } from "@/components/elements/vendor/vendor-logo";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { SlipSelection } from "@/components/pages/navbar/picks/new/slip";
import { isFighterGroup, sportGroup } from "@/lib/config/sports";
import { vendorName } from "@/lib/config/vendor-registry";
import type { ApiBoard, ApiBoardEvent } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  dayjs,
  dayKey,
  daysFromToday,
  formatDayHeading,
  formatRelative,
  formatTime,
} from "@/lib/utils/format/date";
import { formatAmericanOdds } from "@/lib/utils/format/number";
import { useLocale, useTranslations } from "next-intl";

type Side = "home" | "away";

function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function groupByDay(events: ApiBoardEvent[], local: boolean) {
  const days: { key: string; events: ApiBoardEvent[] }[] = [];
  // Eden revives ISO strings into Dates, so compare as timestamps.
  const sorted = events.toSorted(
    (a, b) => dayjs(a.commenceTime).valueOf() - dayjs(b.commenceTime).valueOf(),
  );
  for (const event of sorted) {
    const key = dayKey(event.commenceTime, local);
    const last = days.at(-1);
    if (last && last.key === key) last.events.push(event);
    else days.push({ key, events: [event] });
  }
  return days;
}

export function EventBoard(props: {
  sportKey: string;
  board: ApiBoard | undefined;
  pending: boolean;
  error: boolean;
  onRetry: () => void;
  search: string;
  onSearch: (value: string) => void;
  selected: SlipSelection | null;
  onPick: (event: ApiBoardEvent, side: Side) => void;
  onMoreMarkets: (event: ApiBoardEvent) => void;
}) {
  const t = useTranslations("PICK_NEW.BOARD");
  const locale = useLocale();
  const local = useHydrated();
  const query = fold(props.search.trim());
  const events = (props.board?.events ?? []).filter(
    (e) => !query || fold(`${e.home} ${e.away}`).includes(query),
  );
  const days = groupByDay(events, local);

  return (
    <section className="flex flex-col gap-4">
      <div className="relative">
        <Icon
          name="search"
          aria-hidden
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        />
        <Input
          type="search"
          value={props.search}
          onChange={(e) => props.onSearch(e.target.value)}
          placeholder={t("SEARCH_PLACEHOLDER")}
          aria-label={t("SEARCH_LABEL")}
          className="h-10 pr-10 pl-9"
        />
        {props.search && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("CLEAR_SEARCH")}
            onClick={() => props.onSearch("")}
            className="absolute top-1/2 right-1 -translate-y-1/2"
          >
            <Icon name="x" />
          </Button>
        )}
      </div>

      {props.pending && <BoardSkeleton />}

      {props.error && (
        <div className="bg-card ring-foreground/10 flex flex-col items-center gap-3 rounded-lg p-8 text-center ring-1">
          <Icon name="triangle-alert" className="text-destructive size-5" />
          <p className="text-sm">{t("EVENTS_ERROR")}</p>
          <Button variant="outline" size="sm" onClick={props.onRetry}>
            <Icon name="refresh-ccw" />
            {t("RETRY")}
          </Button>
        </div>
      )}

      {props.board && days.length === 0 && (
        <div className="bg-card ring-foreground/10 text-muted-foreground rounded-lg p-8 text-center text-sm ring-1">
          {query ? t("NO_MATCHES") : t("NO_EVENTS")}
        </div>
      )}

      {days.map((day) => (
        <div key={day.key} className="flex flex-col gap-2">
          <h3 className="flex items-baseline justify-between gap-3">
            <span className="label-mono text-foreground/80 text-[11px]">
              <DayHeading
                value={day.events[0].commenceTime}
                locale={locale}
                local={local}
              />
            </span>
            <span className="text-muted-foreground tabular text-xs">
              {t("EVENT_COUNT", { count: day.events.length })}
            </span>
          </h3>
          <ul className="bg-card ring-foreground/10 divide-border divide-y overflow-hidden rounded-lg ring-1">
            {day.events.map((event) => (
              <li key={event.id}>
                <EventRow
                  sportKey={props.sportKey}
                  event={event}
                  selected={
                    props.selected?.event.id === event.id
                      ? props.selected
                      : null
                  }
                  onPick={(side) => props.onPick(event, side)}
                  onMoreMarkets={() => props.onMoreMarkets(event)}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}

      {props.board && props.board.events.length > 0 && (
        <p className="text-muted-foreground text-xs" suppressHydrationWarning>
          {props.board.pricedAt
            ? t("PRICES_NOTE", {
                relative: formatRelative(props.board.pricedAt, locale),
              })
            : t("NO_PRICES_NOTE")}
        </p>
      )}
    </section>
  );
}

function DayHeading(props: { value: string; locale: string; local: boolean }) {
  const t = useTranslations("PICK_NEW.BOARD");
  const offset = daysFromToday(props.value, props.local);
  const date = formatDayHeading(props.value, props.locale, props.local);
  if (offset === 0) return <>{`${t("TODAY")}, ${date}`}</>;
  if (offset === 1) return <>{`${t("TOMORROW")}, ${date}`}</>;
  return <>{date}</>;
}

function EventRow(props: {
  sportKey: string;
  event: ApiBoardEvent;
  selected: SlipSelection | null;
  onPick: (side: Side) => void;
  onMoreMarkets: () => void;
}) {
  const t = useTranslations("PICK_NEW.BOARD");
  const locale = useLocale();
  const local = useHydrated();
  const fighters = isFighterGroup(sportGroup(props.sportKey));
  const line = props.event.moneyline;
  const isPicked = (name: string) =>
    props.selected?.market === "h2h" && props.selected.selection === name;

  const sides = [
    {
      side: "away",
      name: props.event.away,
      image: props.event.awayImage,
      country: props.event.awayCountry,
      odds: line?.away ?? null,
    },
    {
      side: "home",
      name: props.event.home,
      image: props.event.homeImage,
      country: props.event.homeCountry,
      odds: line?.home ?? null,
    },
  ] as const;

  return (
    <div
      className={cn(
        "grid grid-cols-[4.25rem_1fr] gap-x-3 px-3 py-3 sm:grid-cols-[5rem_1fr] sm:px-4",
        props.selected && "bg-foreground/[0.03]",
      )}
    >
      <div className="flex flex-col pt-1.5">
        <span className="tabular text-sm font-medium">
          {formatTime(props.event.commenceTime, locale, local)}
        </span>
        <span
          className="text-muted-foreground text-xs"
          suppressHydrationWarning
        >
          {formatRelative(props.event.commenceTime, locale)}
        </span>
      </div>
      <div className="flex min-w-0 flex-col gap-1.5">
        {sides.map((s) => (
          <div key={s.side} className="flex items-center gap-3">
            <span className="flex min-w-0 flex-1 items-center gap-2.5">
              <ParticipantAvatar
                name={s.name}
                imageUrl={s.image}
                country={s.country}
                photo={fighters}
                size="default"
              />
              <span className="truncate text-sm font-medium">{s.name}</span>
            </span>
            <PriceButton
              odds={s.odds}
              active={isPicked(s.name)}
              label={
                s.odds === null
                  ? t("PICK_SIDE", { name: s.name })
                  : t("PICK_SIDE_AT", {
                      name: s.name,
                      odds: formatAmericanOdds(s.odds),
                    })
              }
              onClick={() => props.onPick(s.side)}
            />
          </div>
        ))}
        <div className="flex items-center justify-between gap-3 pt-0.5">
          <button
            type="button"
            onClick={props.onMoreMarkets}
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 -ml-1 inline-flex items-center gap-1 rounded-sm px-1 text-xs outline-none focus-visible:ring-3"
          >
            {t("MORE_MARKETS")}
            <Icon name="chevron-right" className="size-3" />
          </button>
          {line && (
            <span
              className="text-muted-foreground inline-flex items-center gap-1.5 text-[11px]"
              title={vendorName(line.bookmaker)}
            >
              <VendorLogo vendorKey={line.bookmaker} size={14} />
              <span className="hidden sm:inline">
                {vendorName(line.bookmaker)}
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function PriceButton(props: {
  odds: number | null;
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  const t = useTranslations("PICK_NEW.BOARD");
  return (
    <button
      type="button"
      aria-pressed={props.active}
      aria-label={props.label}
      onClick={props.onClick}
      className={cn(
        "tabular focus-visible:ring-ring/50 h-9 w-20 shrink-0 rounded-md border text-sm font-semibold transition-colors outline-none focus-visible:ring-3",
        props.active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background hover:border-foreground/40 hover:bg-muted",
      )}
    >
      {props.odds === null ? (
        <span className="text-muted-foreground text-xs font-medium">
          {t("NO_PRICE")}
        </span>
      ) : (
        formatAmericanOdds(props.odds)
      )}
    </button>
  );
}

function BoardSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-hidden>
      <Skeleton className="h-4 w-40" />
      <div className="bg-card ring-foreground/10 divide-border divide-y rounded-lg ring-1">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="grid grid-cols-[5rem_1fr] gap-3 p-4">
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-3 w-10" />
            </div>
            <div className="flex flex-col gap-2">
              {[0, 1].map((j) => (
                <div key={j} className="flex items-center gap-3">
                  <Skeleton className="size-8 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-9 w-20" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
