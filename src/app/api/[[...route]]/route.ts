import { ApiError, errorBody } from "@/server/errors";
import { eventsRoute } from "@/server/events/route";
import { meRoute } from "@/server/me/route";
import { leaderboardRoute } from "@/server/leaderboard/route";
import { logRoute } from "@/server/log/route";
import { opsDomainRoute } from "@/server/ops/route";
import { picksRoute } from "@/server/picks/route";
import { recapRoute } from "@/server/recap/route";
import { usersRoute } from "@/server/users/route";
import { Elysia } from "elysia";

export const app = new Elysia({ prefix: "/api" })
  .error({ ApiError })
  .onError((ctx) => {
    if (ctx.code === "ApiError") {
      ctx.set.status = ctx.error.status;
      return errorBody(ctx.error.key, ctx.error.params);
    }
    if (ctx.code === "VALIDATION") {
      ctx.set.status = 422;
      return errorBody("ERRORS.INVALID_REQUEST", {
        path: ctx.error.valueError?.path || "body",
      });
    }
    if (ctx.code === "NOT_FOUND") {
      ctx.set.status = 404;
      return errorBody("ERRORS.NOT_FOUND");
    }
    console.error(ctx.error);
    ctx.set.status = 500;
    return errorBody("ERRORS.INTERNAL");
  })
  .use(opsDomainRoute)
  .use(meRoute)
  .use(eventsRoute)
  .use(picksRoute)
  .use(usersRoute)
  .use(recapRoute)
  .use(leaderboardRoute)
  .use(logRoute);

export type App = typeof app;

export const GET = app.handle;
export const POST = app.handle;
