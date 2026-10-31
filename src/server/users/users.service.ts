import { getDb } from "@/lib/db/server/client";
import {
  authUser,
  historyPicks,
  pickDisqualifications,
  pickLog,
  pickSettlements,
  pickSources,
  picks,
  users,
} from "@/lib/db/schema/server";
import type { ApiHistoryPick, ApiPick } from "@/lib/types";
import {
  lookupParticipants,
  participantFields,
} from "@/server/participants/participants.service";
import { toAmericanOdds, toApiPick } from "@/server/picks/picks.mapper";
import { ApiError } from "@/server/errors";
import { avatarColumns, avatarUrl } from "@/server/users/avatar";
import { visibleUser } from "@/server/users/hidden";
import { and, desc, eq } from "drizzle-orm";

const HISTORY_LIMIT = 1000;

// Hidden profiles exist and answer empty; only a name nobody has is a 404.
export async function assertProfileExists(username: string): Promise<void> {
  const [row] = await getDb()
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username.toLowerCase()))
    .limit(1);
  if (!row) throw new ApiError(404, "ERRORS.CAPPER_NOT_FOUND");
}

export async function getUserPicks(username: string): Promise<ApiPick[]> {
  const rows = await getDb()
    .select({
      pick: picks,
      username: users.username,
      settlement: pickSettlements,
      logSeq: pickLog.seq,
      source: pickSources,
      disqualification: pickDisqualifications,
    })
    .from(picks)
    .innerJoin(users, eq(users.id, picks.userId))
    .leftJoin(pickSettlements, eq(pickSettlements.pickId, picks.id))
    .leftJoin(pickLog, eq(pickLog.pickId, picks.id))
    .leftJoin(pickSources, eq(pickSources.pickId, picks.id))
    .leftJoin(pickDisqualifications, eq(pickDisqualifications.pickId, picks.id))
    .where(and(eq(users.username, username.toLowerCase()), visibleUser))
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
      row.disqualification,
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
    .where(and(eq(users.username, username.toLowerCase()), visibleUser))
    .orderBy(desc(historyPicks.commenceTime), desc(historyPicks.id))
    .limit(HISTORY_LIMIT);
  const images = await lookupParticipants(
    rows.flatMap((row) => [
      { sportKey: row.pick.sportKey, name: row.pick.home },
      { sportKey: row.pick.sportKey, name: row.pick.away },
    ]),
  );
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
    // Legacy history rows stored a 50/50 resolution as void.
    result: row.pick.result === "void" ? "split" : row.pick.result,
    gradedAt: row.pick.gradedAt.toISOString(),
    ...participantFields(
      images,
      row.pick.sportKey,
      row.pick.home,
      row.pick.away,
    ),
  }));
}

export async function getProfileAvatar(
  username: string,
): Promise<string | null> {
  const [row] = await getDb()
    .select(avatarColumns)
    .from(users)
    .leftJoin(authUser, eq(authUser.id, users.authUserId))
    .where(and(eq(users.username, username.toLowerCase()), visibleUser))
    .limit(1);
  return row ? avatarUrl(row, 128) : null;
}
