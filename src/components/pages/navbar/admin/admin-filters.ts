import { ADMIN_USERS_PAGE_SIZE } from "@/lib/api/typebox/admin";
import { PAGE_SIZE_OPTIONS } from "@/lib/config/constants";
import {
  parseAsInteger,
  parseAsNumberLiteral,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";

export const ADMIN_TABS = ["users", "imports", "picks", "system"] as const;
export type AdminTab = (typeof ADMIN_TABS)[number];

const PARSERS = {
  tab: parseAsStringLiteral(ADMIN_TABS).withDefault("users"),
  q: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  size: parseAsNumberLiteral(PAGE_SIZE_OPTIONS).withDefault(
    ADMIN_USERS_PAGE_SIZE,
  ),
};

export function useAdminFilters() {
  return useQueryStates(PARSERS);
}

export type AdminFilterState = ReturnType<typeof useAdminFilters>[0];
export type SetAdminFilters = ReturnType<typeof useAdminFilters>[1];
