import { getCapperStats } from "@/server/stats/stats.service";
import { getUserHistory, getUserPicks } from "@/server/users/users.service";
import { Elysia, t } from "elysia";

const params = t.Object({
  username: t.String({ minLength: 2, maxLength: 32 }),
});

export const usersRoute = new Elysia({ prefix: "/users" })
  .get("/:username/picks", (ctx) => getUserPicks(ctx.params.username), {
    params,
  })
  .get("/:username/history", (ctx) => getUserHistory(ctx.params.username), {
    params,
  })
  .get("/:username/stats", (ctx) => getCapperStats(ctx.params.username), {
    params,
  });
