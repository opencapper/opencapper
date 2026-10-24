import { CheckDiscordParams, CheckQuery } from "@/lib/api/typebox/check";
import { isBotToken } from "@/server/auth/bot-token";
import { checkCapper, checkDiscordUser } from "@/server/check/check.service";
import { clientIp, createRateLimiter } from "@/server/rate-limit";
import { Elysia } from "elysia";

const limit = createRateLimiter({ limit: 30, windowMs: 60_000 });

// The bot asks on behalf of a whole server, so its token skips the per IP limit.
function throttle(headers: Record<string, string | undefined>) {
  if (isBotToken(headers.authorization)) return;
  limit(clientIp(headers));
}

export const checkRoute = new Elysia({ prefix: "/check" })
  .get(
    "/",
    (ctx) => {
      throttle(ctx.headers);
      return checkCapper(ctx.query.q);
    },
    { query: CheckQuery },
  )
  .get(
    "/discord/:discordId",
    (ctx) => {
      throttle(ctx.headers);
      return checkDiscordUser(ctx.params.discordId);
    },
    { params: CheckDiscordParams },
  );
