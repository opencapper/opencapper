import { getPublicPick } from "@/server/picks/lookup.service";
import { getCapperStats } from "@/server/stats/stats.service";
import {
  assertProfileExists,
  getUserHistory,
  getUserPicks,
} from "@/server/users/users.service";
import { Elysia, t } from "elysia";

const params = t.Object({
  username: t.String({ minLength: 2, maxLength: 32 }),
});

// Handlers stay async: Elysia guesses sync from the compiled source and then lets a rejection escape as an empty 500.
export const usersRoute = new Elysia({ prefix: "/users" })
  .get(
    "/:username/picks",
    async (ctx) => {
      await assertProfileExists(ctx.params.username);
      return getUserPicks(ctx.params.username);
    },
    { params },
  )
  .get(
    "/:username/picks/:seq",
    async (ctx) =>
      getPublicPick({
        username: ctx.params.username,
        sequence: ctx.params.seq,
      }),
    {
      params: t.Object({
        username: t.String({ minLength: 2, maxLength: 32 }),
        seq: t.Numeric({ minimum: 1, multipleOf: 1 }),
      }),
    },
  )
  .get(
    "/:username/history",
    async (ctx) => {
      await assertProfileExists(ctx.params.username);
      return getUserHistory(ctx.params.username);
    },
    { params },
  )
  .get("/:username/stats", async (ctx) => getCapperStats(ctx.params.username), {
    params,
  });
