import type { CheckMatchKind } from "@/lib/api/typebox/check";
import { getDb } from "@/lib/db/server/client";
import { authUser, historyPicks, picks, users } from "@/lib/db/schema/server";
import type { CapperCheck, CheckMatch, CheckRecord } from "@/lib/types";
import { dayjs } from "@/lib/utils/format/date";
import { findClaimant } from "@/server/claims/profile-claims";
import { netOf, riskedOf } from "@/server/stats/stats.service";
import { avatarColumns, avatarUrl } from "@/server/users/avatar";
import { visibleUser } from "@/server/users/hidden";
import {
  and,
  eq,
  inArray,
  or,
  sql,
  type SQL,
  type SQLWrapper,
} from "drizzle-orm";
import { parseCheckQuery, type CheckLookup } from "./check-query";

const MAX_MATCHES = 5;

type Row = Awaited<ReturnType<typeof findRows>>[number];

function findRows(where: SQL) {
  return getDb()
    .select({
      id: users.id,
      username: users.username,
      discordUserId: users.discordId,
      telegramId: users.telegramId,
      sourcePlatform: users.sourcePlatform,
      sourceHandle: users.sourceHandle,
      ...avatarColumns,
    })
    .from(users)
    .leftJoin(authUser, eq(authUser.id, users.authUserId))
    .where(and(where, visibleUser))
    .limit(MAX_MATCHES * 4);
}

// Lower ranks first: an exact platform id beats a name, a name beats a prefixed import slug.
function matchOf(row: Row, lookup: CheckLookup) {
  const kind = (): { kind: CheckMatchKind; rank: number } => {
    if (lookup.numericId && row.discordUserId === lookup.numericId)
      return { kind: "discord", rank: 0 };
    if (lookup.numericId && row.telegramId === lookup.numericId)
      return { kind: "telegram", rank: 0 };
    if (row.sourcePlatform && lookup.handles.includes(row.sourceHandle ?? ""))
      return { kind: row.sourcePlatform, rank: 1 };
    const exact = row.username === lookup.term.toLowerCase();
    const rank = exact ? 2 : 3;
    if (row.sourcePlatform) return { kind: row.sourcePlatform, rank };
    if (row.discordUserId) return { kind: "discord", rank };
    if (row.telegramId) return { kind: "telegram", rank };
    return { kind: "username", rank };
  };
  return { row, ...kind() };
}

const resultCount = (column: SQLWrapper, result: string) =>
  sql`count(*) filter (where ${column} = ${result})::int`.mapWith(Number);

function record(row: {
  wins: number;
  losses: number;
  pushes: number;
  units: number;
  unitsRisked: number;
}): CheckRecord {
  return {
    graded: row.wins + row.losses + row.pushes,
    wins: row.wins,
    losses: row.losses,
    pushes: row.pushes,
    units: row.units,
    unitsRisked: row.unitsRisked,
    roi: row.unitsRisked > 0 ? row.units / row.unitsRisked : 0,
  };
}

async function liveRecords(ids: number[]) {
  const rows = await getDb()
    .select({
      userId: picks.userId,
      wins: resultCount(picks.result, "win"),
      losses: resultCount(picks.result, "loss"),
      pushes: resultCount(picks.result, "push"),
      pending: resultCount(picks.result, "pending"),
      units: netOf(picks.result, picks.units, picks.oddsDecimal),
      unitsRisked: riskedOf(picks.result, picks.units),
      lastAt: sql<Date | string | null>`max(${picks.createdAt})`,
    })
    .from(picks)
    .where(inArray(picks.userId, ids))
    .groupBy(picks.userId);
  return new Map(rows.map((row) => [row.userId, row]));
}

async function historyRecords(ids: number[]) {
  const rows = await getDb()
    .select({
      userId: historyPicks.userId,
      wins: resultCount(historyPicks.result, "win"),
      losses: resultCount(historyPicks.result, "loss"),
      pushes: resultCount(historyPicks.result, "push"),
      units: netOf(
        historyPicks.result,
        historyPicks.units,
        historyPicks.oddsDecimal,
      ),
      unitsRisked: riskedOf(historyPicks.result, historyPicks.units),
      lastAt: sql<Date | string | null>`max(${historyPicks.tradedAt})`,
    })
    .from(historyPicks)
    .where(inArray(historyPicks.userId, ids))
    .groupBy(historyPicks.userId);
  return new Map(rows.map((row) => [row.userId, row]));
}

function latest(...dates: (Date | string | null | undefined)[]) {
  const times = dates.flatMap((d) => (d ? [dayjs(d).valueOf()] : []));
  return times.length > 0 ? dayjs(Math.max(...times)).toISOString() : null;
}

async function toMatches(
  ranked: { row: Row; kind: CheckMatchKind }[],
): Promise<CheckMatch[]> {
  if (ranked.length === 0) return [];
  const ids = ranked.map((match) => match.row.id);
  const loaded = await Promise.all([
    liveRecords(ids),
    historyRecords(ids),
    Promise.all(
      ranked.map((match) =>
        match.row.sourcePlatform ? findClaimant(match.row.id) : null,
      ),
    ),
  ]);
  const zero = { wins: 0, losses: 0, pushes: 0, units: 0, unitsRisked: 0 };
  return ranked.map((match, index) => {
    const row = match.row;
    const live = loaded[0].get(row.id);
    const history = loaded[1].get(row.id);
    const claimant = loaded[2][index];
    const liveRecord = record(live ?? zero);
    const historyRecord = history ? record(history) : null;
    return {
      username: row.username,
      avatarUrl: avatarUrl(row, 128),
      matchedBy: match.kind,
      status: !row.sourcePlatform
        ? "member"
        : claimant
          ? "claimed"
          : "imported",
      platform: row.sourcePlatform,
      claimedBy: claimant?.username ?? null,
      live: { ...liveRecord, pending: live?.pending ?? 0 },
      history: historyRecord,
      total: record({
        wins: liveRecord.wins + (historyRecord?.wins ?? 0),
        losses: liveRecord.losses + (historyRecord?.losses ?? 0),
        pushes: liveRecord.pushes + (historyRecord?.pushes ?? 0),
        units: liveRecord.units + (historyRecord?.units ?? 0),
        unitsRisked: liveRecord.unitsRisked + (historyRecord?.unitsRisked ?? 0),
      }),
      lastPickAt: latest(live?.lastAt, history?.lastAt),
    } satisfies CheckMatch;
  });
}

// Never selects or returns an email; hidden profiles never match.
export async function checkCapper(query: string): Promise<CapperCheck> {
  const lookup = parseCheckQuery(query);
  const conditions: SQL[] = [];
  if (lookup.numericId)
    conditions.push(
      eq(users.discordId, lookup.numericId),
      eq(users.telegramId, lookup.numericId),
    );
  if (lookup.usernames.length > 0)
    conditions.push(inArray(users.username, lookup.usernames));
  if (lookup.handles.length > 0)
    conditions.push(inArray(users.sourceHandle, lookup.handles));
  const where = or(...conditions);
  if (!where) return { query: lookup.term, matches: [] };

  const rows = await findRows(where);
  const ranked = rows
    .map((row) => matchOf(row, lookup))
    .sort((a, b) => a.rank - b.rank || a.row.id - b.row.id)
    .slice(0, MAX_MATCHES);
  return { query: lookup.term, matches: await toMatches(ranked) };
}

export async function checkDiscordUser(
  discordId: string,
): Promise<CapperCheck> {
  const rows = await findRows(eq(users.discordId, discordId));
  return {
    query: discordId,
    matches: await toMatches(
      rows.map((row): { row: Row; kind: CheckMatchKind } => ({
        row,
        kind: "discord",
      })),
    ),
  };
}

// One capper's combined record for the badge; null when unknown or hidden.
export async function badgeRecord(
  username: string,
): Promise<{ total: CheckRecord; withHistory: boolean } | null> {
  const rows = await findRows(eq(users.username, username.toLowerCase()));
  const row = rows[0];
  if (!row) return null;
  const matches = await toMatches([{ row, kind: "username" }]);
  const match = matches[0];
  if (!match) return null;
  return { total: match.total, withHistory: (match.history?.graded ?? 0) > 0 };
}
