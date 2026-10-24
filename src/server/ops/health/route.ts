import { getDb } from "@/lib/db/server/client";
import { sql } from "drizzle-orm";
import { Elysia } from "elysia";

export const healthRoute = new Elysia({ prefix: "/health" }).get(
  "/",
  async () => {
    const db = await getDb()
      .execute(sql`select 1`)
      .then(() => "ok" as const)
      .catch(() => "fail" as const);
    return { status: db === "ok" ? "healthy" : "degraded", checks: { db } };
  },
);
