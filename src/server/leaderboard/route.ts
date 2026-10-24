import { LeaderboardQuery } from "@/lib/api/typebox/leaderboard";
import { getLeaderboard } from "@/server/leaderboard/leaderboard.service";
import { Elysia } from "elysia";

export const leaderboardRoute = new Elysia({ prefix: "/leaderboard" }).get(
  "/",
  (ctx) => getLeaderboard(ctx.query),
  { query: LeaderboardQuery },
);
