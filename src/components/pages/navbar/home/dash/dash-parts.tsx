"use client";

import { ParticipantAvatar } from "@/components/elements/participant/participant-avatar";
import { Icon } from "@/components/ui/icon";
import type { IconName } from "@/lib/config/icon-map";
import { isMarket, MARKET_KEY } from "@/lib/config/markets";
import { isFighterGroup, sportGroup } from "@/lib/config/sports";
import type { ApiEvent } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatRelative } from "@/lib/utils/format/date";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

export const HAIRLINE_GRID =
  "bg-foreground/6 grid gap-px overflow-hidden rounded-md border border-foreground/6";

export function Panel(props: {
  title: string;
  icon?: IconName;
  meta?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("bg-card flex min-w-0 flex-col", props.className)}>
      <header className="border-foreground/6 flex items-center justify-between gap-2 border-b px-3 py-2">
        <h4 className="label-mono text-foreground/60 flex items-center gap-1.5 text-[9px]">
          {props.icon && <Icon name={props.icon} className="size-3" />}
          {props.title}
        </h4>
        {props.meta && (
          <span className="text-foreground/35 truncate font-mono text-[9px]">
            {props.meta}
          </span>
        )}
      </header>
      <div className="flex min-w-0 flex-1 flex-col">{props.children}</div>
    </section>
  );
}

export function selectionText(pick: {
  market: string;
  selection: string;
  point: number | null;
}) {
  if (pick.point === null) return pick.selection;
  const point =
    pick.market === "spreads" && pick.point > 0
      ? `+${pick.point}`
      : String(pick.point);
  return `${pick.selection} ${point}`;
}

export function MarketLabel(props: { market: string }) {
  const t = useTranslations();
  return (
    <span className="text-foreground/40 text-[10px]">
      {isMarket(props.market) ? t(MARKET_KEY[props.market]) : props.market}
    </span>
  );
}

type MatchupEvent = Omit<ApiEvent, "id" | "commenceTime"> & {
  sportKey: string;
};

export function CompactMatchup(props: { event: MatchupEvent }) {
  const fighters = isFighterGroup(sportGroup(props.event.sportKey));
  const t = useTranslations("PARTICIPANT");
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="flex shrink-0 gap-0.5">
        <ParticipantAvatar
          name={props.event.away}
          imageUrl={props.event.awayImage}
          photo={fighters}
        />
        <ParticipantAvatar
          name={props.event.home}
          imageUrl={props.event.homeImage}
          photo={fighters}
        />
      </span>
      <span className="text-foreground/85 truncate">
        {props.event.away}
        <span className="text-foreground/35 mx-1 text-[10px]">
          {fighters ? t("VS") : t("AT")}
        </span>
        {props.event.home}
      </span>
    </span>
  );
}

export function Ago(props: { at: string; className?: string }) {
  const locale = useLocale();
  return (
    <time
      dateTime={props.at}
      suppressHydrationWarning
      className={cn(
        "text-foreground/35 font-mono text-[10px]",
        props.className,
      )}
    >
      {formatRelative(props.at, locale)}
    </time>
  );
}
