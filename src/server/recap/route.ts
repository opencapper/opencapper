import { RecapQuery } from "@/lib/api/typebox/picks";
import { getRecap } from "@/server/recap/recap.service";
import { Elysia } from "elysia";

export const recapRoute = new Elysia({ prefix: "/recap" }).get(
  "/",
  (ctx) => getRecap(ctx.query),
  { query: RecapQuery },
);
