"use client";

import { useHydrated } from "@/hooks/ui/use-hydrated-hook";
import { CARD_LABEL } from "@/components/elements/page/page-heading";
import { DisqualifiedBadge } from "@/components/elements/badge/disqualified-badge";
import { PickStatusBadge } from "@/components/elements/badge/pick-status-badge";
import { Matchup } from "@/components/elements/participant/matchup";
import { SourceIcon } from "@/components/elements/source/source-badge";
import {
  SportIcon,
  sportLabelKey,
} from "@/components/elements/sport/sport-icon";
import { DataTable } from "@/components/elements/table/data-table";
import { DataTableColumnHeader } from "@/components/elements/table/data-table-column-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VendorLabel } from "@/components/elements/vendor/vendor-logo";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link } from "@/i18n/navigation";
import { isMarket, MARKET_KEY } from "@/lib/config/markets";
import type { ProofMarkerStyle } from "@/lib/config/ranking";
import type { TableFeats } from "@/lib/config/table-features";
import { cn } from "@/lib/utils";
import type { ApiPick, ApiPickSource } from "@/lib/types";
import { EXCHANGE_BOOKMAKER } from "@/lib/api/typebox/sources";
import { dayjs, formatDateTime } from "@/lib/utils/format/date";
import {
  formatAmericanOdds,
  formatPercent,
  formatPlainPercent,
  formatPlainUnits,
} from "@/lib/utils/format/number";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const PAGE_SIZE = 20;

export function PicksTable(props: {
  picks: ApiPick[];
  marker: ProofMarkerStyle;
  highlightPickId?: string | null;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const highlightId = props.highlightPickId ?? null;
  // Paged so a capper with hundreds of picks does not render every row; a linked pick opens on its page.
  const highlightIndex = props.picks.findIndex(
    (pick) => pick.id === highlightId,
  );
  const paginationState = useState<PaginationState>({
    pageIndex: highlightIndex > 0 ? Math.floor(highlightIndex / PAGE_SIZE) : 0,
    pageSize: PAGE_SIZE,
  });

  useEffect(() => {
    if (!highlightId) return;
    document
      .getElementById(`pick-${highlightId}`)
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [highlightId, props.picks]);

  const columns: ColumnDef<TableFeats, ApiPick>[] = [
    {
      id: "sequence",
      accessorFn: (pick) => pick.sequence,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="PROFILE.PICKS.SEQUENCE" />
      ),
      size: 60,
      meta: { cellClassName: "text-muted-foreground tabular" },
      cell: ({ row }) => (
        <span id={`pick-${row.original.id}`}>{row.original.sequence}</span>
      ),
    },
    {
      id: "event",
      accessorFn: (pick) => dayjs(pick.commenceTime).valueOf(),
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="PROFILE.PICKS.EVENT" />
      ),
      size: 260,
      meta: { cellClassName: "min-w-56" },
      cell: ({ row }) => <EventCell event={row.original} />,
    },
    {
      id: "market",
      accessorFn: (pick) => pick.market,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="PROFILE.PICKS.MARKET" />
      ),
      size: 100,
      cell: ({ row }) =>
        isMarket(row.original.market)
          ? t(MARKET_KEY[row.original.market])
          : row.original.market,
    },
    {
      id: "selection",
      accessorFn: (pick) => pick.selection,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="PROFILE.PICKS.SELECTION"
        />
      ),
      size: 140,
      cell: ({ row }) => (
        <>
          {row.original.selection}
          {row.original.source && <SourceLine source={row.original.source} />}
        </>
      ),
    },
    {
      id: "odds",
      accessorFn: (pick) => pick.odds,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="PROFILE.PICKS.ODDS" />
      ),
      size: 110,
      cell: ({ row }) => (
        <>
          <div className="tabular">{formatAmericanOdds(row.original.odds)}</div>
          <VendorLabel
            vendorKey={row.original.bookmaker}
            className="text-muted-foreground mt-0.5 text-xs"
          />
        </>
      ),
    },
    {
      id: "clv",
      accessorFn: (pick) => pick.clv,
      sortUndefined: "last",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="PROFILE.PICKS.CLV" />
      ),
      size: 80,
      cell: ({ row }) => <ClvCell pick={row.original} />,
    },
    {
      id: "units",
      accessorFn: (pick) => pick.units,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="PROFILE.PICKS.UNITS"
          className="justify-end"
        />
      ),
      size: 80,
      meta: { headerClassName: "text-right", cellClassName: "text-right" },
      cell: ({ row }) => (
        <span className="tabular">
          {formatPlainUnits(row.original.units, locale)}
        </span>
      ),
    },
    {
      id: "status",
      accessorFn: (pick) => pick.result,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="PROFILE.PICKS.STATUS" />
      ),
      size: 130,
      cell: ({ row }) => <StatusCell pick={row.original} />,
    },
    {
      id: "lockedAt",
      accessorFn: (pick) => dayjs(pick.createdAt).valueOf(),
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="PROFILE.PICKS.LOCKED_AT"
        />
      ),
      size: 170,
      cell: ({ row }) => (
        <LockedCell pick={row.original} marker={props.marker} />
      ),
    },
  ];

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className={CARD_LABEL}>{t("PROFILE.PICKS.TITLE")}</CardTitle>
        <CardDescription>{t("PROFILE.PICKS.DESCRIPTION")}</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          id="PROFILE_PICKS"
          data={props.picks}
          columns={columns}
          total={props.picks.length}
          pagination={paginationState[0]}
          onPaginationChange={paginationState[1]}
          localSorting
          rowClassName={(row) =>
            row.original.id === highlightId
              ? "bg-primary/10 hover:bg-primary/15"
              : undefined
          }
          emptyState={
            <span className="text-muted-foreground text-sm">
              {t("PROFILE.PICKS.EMPTY")}
            </span>
          }
        />
      </CardContent>
    </Card>
  );
}

export function EventCell(props: {
  event: Pick<
    ApiPick,
    | "sportKey"
    | "commenceTime"
    | "home"
    | "away"
    | "homeImage"
    | "awayImage"
    | "homeCountry"
    | "awayCountry"
  >;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const local = useHydrated();
  const label = t(sportLabelKey(props.event.sportKey));
  return (
    <>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger
            render={
              <span
                role="img"
                aria-label={label}
                className="text-muted-foreground inline-flex shrink-0"
              />
            }
          >
            <SportIcon sportKey={props.event.sportKey} />
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
        <Matchup event={props.event} />
      </div>
      <div className="text-muted-foreground mt-1 text-xs">
        {t("PROFILE.PICKS.STARTS_AT", {
          time: formatDateTime(props.event.commenceTime, locale, local),
        })}
      </div>
    </>
  );
}

function StatusCell(props: { pick: ApiPick }) {
  const t = useTranslations();
  const locale = useLocale();
  const local = useHydrated();
  const disqualified = props.pick.disqualified;
  if (!disqualified) return <PickStatusBadge result={props.pick.result} />;
  return (
    <div className="flex flex-col items-start gap-1">
      <PickStatusBadge result={props.pick.result} />
      <DisqualifiedBadge actualStart={disqualified.actualStart} />
      <span className="text-muted-foreground tabular text-xs">
        {t("PROFILE.PICKS.STARTED_AT", {
          time: formatDateTime(disqualified.actualStart, locale, local),
        })}
      </span>
    </div>
  );
}

function LockedCell(props: { pick: ApiPick; marker: ProofMarkerStyle }) {
  const t = useTranslations();
  const locale = useLocale();
  const local = useHydrated();
  const pick = props.pick;
  const lockedAt = formatDateTime(pick.createdAt, locale, local);
  return (
    <>
      <Tooltip>
        <TooltipTrigger className="text-muted-foreground tabular flex items-center gap-1.5 text-xs">
          <Icon
            name="lock"
            className={cn(
              "size-3.5",
              props.marker === "filled"
                ? "bg-primary text-primary-foreground rounded-sm p-0.5"
                : "text-primary",
            )}
          />
          {lockedAt}
        </TooltipTrigger>
        <TooltipContent className="max-w-64">
          {pick.bookmaker === EXCHANGE_BOOKMAKER && pick.source
            ? t("SOURCES.FILL_HINT", {
                time: lockedAt,
                filled: formatDateTime(pick.source.postedAt, locale),
              })
            : t("PROFILE.PICKS.LOCKED_HINT", { time: lockedAt })}
        </TooltipContent>
      </Tooltip>
      {pick.logSeq != null && (
        <Tooltip>
          <TooltipTrigger
            render={
              <Badge
                variant="outline"
                className="text-muted-foreground mt-1.5"
                render={
                  <Link
                    href={{ pathname: "/verify", query: { pick: pick.id } }}
                  />
                }
              />
            }
          >
            <Icon name="shield-check" />
            {t("PROFILE.PICKS.IN_LOG")}
          </TooltipTrigger>
          <TooltipContent className="max-w-64">
            {t("PROFILE.PICKS.IN_LOG_HINT", { seq: pick.logSeq })}
          </TooltipContent>
        </Tooltip>
      )}
    </>
  );
}

function SourceLine(props: { source: ApiPickSource }) {
  const t = useTranslations("SOURCES");
  const locale = useLocale();
  return (
    <div className="text-muted-foreground mt-1 text-xs">
      <Tooltip>
        <TooltipTrigger
          render={
            <a
              href={props.source.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center gap-1 underline-offset-4 hover:underline"
            />
          }
        >
          <SourceIcon platform={props.source.platform} className="size-3" />
          {t("PICK_SOURCE", { platform: props.source.platform })}
        </TooltipTrigger>
        <TooltipContent className="max-w-64">
          {t("POSTED_AT", {
            time: formatDateTime(props.source.postedAt, locale),
          })}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

function ClvCell(props: { pick: ApiPick }) {
  const t = useTranslations("PROFILE.PICKS");
  const locale = useLocale();
  const clv = props.pick.clv;
  const closing = props.pick.closingOdds;

  if (clv === undefined || closing === undefined)
    return (
      <Tooltip>
        <TooltipTrigger className="text-muted-foreground cursor-help text-xs">
          {t("CLV_NONE")}
        </TooltipTrigger>
        <TooltipContent className="max-w-64">
          {t("CLV_NONE_HINT")}
        </TooltipContent>
      </Tooltip>
    );

  const odds = formatAmericanOdds(closing);
  const value = formatPlainPercent(clv, locale);
  return (
    <Tooltip>
      <TooltipTrigger
        className={cn(
          "tabular cursor-help",
          clv > 0 && "text-pick-win",
          clv < 0 && "text-pick-loss",
        )}
      >
        {formatPercent(clv, locale)}
      </TooltipTrigger>
      <TooltipContent className="max-w-64">
        {clv > 0
          ? t("CLV_BEAT", { odds, value })
          : clv < 0
            ? t("CLV_MISSED", { odds, value })
            : t("CLV_EVEN", { odds })}
      </TooltipContent>
    </Tooltip>
  );
}
