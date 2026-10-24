import { Elysia } from "elysia";
import { badgeRoute } from "./badge/route";
import { healthRoute } from "./health/route";
import { ogRoute } from "./og/route";

export const opsDomainRoute = new Elysia({ prefix: "/ops" })
  .use(healthRoute)
  .use(ogRoute)
  .use(badgeRoute);
