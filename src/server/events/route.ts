import { EventOddsParams, EventsQuery } from "@/lib/api/typebox/picks";
import { isPickLeague } from "@/lib/config/sports";
import { ApiError } from "@/server/errors";
import { getActiveLeagues, getBoard } from "@/server/odds/board.service";
import { getEventLines, listEvents } from "@/server/odds/odds.service";
import { Elysia } from "elysia";

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
    (ctx) => getEventLines(ctx.params.sportKey, ctx.params.eventId),
    { params: EventOddsParams },
  );
