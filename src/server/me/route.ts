import { WebPickBody } from "@/lib/api/typebox/picks";
import { getAuthProviders } from "@/server/auth/providers";
import { getAuthUser, requireAuthUser } from "@/server/auth/auth";
import { listOwnClaims } from "@/server/claims/profile-claims";
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
      return createPick({
        ...ctx.body,
        identity: { kind: "user", userId: user.id },
        guildId: null,
      });
    },
    { body: WebPickBody },
  );
