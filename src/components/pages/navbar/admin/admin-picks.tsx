"use client";

import { PickStatusBadge } from "@/components/elements/badge/pick-status-badge";
import { CapperAvatar } from "@/components/elements/capper/capper-avatar";
import { SourceIcon } from "@/components/elements/source/source-badge";
import { DataTable } from "@/components/elements/table/data-table";
import { DataTableColumnHeader } from "@/components/elements/table/data-table-column-header";
import { EventCell } from "@/components/pages/navbar/profile/picks-table";
import { Card, CardContent } from "@/components/ui/card";
import { useAdminPicksQuery } from "@/hooks/admin/admin-hook";
import { Link } from "@/i18n/navigation";
import type { TableFeats } from "@/lib/config/table-features";
import type { AdminPick } from "@/lib/types";
import { apiErrorText } from "@/lib/utils/api-error";
import { dayjs, formatDateTime } from "@/lib/utils/format/date";
import {
  formatAmericanOdds,
  formatPlainUnits,
} from "@/lib/utils/format/number";
import type { ColumnDef } from "@tanstack/react-table";
import { useLocale, useTranslations } from "next-intl";

export function AdminPicks(props: { active: boolean }) {
  const t = useTranslations();
  const locale = useLocale();
  const picks = useAdminPicksQuery(props.active);

  const columns: ColumnDef<TableFeats, AdminPick>[] = [
    {
      id: "capper",
      accessorFn: (row) => row.username,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="ADMIN.PICKS.CAPPER" />
      ),
      size: 180,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <CapperAvatar
            username={row.original.username}
            imageUrl={row.original.avatarUrl}
            size="sm"
          />
          <Link
            href={{
              pathname: "/u/[username]",
              params: { username: row.original.username },
            }}
            className="text-foreground/90 truncate underline-offset-4 hover:underline"
          >
            @{row.original.username}
          </Link>
          <span className="text-muted-foreground tabular text-xs">
            #{row.original.sequence}
          </span>
        </div>
      ),
    },
    {
      id: "event",
      header: t("ADMIN.PICKS.EVENT"),
      enableSorting: false,
      size: 260,
      meta: { cellClassName: "min-w-56" },
      cell: ({ row }) => <EventCell event={row.original} />,
    },
    {
      id: "selection",
      header: t("ADMIN.PICKS.SELECTION"),
      enableSorting: false,
      size: 150,
      cell: ({ row }) => (
        <>
          <div>{row.original.selection}</div>
          <div className="text-muted-foreground tabular mt-0.5 text-xs">
            {formatAmericanOdds(row.original.odds)}
            {" / "}
            {formatPlainUnits(row.original.units, locale)}
          </div>
        </>
      ),
    },
    {
      id: "source",
      header: t("ADMIN.PICKS.SOURCE"),
      enableSorting: false,
      size: 110,
      cell: ({ row }) =>
        row.original.source ? (
          <a
            href={row.original.source.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="text-muted-foreground inline-flex items-center gap-1 text-xs underline-offset-4 hover:underline"
          >
            <SourceIcon
              platform={row.original.source.platform}
              className="size-3"
            />
            {row.original.source.platform}
          </a>
        ) : (
          <span className="text-muted-foreground text-xs">
            {t("ADMIN.PICKS.DIRECT")}
          </span>
        ),
    },
    {
      id: "status",
      accessorFn: (row) => row.result,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="ADMIN.PICKS.STATUS" />
      ),
      size: 100,
      cell: ({ row }) => <PickStatusBadge result={row.original.result} />,
    },
    {
      id: "createdAt",
      accessorFn: (row) => dayjs(row.createdAt).valueOf(),
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="ADMIN.PICKS.LOGGED" />
      ),
      size: 160,
      cell: ({ row }) => (
        <span className="text-muted-foreground tabular text-xs">
          {formatDateTime(row.original.createdAt, locale)}
        </span>
      ),
    },
  ];

  if (picks.isError)
    return (
      <Card>
        <CardContent className="text-destructive">
          {apiErrorText(t, picks.error, t("ADMIN.LOAD_FAILED"))}
        </CardContent>
      </Card>
    );

  return (
    <div className="flex flex-col gap-3">
      <p className="label-mono text-foreground/45 text-[11px]">
        {t("ADMIN.PICKS.HINT", { count: picks.data?.length ?? 0 })}
      </p>
      <DataTable
        id="ADMIN_PICKS"
        data={picks.data ?? []}
        columns={columns}
        total={picks.data?.length ?? 0}
        isLoading={picks.isPending}
        localSorting
        emptyState={
          <span className="text-muted-foreground text-sm">
            {t("ADMIN.PICKS.EMPTY")}
          </span>
        }
      />
    </div>
  );
}
