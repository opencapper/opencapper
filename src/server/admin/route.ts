import { AdminUsersQuery } from "@/lib/api/typebox/admin";
import { AdminClaimBody, AdminProfileParams } from "@/lib/api/typebox/claims";
import {
  getSystemStatus,
  listAdminUsers,
  listImportedProfiles,
  listRecentPicks,
} from "@/server/admin/admin.service";
import { requirePermission } from "@/server/auth/auth";
import {
  adminApproveClaim,
  adminRevokeClaim,
  adminSetHidden,
} from "@/server/claims/claims.service";
import { Elysia } from "elysia";

// Role and ban changes go through the Better Auth admin plugin at /api/auth/admin/*.
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
  .post(
    "/imports/:id/hide",
    async (ctx) => {
      await requirePermission(ctx.request.headers, { profiles: ["hide"] });
      return adminSetHidden(ctx.params.id, true);
    },
    { params: AdminProfileParams },
  )
  .post(
    "/imports/:id/unhide",
    async (ctx) => {
      await requirePermission(ctx.request.headers, { profiles: ["hide"] });
      return adminSetHidden(ctx.params.id, false);
    },
    { params: AdminProfileParams },
  )
  .post(
    "/imports/:id/claim",
    async (ctx) => {
      const admin = await requirePermission(ctx.request.headers, {
        claims: ["approve"],
      });
      return adminApproveClaim(ctx.params.id, ctx.body.claimant, admin);
    },
    { params: AdminProfileParams, body: AdminClaimBody },
  )
  .post(
    "/imports/:id/revoke-claim",
    async (ctx) => {
      await requirePermission(ctx.request.headers, { claims: ["revoke"] });
      return adminRevokeClaim(ctx.params.id);
    },
    { params: AdminProfileParams },
  )
  .get("/picks", async (ctx) => {
    await requirePermission(ctx.request.headers, { picks: ["list"] });
    return listRecentPicks();
  })
  .get("/system", async (ctx) => {
    await requirePermission(ctx.request.headers, { system: ["view"] });
    return getSystemStatus();
  });
