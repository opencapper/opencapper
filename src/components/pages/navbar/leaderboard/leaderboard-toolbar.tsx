"use client";

import {
  SportIcon,
  sportLabelKey,
} from "@/components/elements/sport/sport-icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LEADERBOARD_PERIODS,
  LEADERBOARD_SCOPES,
  LEADERBOARD_SORTS,
  type LeaderboardPeriod,
  type LeaderboardScope,
  type LeaderboardSort,
} from "@/lib/api/typebox/leaderboard";
import { msg } from "@/lib/config/constants";
import { SPORT_GROUPS } from "@/lib/config/sports";
import { useTranslations } from "next-intl";
import type {
  LeaderboardFilterState,
  SetLeaderboardFilters,
} from "./leaderboard-filters";

const ALL_SPORTS = "all";

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
} satisfies Record<LeaderboardSort, string>;

const SCOPE_LABELS = {
  all: msg("LEADERBOARD.FILTERS.SCOPE_ALL"),
  live: msg("LEADERBOARD.FILTERS.SCOPE_LIVE"),
} satisfies Record<LeaderboardScope, string>;

export function LeaderboardToolbar(props: {
  filters: LeaderboardFilterState;
  onChange: SetLeaderboardFilters;
}) {
  const t = useTranslations();
  const sportLabel = (value: unknown) => {
    const group = SPORT_GROUPS.find((g) => g === value);
    return group ? (
      <>
        <SportIcon sportKey={group} />
        {t(sportLabelKey(group))}
      </>
    ) : (
      t("LEADERBOARD.FILTERS.ALL_SPORTS")
    );
  };

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <label className="flex flex-col gap-1.5">
        <span className="label-mono text-foreground/45 text-[10px]">
          {t("LEADERBOARD.FILTERS.SPORT")}
        </span>
        <Select
          value={props.filters.sport ?? ALL_SPORTS}
          onValueChange={(value) =>
            props.onChange({
              sport: SPORT_GROUPS.find((g) => g === value) ?? null,
              page: null,
            })
          }
        >
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue>{sportLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_SPORTS}>{sportLabel(ALL_SPORTS)}</SelectItem>
            {SPORT_GROUPS.map((group) => (
              <SelectItem key={group} value={group}>
                {sportLabel(group)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

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
                sort: LEADERBOARD_SORTS.find((s) => s === value) ?? null,
                page: null,
              })
            }
          >
            <TabsList>
              {LEADERBOARD_SORTS.map((sort) => (
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
