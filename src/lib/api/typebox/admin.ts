import { PAGE_SIZE_OPTIONS } from "@/lib/config/constants";
import { t } from "elysia";

export const ADMIN_USERS_PAGE_SIZE = 20;
export const ADMIN_LIST_LIMIT = 200;

export const AdminUsersQuery = t.Object({
  q: t.Optional(t.String({ maxLength: 64 })),
  // A string: Elysia skips minimum and maximum on coerced query numbers.
  page: t.Optional(t.String({ pattern: "^[1-9][0-9]{0,3}$" })),
  pageSize: t.Optional(
    t.String({ pattern: `^(${PAGE_SIZE_OPTIONS.join("|")})$` }),
  ),
});
export type AdminUsersQuery = typeof AdminUsersQuery.static;
