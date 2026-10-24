"use client";

import { CapperAvatar } from "@/components/elements/capper/capper-avatar";
import { SourceIcon } from "@/components/elements/source/source-badge";
import { DataTable } from "@/components/elements/table/data-table";
import { DataTableColumnHeader } from "@/components/elements/table/data-table-column-header";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { useAdminImportsQuery } from "@/hooks/admin/admin-hook";
import { Link } from "@/i18n/navigation";
import type { TableFeats } from "@/lib/config/table-features";
import type { AdminImportedProfile } from "@/lib/types";
import { apiErrorText } from "@/lib/utils/api-error";
import { dayjs, formatDateTime } from "@/lib/utils/format/date";
import type { ColumnDef } from "@tanstack/react-table";
import { useLocale, useTranslations } from "next-intl";

export function AdminImports(props: { active: boolean }) {
  const t = useTranslations();
  const locale = useLocale();
  const imports = useAdminImportsQuery(props.active);

  const columns: ColumnDef<TableFeats, AdminImportedProfile>[] = [
    {
      id: "profile",
      accessorFn: (row) => row.username,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="ADMIN.IMPORTS.PROFILE" />
      ),
      size: 220,
      meta: { cellClassName: "min-w-48" },
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
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
        </div>
      ),
    },
    {
      id: "platform",
      accessorFn: (row) => row.platform,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="ADMIN.IMPORTS.PLATFORM" />
      ),
      size: 120,
      cell: ({ row }) => (
        <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
          <SourceIcon platform={row.original.platform} className="size-3.5" />
          {row.original.platform}
        </span>
      ),
    },
    {
      id: "handle",
      header: t("ADMIN.IMPORTS.HANDLE"),
      enableSorting: false,
      size: 200,
      cell: ({ row }) => (
        <a
          href={row.original.url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="text-muted-foreground inline-flex max-w-48 items-center gap-1 font-mono text-xs underline-offset-4 hover:underline"
        >
          <span className="truncate">{row.original.handle}</span>
          <Icon name="external-link" className="size-3 shrink-0" />
        </a>
      ),
    },
    {
      id: "picks",
      accessorFn: (row) => row.picks,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="ADMIN.IMPORTS.PICKS"
          className="justify-end"
        />
      ),
      size: 80,
      meta: { headerClassName: "text-right", cellClassName: "text-right" },
      cell: ({ row }) => <span className="tabular">{row.original.picks}</span>,
    },
    {
      id: "history",
      accessorFn: (row) => row.historyPicks,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="ADMIN.IMPORTS.HISTORY"
          className="justify-end"
        />
      ),
      size: 90,
      meta: { headerClassName: "text-right", cellClassName: "text-right" },
      cell: ({ row }) => (
        <span className="tabular">{row.original.historyPicks}</span>
      ),
    },
    {
      id: "lastImport",
      accessorFn: (row) =>
        row.lastImportAt ? dayjs(row.lastImportAt).valueOf() : undefined,
      sortUndefined: "last",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="ADMIN.IMPORTS.LAST_IMPORT"
        />
      ),
      size: 170,
      cell: ({ row }) => (
        <span className="text-muted-foreground tabular text-xs">
          {row.original.lastImportAt
            ? formatDateTime(row.original.lastImportAt, locale)
            : t("ADMIN.NEVER")}
        </span>
      ),
    },
  ];

  if (imports.isError)
    return (
      <Card>
        <CardContent className="text-destructive">
          {apiErrorText(t, imports.error, t("ADMIN.LOAD_FAILED"))}
        </CardContent>
      </Card>
    );

  return (
    <DataTable
      id="ADMIN_IMPORTS"
      data={imports.data ?? []}
      columns={columns}
      total={imports.data?.length ?? 0}
      isLoading={imports.isPending}
      localSorting
      emptyState={
        <span className="text-muted-foreground text-sm">
          {t("ADMIN.IMPORTS.EMPTY")}
        </span>
      }
    />
  );
}
