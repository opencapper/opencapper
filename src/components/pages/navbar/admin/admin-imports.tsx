"use client";

import { CapperAvatar } from "@/components/elements/capper/capper-avatar";
import { SourceIcon } from "@/components/elements/source/source-badge";
import { DataTable } from "@/components/elements/table/data-table";
import { DataTableColumnHeader } from "@/components/elements/table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import {
  useAdminHideProfileMutation,
  useAdminImportsQuery,
  useAdminRevokeClaimMutation,
} from "@/hooks/admin/admin-hook";
import { useHydrated } from "@/hooks/ui/use-hydrated-hook";
import { Link } from "@/i18n/navigation";
import { can, type AuthRole } from "@/lib/config/permissions";
import type { TableFeats } from "@/lib/config/table-features";
import type { AdminImportedProfile } from "@/lib/types";
import { apiErrorText } from "@/lib/utils/api-error";
import { dayjs, formatDateTime } from "@/lib/utils/format/date";
import type { ColumnDef } from "@tanstack/react-table";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { ClaimSheet } from "./claim-sheet";

export function AdminImports(props: { active: boolean; role: AuthRole }) {
  const t = useTranslations();
  const locale = useLocale();
  const local = useHydrated();
  const imports = useAdminImportsQuery(props.active);
  const hide = useAdminHideProfileMutation();
  const revoke = useAdminRevokeClaimMutation();
  const claimTarget = useState<AdminImportedProfile | null>(null);
  const canHide = can(props.role, { profiles: ["hide"] });
  const canClaim = can(props.role, { claims: ["approve", "revoke"] });
  const mutationError = hide.error ?? revoke.error;

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
      accessorFn: (row) => row.handle,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="ADMIN.IMPORTS.HANDLE" />
      ),
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
            ? formatDateTime(row.original.lastImportAt, locale, local)
            : t("ADMIN.NEVER")}
        </span>
      ),
    },
    {
      id: "status",
      // Hidden first, then claimed, then visible.
      accessorFn: (row) => (row.hiddenAt ? 2 : row.claimedBy ? 1 : 0),
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="ADMIN.IMPORTS.STATUS" />
      ),
      size: 190,
      cell: ({ row }) => (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {row.original.hiddenAt ? (
            <Badge variant="outline" className="text-muted-foreground">
              <Icon name="eye-off" />
              {t("ADMIN.IMPORTS.HIDDEN")}
            </Badge>
          ) : (
            <span className="text-muted-foreground">
              {t("ADMIN.IMPORTS.VISIBLE")}
            </span>
          )}
          {row.original.claimedBy && (
            <Link
              href={{
                pathname: "/u/[username]",
                params: { username: row.original.claimedBy },
              }}
              className="text-foreground/80 inline-flex items-center gap-1 underline-offset-4 hover:underline"
            >
              <Icon name="user-check" className="size-3" />@
              {row.original.claimedBy}
            </Link>
          )}
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      size: 240,
      meta: { cellClassName: "text-right" },
      cell: ({ row }) => {
        const target = row.original;
        const hidden = target.hiddenAt !== null;
        return (
          <div className="flex justify-end gap-1.5">
            {canHide && (
              <Button
                size="sm"
                variant="ghost"
                disabled={hide.isPending}
                onClick={() => hide.mutate({ id: target.id, hidden: !hidden })}
              >
                <Icon name={hidden ? "eye" : "eye-off"} />
                {hidden ? t("ADMIN.IMPORTS.UNHIDE") : t("ADMIN.IMPORTS.HIDE")}
              </Button>
            )}
            {canClaim && target.claimedBy && (
              <Button
                size="sm"
                variant="ghost"
                disabled={revoke.isPending}
                onClick={() => revoke.mutate({ id: target.id })}
              >
                <Icon name="x-circle" />
                {t("ADMIN.IMPORTS.REVOKE")}
              </Button>
            )}
            {canClaim && !target.claimedBy && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => claimTarget[1](target)}
              >
                <Icon name="user-check" />
                {t("ADMIN.IMPORTS.APPROVE")}
              </Button>
            )}
          </div>
        );
      },
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
    <div className="flex flex-col gap-3">
      {mutationError && (
        <p className="text-destructive text-sm">
          {apiErrorText(t, mutationError, t("ADMIN.USERS.ACTION_FAILED"))}
        </p>
      )}
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
      <ClaimSheet
        target={claimTarget[0]}
        onOpenChange={(open) => {
          if (!open) claimTarget[1](null);
        }}
      />
    </div>
  );
}
