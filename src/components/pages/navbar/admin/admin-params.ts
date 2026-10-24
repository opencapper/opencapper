import {
  ADMIN_USERS_PAGE_SIZE,
  ADMIN_USERS_SORTS,
  type AdminUsersQuery,
} from "@/lib/api/typebox/admin";
import { LEADERBOARD_ORDERS } from "@/lib/api/typebox/leaderboard";
import { PAGE_SIZE_OPTIONS } from "@/lib/config/constants";
import {
  createLoader,
  parseAsInteger,
  parseAsNumberLiteral,
  parseAsString,
  parseAsStringLiteral,
  type inferParserType,
} from "nuqs/server";

export const ADMIN_TABS = ["users", "imports", "picks", "system"] as const;
export type AdminTab = (typeof ADMIN_TABS)[number];

// Shared by the client hook and the server prefetch, so both build the same query key.
export const ADMIN_PARSERS = {
  tab: parseAsStringLiteral(ADMIN_TABS).withDefault("users"),
  q: parseAsString.withDefault(""),
  sort: parseAsStringLiteral(ADMIN_USERS_SORTS).withDefault("created"),
  order: parseAsStringLiteral(LEADERBOARD_ORDERS).withDefault("desc"),
  page: parseAsInteger.withDefault(1),
  size: parseAsNumberLiteral(PAGE_SIZE_OPTIONS).withDefault(
    ADMIN_USERS_PAGE_SIZE,
  ),
};

export const loadAdminFilters = createLoader(ADMIN_PARSERS);

export type AdminFilterState = inferParserType<typeof ADMIN_PARSERS>;

export function adminUsersQuery(filters: AdminFilterState): AdminUsersQuery {
  return {
    q: filters.q || undefined,
    sort: filters.sort,
    order: filters.order,
    page: String(filters.page),
    pageSize: String(filters.size),
  };
}
