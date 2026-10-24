import { ClaimParams } from "@/lib/api/typebox/claims";
import { requireAuthUser } from "@/server/auth/auth";
import {
  setOwnProfileHidden,
  startClaim,
  verifyClaim,
} from "@/server/claims/claims.service";
import { Elysia } from "elysia";

export const claimsRoute = new Elysia({ prefix: "/claims" })
  .post(
    "/:username/start",
    async (ctx) =>
      startClaim(
        await requireAuthUser(ctx.request.headers),
        ctx.params.username,
      ),
    { params: ClaimParams },
  )
  .post(
    "/:username/verify",
    async (ctx) =>
      verifyClaim(
        await requireAuthUser(ctx.request.headers),
        ctx.params.username,
      ),
    { params: ClaimParams },
  )
  .post(
    "/:username/hide",
    async (ctx) =>
      setOwnProfileHidden(
        await requireAuthUser(ctx.request.headers),
        ctx.params.username,
        true,
      ),
    { params: ClaimParams },
  )
  .post(
    "/:username/unhide",
    async (ctx) =>
      setOwnProfileHidden(
        await requireAuthUser(ctx.request.headers),
        ctx.params.username,
        false,
      ),
    { params: ClaimParams },
  );
