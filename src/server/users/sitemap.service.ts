import { getDb } from "@/lib/db/server/client";
import { historyPicks, picks, users } from "@/lib/db/schema/server";
import { visibleUser } from "@/server/users/hidden";
import { and, eq, exists, or, sql } from "drizzle-orm";

const MAX_PROFILES = 5000;

// Visible profiles with at least one live pick or on chain trade, most recently active first.
export async function listSitemapProfiles(): Promise<
  { username: string; lastPickAt: Date | null }[]
> {
  const db = getDb();
  const lastPick = sql<Date | string | null>`greatest(
    (select max(${picks.createdAt}) from ${picks} where ${picks.userId} = ${users.id}),
    (select max(${historyPicks.tradedAt}) from ${historyPicks} where ${historyPicks.userId} = ${users.id})
  )`;
  const rows = await db
    .select({ username: users.username, lastPickAt: lastPick })
    .from(users)
    .where(
      and(
        visibleUser,
        or(
          exists(
            db
              .select({ one: sql`1` })
              .from(picks)
              .where(eq(picks.userId, users.id)),
          ),
          exists(
            db
              .select({ one: sql`1` })
              .from(historyPicks)
              .where(eq(historyPicks.userId, users.id)),
          ),
        ),
      ),
    )
    .orderBy(sql`${lastPick} desc nulls last`)
    .limit(MAX_PROFILES);
  return rows.map((row) => ({
    username: row.username,
    lastPickAt: row.lastPickAt ? new Date(row.lastPickAt) : null,
  }));
}
