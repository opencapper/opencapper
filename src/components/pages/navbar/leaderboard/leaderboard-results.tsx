"use client";

import { DataTable } from "@/components/elements/table/data-table";
import { LEADERBOARD_SORTS } from "@/lib/api/typebox/leaderboard";
import type { LeaderboardRow } from "@/lib/types";
import { PAGE_SIZE_OPTIONS } from "@/lib/config/constants";
import type { PaginationState, SortingState } from "@tanstack/react-table";
import { useLocale, useTranslations } from "next-intl";
import type { SetLeaderboardFilters } from "./leaderboard-filters";
import type { LeaderboardFilterState } from "./leaderboard-params";
import { buildLeaderboardColumns } from "./leaderboard-columns";

export function LeaderboardResults(props: {
  rows: LeaderboardRow[];
  total: number;
  isLoading: boolean;
  filters: LeaderboardFilterState;
  onChange: SetLeaderboardFilters;
}) {
  const t = useTranslations();
  const columns = buildLeaderboardColumns({ t, locale: useLocale() });
  const sorting: SortingState = [
    { id: props.filters.sort, desc: props.filters.order === "desc" },
  ];
  const pagination: PaginationState = {
    pageIndex: props.filters.page - 1,
    pageSize: props.filters.size,
  };

  return (
    <DataTable
      id="LEADERBOARD"
      data={props.rows}
      columns={columns}
      total={props.total}
      isLoading={props.isLoading}
      sorting={sorting}
      onSortingChange={(updater) => {
        const next = typeof updater === "function" ? updater(sorting) : updater;
        const first = next[0];
        props.onChange({
          sort: LEADERBOARD_SORTS.find((s) => s === first?.id) ?? null,
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
  );
}
