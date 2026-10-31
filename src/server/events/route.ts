import { EventOddsParams, EventsQuery } from "@/lib/api/typebox/picks";
import { isPickLeague } from "@/lib/config/sports";
import { requireAuthUser } from "@/server/auth/auth";
import { isBotToken } from "@/server/auth/bot-token";
import { ApiError } from "@/server/errors";
import { clientIp, createRateLimiter } from "@/server/rate-limit";
import { getActiveLeagues, getBoard } from "@/server/odds/board.service";
import { getEventLines, listEvents } from "@/server/odds/odds.service";
import { Elysia } from "elysia";

const linesPerMinute = createRateLimiter({ limit: 10, windowMs: 60_000 });
const linesPerHour = createRateLimiter({ limit: 60, windowMs: 60 * 60_000 });

// Each uncached call costs 6 credits (3 markets times 2 regions): signed in only, limited per user and per IP.
async function throttleLines(
  request: Headers,
  headers: Record<string, string | undefined>,
) {
  if (isBotToken(headers.authorization)) return;
  const user = await requireAuthUser(request);
  for (const key of [`user:${user.id}`, `ip:${clientIp(headers)}`]) {
    linesPerMinute(key);
    linesPerHour(key);
  }
}

export const eventsRoute = new Elysia({ prefix: "/events" })
  .get("/", (ctx) => listEvents(ctx.query.sport), { query: EventsQuery })
  .get("/leagues", () => getActiveLeagues())
  .get(
    "/board",
    (ctx) => {
      // Only catalog leagues, so a crawler cannot spend credits on arbitrary sport keys.
      if (!isPickLeague(ctx.query.sport))
        throw new ApiError(404, "ERRORS.LEAGUE_NOT_OFFERED");
      return getBoard(ctx.query.sport);
    },
    { query: EventsQuery },
  )
  .get(
    "/:sportKey/:eventId/odds",
    async (ctx) => {
      if (!isPickLeague(ctx.params.sportKey))
        throw new ApiError(404, "ERRORS.LEAGUE_NOT_OFFERED");
      await throttleLines(ctx.request.headers, ctx.headers);
      return getEventLines(ctx.params.sportKey, ctx.params.eventId);
    },
    { params: EventOddsParams },
  );
