import { WebPickBody } from "@/lib/api/typebox/picks";
import { getAuthProviders } from "@/server/auth/providers";
import { getAuthUser, requireAuthUser } from "@/server/auth/auth";
import { listOwnClaims } from "@/server/claims/profile-claims";
import { throttlePicks } from "@/server/picks/pick-throttle";
import { createPick } from "@/server/picks/picks.service";
import { Elysia } from "elysia";

export const meRoute = new Elysia({ prefix: "/me" })
  .get("/", (ctx) => getAuthUser(ctx.request.headers))
  .get("/providers", () => getAuthProviders())
  .get("/claims", async (ctx) => {
    const user = await getAuthUser(ctx.request.headers);
    return user ? listOwnClaims(user.id) : [];
  })
  .post(
    "/picks",
    async (ctx) => {
      const user = await requireAuthUser(ctx.request.headers);
      throttlePicks(`user:${user.id}`);
      return createPick({
        identity: { kind: "user", userId: user.id },
        guildId: null,
        sportKey: ctx.body.sportKey,
        eventId: ctx.body.eventId,
        market: ctx.body.market,
        selection: ctx.body.selection,
        units: ctx.body.units,
      });
    },
    { body: WebPickBody },
  );
