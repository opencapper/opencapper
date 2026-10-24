import { getDb } from "@/lib/db/server/client";
import {
  historyPicks,
  pickLog,
  pickSettlements,
  pickSources,
  picks,
  users,
} from "@/lib/db/schema/server";
import type { ApiHistoryPick, ApiPick } from "@/lib/types";
import { DISCORD_CDN_BASE } from "@/server/constants";
import { lookupParticipants } from "@/server/participants/participants.service";
import { toAmericanOdds, toApiPick } from "@/server/picks/picks.mapper";
import { desc, eq } from "drizzle-orm";

const HISTORY_LIMIT = 1000;

export async function getUserPicks(username: string): Promise<ApiPick[]> {
  const rows = await getDb()
    .select({
      pick: picks,
      username: users.username,
      settlement: pickSettlements,
      logSeq: pickLog.seq,
      source: pickSources,
    })
    .from(picks)
    .innerJoin(users, eq(users.id, picks.userId))
    .leftJoin(pickSettlements, eq(pickSettlements.pickId, picks.id))
    .leftJoin(pickLog, eq(pickLog.pickId, picks.id))
    .leftJoin(pickSources, eq(pickSources.pickId, picks.id))
    .where(eq(users.username, username.toLowerCase()))
    .orderBy(desc(picks.sequence))
    .limit(500);
  const images = await lookupParticipants(
    rows.flatMap((row) => [
      { sportKey: row.pick.sportKey, name: row.pick.home },
      { sportKey: row.pick.sportKey, name: row.pick.away },
    ]),
  );
  return rows.map((row) =>
    toApiPick(
      row.pick,
      row.username,
      images,
      row.settlement,
      row.logSeq,
      row.source,
    ),
  );
}

export async function getUserHistory(
  username: string,
): Promise<ApiHistoryPick[]> {
  const rows = await getDb()
    .select({ pick: historyPicks })
    .from(historyPicks)
    .innerJoin(users, eq(users.id, historyPicks.userId))
    .where(eq(users.username, username.toLowerCase()))
    .orderBy(desc(historyPicks.commenceTime), desc(historyPicks.id))
    .limit(HISTORY_LIMIT);
  return rows.map((row) => ({
    id: row.pick.id,
    platform: row.pick.platform,
    url: row.pick.url,
    tradedAt: row.pick.tradedAt.toISOString(),
    commenceTime: row.pick.commenceTime.toISOString(),
    sportKey: row.pick.sportKey,
    home: row.pick.home,
    away: row.pick.away,
    market: row.pick.market,
    selection: row.pick.selection,
    point: row.pick.point,
    odds: toAmericanOdds(row.pick.oddsDecimal),
    units: row.pick.units,
    result: row.pick.result,
    gradedAt: row.pick.gradedAt.toISOString(),
  }));
}

export async function getProfileAvatar(
  username: string,
): Promise<string | null> {
  const [row] = await getDb()
    .select({ discordId: users.discordId, avatar: users.avatar })
    .from(users)
    .where(eq(users.username, username.toLowerCase()))
    .limit(1);
  return row?.discordId && row.avatar
    ? `${DISCORD_CDN_BASE}/avatars/${row.discordId}/${row.avatar}.png?size=128`
    : null;
}
