"use client";

import {
  SportIcon,
  sportLabelKey,
} from "@/components/elements/sport/sport-icon";
import {
  PICK_LEAGUES,
  sportGroup,
  type PickLeagueKey,
} from "@/lib/config/sports";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

type League = (typeof PICK_LEAGUES)[number];

function groupOf(league: League): string {
  return sportGroup(league.sportKey) ?? league.sportKey;
}

export function LeagueChips(props: {
  value: PickLeagueKey;
  active: readonly PickLeagueKey[] | undefined;
  onChange: (league: PickLeagueKey) => void;
}) {
  const t = useTranslations();
  const offered = PICK_LEAGUES.filter(
    (league) =>
      !props.active ||
      league.sportKey === props.value ||
      props.active.includes(league.sportKey),
  );
  const current = offered.find((league) => league.sportKey === props.value);
  const currentGroup = current ? groupOf(current) : null;

  const groups: League[] = [];
  for (const league of offered)
    if (!groups.some((g) => groupOf(g) === groupOf(league)))
      groups.push(league);
  const leagues = offered.filter((league) => groupOf(league) === currentGroup);

  return (
    <div className="flex flex-col gap-2">
      <ChipRow label={t("PICK_NEW.BOARD.SPORTS")}>
        {groups.map((first) => (
          <Chip
            key={groupOf(first)}
            active={groupOf(first) === currentGroup}
            onClick={() => props.onChange(first.sportKey)}
          >
            <SportIcon sportKey={first.sportKey} className="size-4" />
            {t(sportLabelKey(first.sportKey))}
          </Chip>
        ))}
      </ChipRow>
      {leagues.length > 1 && (
        <ChipRow label={t("PICK_NEW.BOARD.LEAGUES")}>
          {leagues.map((league) => (
            <Chip
              key={league.sportKey}
              small
              active={league.sportKey === props.value}
              onClick={() => props.onChange(league.sportKey)}
            >
              {league.label ?? t(sportLabelKey(league.sportKey))}
            </Chip>
          ))}
        </ChipRow>
      )}
    </div>
  );
}

function ChipRow(props: { label: string; children: ReactNode }) {
  return (
    <div
      role="group"
      aria-label={props.label}
      className="thin-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
    >
      {props.children}
    </div>
  );
}

function Chip(props: {
  active: boolean;
  small?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={props.active}
      onClick={props.onClick}
      className={cn(
        "focus-visible:ring-ring/50 inline-flex shrink-0 items-center gap-2 rounded-md border font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-3",
        props.small ? "h-7 px-3 text-xs" : "h-9 px-3.5 text-sm",
        props.active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground/75 hover:bg-muted hover:text-foreground",
      )}
    >
      {props.children}
    </button>
  );
}
