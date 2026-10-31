import { getDb } from "@/lib/db/server/client";
import { historyPicks, picks, users } from "@/lib/db/schema/server";
import { visibleUser } from "@/server/users/hidden";
import { desc, eq, max, sql } from "drizzle-orm";
import { unionAll } from "drizzle-orm/pg-core";

const MAX_PROFILES = 5000;
const SITEMAP_TTL_MS = 60 * 60_000;

type SitemapProfile = { username: string; lastPickAt: Date | null };

let cache: { expires: number; profiles: SitemapProfile[] } | null = null;

// One grouped pass over each pick table instead of a subquery per user.
async function loadProfiles(): Promise<SitemapProfile[]> {
  const db = getDb();
  const activity = unionAll(
    db
      .select({ userId: picks.userId, at: max(picks.createdAt).as("at") })
      .from(picks)
      .groupBy(picks.userId),
    db
      .select({
        userId: historyPicks.userId,
        at: max(historyPicks.tradedAt).as("at"),
      })
      .from(historyPicks)
      .groupBy(historyPicks.userId),
  ).as("activity");
  const lastPickAt = sql<Date | string | null>`max(${activity.at})`;
  const rows = await db
    .select({ username: users.username, lastPickAt })
    .from(activity)
    .innerJoin(users, eq(users.id, activity.userId))
    .where(visibleUser)
    .groupBy(users.id)
    .orderBy(desc(lastPickAt))
    .limit(MAX_PROFILES);
  return rows.map((row) => ({
    username: row.username,
    lastPickAt: row.lastPickAt ? new Date(row.lastPickAt) : null,
  }));
}

// Visible profiles with at least one live pick or on chain trade, most recently active first, cached an hour.
export async function listSitemapProfiles(): Promise<SitemapProfile[]> {
  if (cache && cache.expires > Date.now()) return cache.profiles;
  const profiles = await loadProfiles();
  cache = { expires: Date.now() + SITEMAP_TTL_MS, profiles };
  return profiles;
}
