"use client";

import { useHydrated } from "@/hooks/ui/use-hydrated-hook";
import { CARD_LABEL } from "@/components/elements/page/page-heading";
import { PickStatusBadge } from "@/components/elements/badge/pick-status-badge";
import { SourceIcon } from "@/components/elements/source/source-badge";
import { DataTable } from "@/components/elements/table/data-table";
import { DataTableColumnHeader } from "@/components/elements/table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUserHistoryQuery } from "@/hooks/users/users-hook";
import { MARKET_KEY } from "@/lib/config/markets";
import type { TableFeats } from "@/lib/config/table-features";
import type { ApiHistoryPick, HistoryStats } from "@/lib/types";
import { cn } from "@/lib/utils";
import { dayjs, formatDateTime } from "@/lib/utils/format/date";
import { apiErrorText } from "@/lib/utils/api-error";
import {
  formatAmericanOdds,
  formatPercent,
  formatPlainUnits,
  formatUnits,
} from "@/lib/utils/format/number";
import type { ColumnDef } from "@tanstack/react-table";
import { useLocale, useTranslations } from "next-intl";
import { EventCell } from "./picks-table";

export function HistoryTable(props: { username: string; stats: HistoryStats }) {
  const t = useTranslations();
  const locale = useLocale();
  const history = useUserHistoryQuery(props.username);

  const columns: ColumnDef<TableFeats, ApiHistoryPick>[] = [
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
      cell: ({ row }) => t(MARKET_KEY[row.original.market]),
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
      cell: ({ row }) => row.original.selection,
    },
    {
      id: "odds",
      accessorFn: (pick) => pick.odds,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="PROFILE.PICKS.ODDS" />
      ),
      size: 90,
      meta: { cellClassName: "tabular" },
      cell: ({ row }) => formatAmericanOdds(row.original.odds),
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
      meta: {
        headerClassName: "text-right",
        cellClassName: "tabular text-right",
      },
      cell: ({ row }) => formatPlainUnits(row.original.units, locale),
    },
    {
      id: "status",
      accessorFn: (pick) => pick.result,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="PROFILE.PICKS.STATUS" />
      ),
      size: 100,
      cell: ({ row }) => <PickStatusBadge result={row.original.result} />,
    },
    {
      id: "tradedAt",
      accessorFn: (pick) => dayjs(pick.tradedAt).valueOf(),
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="PROFILE.HISTORY.TRANSACTION"
        />
      ),
      size: 170,
      cell: ({ row }) => <TransactionCell pick={row.original} />,
    },
  ];

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className={cn(CARD_LABEL, "flex items-center gap-2")}>
          {t("PROFILE.HISTORY.TITLE")}
          <Badge variant="outline" className="text-muted-foreground">
            <Icon name="shield-check" />
            {t("PROFILE.HISTORY.LABEL")}
          </Badge>
        </CardTitle>
        <CardDescription>{t("PROFILE.HISTORY.DESCRIPTION")}</CardDescription>
        <p className="text-foreground/60 tabular mt-1 text-sm">
          {t("PROFILE.HISTORY.SUMMARY", {
            picks: props.stats.picks,
            won: props.stats.wins,
            lost: props.stats.losses,
            push: props.stats.pushes,
            units: formatUnits(props.stats.units, locale),
            roi: formatPercent(props.stats.roi, locale),
          })}
        </p>
      </CardHeader>
      <CardContent>
        {history.isError ? (
          <p className="text-destructive text-sm">
            {apiErrorText(t, history.error, t("PROFILE.ERROR"))}
          </p>
        ) : (
          <DataTable
            id="PROFILE_HISTORY"
            data={history.data ?? []}
            columns={columns}
            total={history.data?.length ?? 0}
            isLoading={history.isPending}
            localSorting
            emptyState={
              <span className="text-muted-foreground text-sm">
                {t("PROFILE.HISTORY.EMPTY")}
              </span>
            }
          />
        )}
      </CardContent>
    </Card>
  );
}

function TransactionCell(props: { pick: ApiHistoryPick }) {
  const t = useTranslations();
  const locale = useLocale();
  const local = useHydrated();
  const traded = formatDateTime(props.pick.tradedAt, locale, local);
  const start = formatDateTime(props.pick.commenceTime, locale, local);
  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <a
              href={props.pick.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-muted-foreground inline-flex items-center gap-1.5 text-xs underline-offset-4 hover:underline"
            />
          }
        >
          <SourceIcon platform={props.pick.platform} className="size-3" />
          {t("PROFILE.HISTORY.VIEW_TX")}
          <Icon name="arrow-up-right" className="size-3" />
        </TooltipTrigger>
        <TooltipContent className="max-w-64">
          {t("PROFILE.HISTORY.TRADED_HINT", { time: traded, start })}
        </TooltipContent>
      </Tooltip>
      <div className="text-muted-foreground tabular mt-1 text-xs">
        {t("PROFILE.HISTORY.TRADED_AT", { time: traded })}
      </div>
    </>
  );
}
