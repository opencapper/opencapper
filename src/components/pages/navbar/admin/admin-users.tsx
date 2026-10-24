"use client";

import { CapperAvatar } from "@/components/elements/capper/capper-avatar";
import { DataTable } from "@/components/elements/table/data-table";
import { DataTableColumnHeader } from "@/components/elements/table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useAdminUsersQuery,
  useSetRoleMutation,
  useUnbanUserMutation,
} from "@/hooks/admin/admin-hook";
import { useHydrated } from "@/hooks/ui/use-hydrated-hook";
import { Link } from "@/i18n/navigation";
import { ADMIN_USERS_SORTS } from "@/lib/api/typebox/admin";
import { PAGE_SIZE_OPTIONS } from "@/lib/config/constants";
import type { IconName } from "@/lib/config/icon-map";
import { AUTH_ROLES, can, type AuthRole } from "@/lib/config/permissions";
import type { TableFeats } from "@/lib/config/table-features";
import type { AdminUser } from "@/lib/types";
import { apiErrorText } from "@/lib/utils/api-error";
import { dayjs, formatDate, formatDateTime } from "@/lib/utils/format/date";
import type {
  ColumnDef,
  PaginationState,
  SortingState,
} from "@tanstack/react-table";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import type { SetAdminFilters } from "./admin-filters";
import { adminUsersQuery, type AdminFilterState } from "./admin-params";
import { ROLE_LABELS } from "./admin-labels";
import { BanSheet } from "./ban-sheet";

const PROVIDER_ICONS: Record<string, IconName> = {
  discord: "brand-discord",
  google: "brand-google",
  telegram: "brand-telegram",
};

export function AdminUsers(props: {
  role: AuthRole;
  userId: number;
  filters: AdminFilterState;
  onChange: SetAdminFilters;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const local = useHydrated();
  const users = useAdminUsersQuery(adminUsersQuery(props.filters));
  const setRole = useSetRoleMutation();
  const unban = useUnbanUserMutation();
  const banTarget = useState<AdminUser | null>(null);
  const draft = useState(props.filters.q);
  const canSetRole = can(props.role, { user: ["set-role"] });
  const canBan = can(props.role, { user: ["ban"] });
  const mutationError = setRole.error ?? unban.error;

  const sorting: SortingState = [
    { id: props.filters.sort, desc: props.filters.order === "desc" },
  ];
  const pagination: PaginationState = {
    pageIndex: props.filters.page - 1,
    pageSize: props.filters.size,
  };

  const columns: ColumnDef<TableFeats, AdminUser>[] = [
    {
      id: "user",
      accessorFn: (row) => row.username,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="ADMIN.USERS.USER" />
      ),
      size: 240,
      meta: { cellClassName: "min-w-52" },
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <CapperAvatar
            username={row.original.username}
            imageUrl={row.original.avatarUrl}
            size="sm"
          />
          <div className="min-w-0">
            <Link
              href={{
                pathname: "/u/[username]",
                params: { username: row.original.username },
              }}
              className="text-foreground/90 block truncate underline-offset-4 hover:underline"
            >
              @{row.original.username}
            </Link>
            <div className="text-muted-foreground truncate text-xs">
              {row.original.email ?? t("ADMIN.USERS.NO_WEB_ACCOUNT")}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "providers",
      accessorFn: (row) => row.providers.length,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="ADMIN.USERS.PROVIDERS" />
      ),
      size: 110,
      cell: ({ row }) => (
        <div className="text-muted-foreground flex items-center gap-1.5">
          {row.original.providers.map((provider) => (
            <Tooltip key={provider}>
              <TooltipTrigger
                render={<span role="img" aria-label={provider} />}
              >
                <Icon
                  name={PROVIDER_ICONS[provider] ?? "user"}
                  className="size-3.5"
                />
              </TooltipTrigger>
              <TooltipContent>{provider}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      ),
    },
    {
      id: "role",
      accessorFn: (row) => row.role,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="ADMIN.USERS.ROLE" />
      ),
      size: 150,
      cell: ({ row }) => {
        const target = row.original;
        if (!canSetRole || !target.authUserId || target.id === props.userId)
          return <RoleBadge role={target.role} />;
        const authUserId = target.authUserId;
        return (
          <Select
            value={target.role}
            onValueChange={(value) => {
              const role = AUTH_ROLES.find((r) => r === value);
              if (role && role !== target.role)
                setRole.mutate({ userId: authUserId, role });
            }}
          >
            <SelectTrigger
              size="sm"
              className="w-32"
              aria-label={t("ADMIN.USERS.ROLE")}
            >
              <SelectValue>
                {(value) => {
                  const role = AUTH_ROLES.find((r) => r === value);
                  return role ? t(ROLE_LABELS[role]) : null;
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {AUTH_ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {t(ROLE_LABELS[role])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      },
    },
    {
      id: "status",
      accessorFn: (row) => (row.banned ? 1 : 0),
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="ADMIN.USERS.STATUS" />
      ),
      size: 110,
      cell: ({ row }) =>
        row.original.banned ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <Badge
                  variant="outline"
                  className="bg-pick-loss/15 text-pick-loss border-transparent"
                />
              }
            >
              <Icon name="ban" />
              {t("ADMIN.USERS.BANNED")}
            </TooltipTrigger>
            <TooltipContent className="max-w-64">
              {row.original.banReason ?? t("ADMIN.USERS.NO_REASON")}
              {row.original.banExpires && (
                <div className="mt-1 opacity-70">
                  {t("ADMIN.USERS.BAN_UNTIL", {
                    time: formatDateTime(row.original.banExpires, locale),
                  })}
                </div>
              )}
            </TooltipContent>
          </Tooltip>
        ) : (
          <span className="text-muted-foreground text-xs">
            {t("ADMIN.USERS.ACTIVE")}
          </span>
        ),
    },
    {
      id: "picks",
      accessorFn: (row) => row.picks,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="ADMIN.USERS.PICKS"
          className="justify-end"
        />
      ),
      size: 70,
      meta: { headerClassName: "text-right", cellClassName: "text-right" },
      cell: ({ row }) => <span className="tabular">{row.original.picks}</span>,
    },
    {
      id: "created",
      accessorFn: (row) => dayjs(row.createdAt).valueOf(),
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="ADMIN.USERS.CREATED" />
      ),
      size: 120,
      cell: ({ row }) => (
        <span className="text-muted-foreground tabular text-xs">
          {formatDate(row.original.createdAt, locale, local)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      size: 110,
      meta: { cellClassName: "text-right" },
      cell: ({ row }) => {
        const target = row.original;
        if (!canBan) return null;
        const blocked =
          !target.authUserId ||
          target.id === props.userId ||
          target.role === "admin";
        if (target.banned && target.authUserId) {
          const authUserId = target.authUserId;
          return (
            <Button
              size="sm"
              variant="outline"
              disabled={unban.isPending}
              onClick={() => unban.mutate({ userId: authUserId })}
            >
              <Icon name="circle-check" />
              {t("ADMIN.USERS.UNBAN")}
            </Button>
          );
        }
        return (
          <Button
            size="sm"
            variant="ghost"
            disabled={blocked}
            title={blocked ? t("ADMIN.USERS.BAN_BLOCKED") : undefined}
            onClick={() => banTarget[1](target)}
          >
            <Icon name="ban" />
            {t("ADMIN.USERS.BAN")}
          </Button>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <form
        className="flex max-w-md gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          props.onChange({ q: draft[0].trim() || null, page: null });
        }}
      >
        <Input
          value={draft[0]}
          onChange={(event) => draft[1](event.target.value)}
          placeholder={t("ADMIN.USERS.SEARCH")}
          aria-label={t("ADMIN.USERS.SEARCH")}
          maxLength={64}
        />
        <Button type="submit" variant="outline">
          <Icon name="search" />
          <span className="hidden sm:inline">{t("ADMIN.USERS.SEARCH_GO")}</span>
        </Button>
      </form>

      {mutationError && (
        <p className="text-destructive text-sm">
          {apiErrorText(t, mutationError, t("ADMIN.USERS.ACTION_FAILED"))}
        </p>
      )}

      {users.isError ? (
        <Card>
          <CardContent className="text-destructive">
            {apiErrorText(t, users.error, t("ADMIN.LOAD_FAILED"))}
          </CardContent>
        </Card>
      ) : (
        <DataTable
          id="ADMIN_USERS"
          data={users.data?.rows ?? []}
          columns={columns}
          total={users.data?.total ?? 0}
          isLoading={users.isPending}
          sorting={sorting}
          onSortingChange={(updater) => {
            const next =
              typeof updater === "function" ? updater(sorting) : updater;
            const first = next[0];
            props.onChange({
              sort: ADMIN_USERS_SORTS.find((s) => s === first?.id) ?? null,
              order: first && !first.desc ? "asc" : null,
              page: null,
            });
          }}
          pagination={pagination}
          onPaginationChange={(updater) => {
            const next =
              typeof updater === "function" ? updater(pagination) : updater;
            const size = PAGE_SIZE_OPTIONS.find((s) => s === next.pageSize);
            const resized = next.pageSize !== pagination.pageSize;
            props.onChange({
              size: size ?? null,
              page: resized || next.pageIndex === 0 ? null : next.pageIndex + 1,
            });
          }}
        />
      )}

      <BanSheet
        target={banTarget[0]}
        onOpenChange={(open) => {
          if (!open) banTarget[1](null);
        }}
      />
    </div>
  );
}

function RoleBadge(props: { role: AuthRole }) {
  const t = useTranslations();
  return (
    <Badge
      variant="outline"
      className={
        props.role === "user" ? "text-muted-foreground" : "text-foreground"
      }
    >
      {props.role !== "user" && <Icon name="shield-user" />}
      {t(ROLE_LABELS[props.role])}
    </Badge>
  );
}
