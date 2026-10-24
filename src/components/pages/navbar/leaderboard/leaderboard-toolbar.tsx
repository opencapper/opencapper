"use client";

import {
  SportIcon,
  sportLabelKey,
} from "@/components/elements/sport/sport-icon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LEADERBOARD_PERIODS,
  LEADERBOARD_SCOPES,
  type LeaderboardPeriod,
  type LeaderboardScope,
} from "@/lib/api/typebox/leaderboard";
import { msg } from "@/lib/config/constants";
import { SPORT_GROUPS, type SportGroup } from "@/lib/config/sports";
import { useTranslations } from "next-intl";
import type { SetLeaderboardFilters } from "./leaderboard-filters";
import type { LeaderboardFilterState } from "./leaderboard-params";

// The other sorts are column headers only.
const TOOLBAR_SORTS = ["roi", "units", "picks"] as const;

const PERIOD_LABELS = {
  "30d": msg("LEADERBOARD.FILTERS.PERIOD_30D"),
  "90d": msg("LEADERBOARD.FILTERS.PERIOD_90D"),
  "1y": msg("LEADERBOARD.FILTERS.PERIOD_1Y"),
  all: msg("LEADERBOARD.FILTERS.PERIOD_ALL"),
} satisfies Record<LeaderboardPeriod, string>;

const SORT_LABELS = {
  roi: msg("LEADERBOARD.FILTERS.SORT_ROI"),
  units: msg("LEADERBOARD.FILTERS.SORT_UNITS"),
  picks: msg("LEADERBOARD.FILTERS.SORT_PICKS"),
} satisfies Record<(typeof TOOLBAR_SORTS)[number], string>;

const SCOPE_LABELS = {
  all: msg("LEADERBOARD.FILTERS.SCOPE_ALL"),
  live: msg("LEADERBOARD.FILTERS.SCOPE_LIVE"),
} satisfies Record<LeaderboardScope, string>;

export function LeaderboardToolbar(props: {
  filters: LeaderboardFilterState;
  onChange: SetLeaderboardFilters;
}) {
  const t = useTranslations();
  const selected = props.filters.sport;
  const toggle = (group: SportGroup, checked: boolean) => {
    const next = SPORT_GROUPS.filter((g) =>
      g === group ? checked : selected.includes(g),
    );
    props.onChange({ sport: next.length > 0 ? next : null, page: null });
  };

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex flex-col gap-1.5">
        <span className="label-mono text-foreground/45 text-[10px]">
          {t("LEADERBOARD.FILTERS.SPORT")}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                className="w-full justify-between font-normal sm:w-56"
              />
            }
          >
            <SportSummary sports={selected} />
            <Icon
              name="chevron-down"
              className="text-muted-foreground size-4"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-(--anchor-width) min-w-56">
            <DropdownMenuCheckboxItem
              checked={selected.length === 0}
              onCheckedChange={() =>
                props.onChange({ sport: null, page: null })
              }
            >
              {t("LEADERBOARD.FILTERS.ALL_SPORTS")}
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            {SPORT_GROUPS.map((group) => (
              <DropdownMenuCheckboxItem
                key={group}
                checked={selected.includes(group)}
                onCheckedChange={(checked) => toggle(group, checked)}
              >
                <SportIcon sportKey={group} />
                {t(sportLabelKey(group))}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex flex-col gap-1.5">
          <span className="label-mono text-foreground/45 text-[10px]">
            {t("LEADERBOARD.FILTERS.SCOPE")}
          </span>
          <Tabs
            value={props.filters.scope}
            onValueChange={(value) =>
              props.onChange({
                scope: LEADERBOARD_SCOPES.find((s) => s === value) ?? null,
                page: null,
              })
            }
          >
            <TabsList>
              {LEADERBOARD_SCOPES.map((scope) => (
                <TabsTrigger key={scope} value={scope}>
                  {t(SCOPE_LABELS[scope])}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="label-mono text-foreground/45 text-[10px]">
            {t("LEADERBOARD.FILTERS.PERIOD")}
          </span>
          <Tabs
            value={props.filters.period}
            onValueChange={(value) =>
              props.onChange({
                period: LEADERBOARD_PERIODS.find((p) => p === value) ?? null,
                page: null,
              })
            }
          >
            <TabsList>
              {LEADERBOARD_PERIODS.map((period) => (
                <TabsTrigger key={period} value={period}>
                  {t(PERIOD_LABELS[period])}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="label-mono text-foreground/45 text-[10px]">
            {t("LEADERBOARD.FILTERS.SORT")}
          </span>
          <Tabs
            value={props.filters.sort}
            onValueChange={(value) =>
              props.onChange({
                sort: TOOLBAR_SORTS.find((s) => s === value) ?? null,
                order: null,
                page: null,
              })
            }
          >
            <TabsList>
              {TOOLBAR_SORTS.map((sort) => (
                <TabsTrigger key={sort} value={sort}>
                  {t(SORT_LABELS[sort])}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function SportSummary(props: { sports: SportGroup[] }) {
  const t = useTranslations();
  const first = props.sports[0];
  if (!first) return <span>{t("LEADERBOARD.FILTERS.ALL_SPORTS")}</span>;
  if (props.sports.length === 1)
    return (
      <span className="flex min-w-0 items-center gap-1.5">
        <SportIcon sportKey={first} />
        <span className="truncate">{t(sportLabelKey(first))}</span>
      </span>
    );
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <span className="text-muted-foreground flex items-center gap-1">
        {props.sports.slice(0, 4).map((group) => (
          <SportIcon key={group} sportKey={group} />
        ))}
      </span>
      <span className="truncate">
        {t("LEADERBOARD.FILTERS.SPORTS_SELECTED", {
          count: String(props.sports.length),
        })}
      </span>
    </span>
  );
}
