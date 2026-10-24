import { useQueryStates } from "nuqs";
import { ADMIN_PARSERS } from "./admin-params";

export function useAdminFilters() {
  return useQueryStates(ADMIN_PARSERS);
}

export type SetAdminFilters = ReturnType<typeof useAdminFilters>[1];
