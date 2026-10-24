import { AdminUsersQuery } from "@/lib/api/typebox/admin";
import {
  getSystemStatus,
  listAdminUsers,
  listImportedProfiles,
  listRecentPicks,
} from "@/server/admin/admin.service";
import { requirePermission } from "@/server/auth/auth";
import { Elysia } from "elysia";

// Reads only. Role and ban changes go through the Better Auth admin plugin at /api/auth/admin/*.
export const adminRoute = new Elysia({ prefix: "/admin" })
  .get(
    "/users",
    async (ctx) => {
      await requirePermission(ctx.request.headers, { user: ["list"] });
      return listAdminUsers(ctx.query);
    },
    { query: AdminUsersQuery },
  )
  .get("/imports", async (ctx) => {
    await requirePermission(ctx.request.headers, { imports: ["list"] });
    return listImportedProfiles();
  })
  .get("/picks", async (ctx) => {
    await requirePermission(ctx.request.headers, { picks: ["list"] });
    return listRecentPicks();
  })
  .get("/system", async (ctx) => {
    await requirePermission(ctx.request.headers, { system: ["view"] });
    return getSystemStatus();
  });
