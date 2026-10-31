import { getDb } from "@/lib/db/server/client";
import {
  historyPicks,
  pickSettlements,
  picks,
  users,
  type User,
} from "@/lib/db/schema/server";
import type { SourcePlatform } from "@/lib/api/typebox/sources";
import type { CapperStats, HistoryStats, ProfileStats } from "@/lib/types";
import {
  claimModeFor,
  findClaimant,
  listClaimedProfiles,
} from "@/server/claims/profile-claims";
import { ApiError } from "@/server/errors";
import { getProfileAvatar } from "@/server/users/users.service";
import {
  and,
  desc,
  eq,
  gte,
  lte,
  sql,
  type SQL,
  type SQLWrapper,
} from "drizzle-orm";

const count = (result: string) =>
  sql`count(*) filter (where ${picks.result} = ${result})`.mapWith(Number);

export function netOf(result: SQLWrapper, units: SQLWrapper, odds: SQLWrapper) {
  return sql`coalesce(sum(case
  when ${result} = 'win' then ${units} * (${odds} - 1)
  when ${result} = 'loss' then -${units}
  else 0 end), 0)::float8`.mapWith(Number);
}

export function riskedOf(result: SQLWrapper, units: SQLWrapper) {
  return sql`coalesce(sum(case
  when ${result} in ('win', 'loss', 'push') then ${units}
  else 0 end), 0)::float8`.mapWith(Number);
}

export const net = netOf(picks.result, picks.units, picks.oddsDecimal);

export const risked = riskedOf(picks.result, picks.units);

const statColumns = {
  username: users.username,
  discordUserId: users.discordId,
  picks: sql`count(${picks.id})`.mapWith(Number),
  wins: count("win"),
  losses: count("loss"),
  pushes: count("push"),
  pending: count("pending"),
  units: net,
  unitsRisked: risked,
  clv: sql<number | null>`avg(${pickSettlements.clv})::float8`,
  clvSample: sql`count(${pickSettlements.clv})`.mapWith(Number),
  sourcePlatform: users.sourcePlatform,
  sourceUrl: users.sourceUrl,
};

type StatRow = Omit<
  CapperStats,
  "roi" | "discordUserId" | "clv" | "clvSample" | "source"
> & {
  discordUserId: string | null;
  clv: number | null;
  clvSample: number;
  sourcePlatform: SourcePlatform | null;
  sourceUrl: string | null;
};

function withRoi(row: StatRow): CapperStats {
  const { sourcePlatform, sourceUrl, ...rest } = row;
  return {
    ...rest,
    roi: row.unitsRisked > 0 ? row.units / row.unitsRisked : 0,
    clv: row.clv === null ? undefined : Number(row.clv),
    source:
      sourcePlatform && sourceUrl
        ? { platform: sourcePlatform, url: sourceUrl }
        : null,
  };
}

export function emptyStats(username: string): CapperStats {
  return withRoi({
    username,
    discordUserId: null,
    picks: 0,
    wins: 0,
    losses: 0,
    pushes: 0,
    pending: 0,
    units: 0,
    unitsRisked: 0,
    clv: null,
    clvSample: 0,
    sourcePlatform: null,
    sourceUrl: null,
  });
}

const historyCount = (result: string) =>
  sql`count(*) filter (where ${historyPicks.result} = ${result})::int`.mapWith(
    Number,
  );

async function getHistoryStats(name: string): Promise<HistoryStats | null> {
  const [row] = await getDb()
    .select({
      picks: sql`count(*)::int`.mapWith(Number),
      wins: historyCount("win"),
      losses: historyCount("loss"),
      pushes: historyCount("push"),
      voids: historyCount("void"),
      units: netOf(
        historyPicks.result,
        historyPicks.units,
        historyPicks.oddsDecimal,
      ),
      unitsRisked: riskedOf(historyPicks.result, historyPicks.units),
    })
    .from(historyPicks)
    .innerJoin(users, eq(users.id, historyPicks.userId))
    .where(eq(users.username, name));
  if (!row || row.picks === 0) return null;
  return {
    ...row,
    roi: row.unitsRisked > 0 ? row.units / row.unitsRisked : 0,
  };
}

async function claimInfo(
  profile: Pick<User, "id" | "sourcePlatform">,
): Promise<Omit<ProfileStats, keyof CapperStats | "hidden">> {
  if (!profile.sourcePlatform)
    return {
      claimedBy: null,
      claimed: await listClaimedProfiles(profile.id),
      claimMode: null,
    };
  const claimedBy = await findClaimant(profile.id);
  return {
    claimedBy,
    claimed: [],
    claimMode: claimedBy ? null : claimModeFor(profile.sourcePlatform),
  };
}

export async function getCapperStats(username: string): Promise<ProfileStats> {
  const name = username.toLowerCase();
  const [profile] = await getDb()
    .select({
      id: users.id,
      sourcePlatform: users.sourcePlatform,
      hiddenAt: users.hiddenAt,
    })
    .from(users)
    .where(eq(users.username, name))
    .limit(1);
  const none = { claimedBy: null, claimed: [], claimMode: null };
  if (!profile) throw new ApiError(404, "ERRORS.CAPPER_NOT_FOUND");
  if (profile.hiddenAt) return { ...emptyStats(name), hidden: true, ...none };

  const [rows, history, avatarUrl, claims] = await Promise.all([
    getDb()
      .select(statColumns)
      .from(users)
      .leftJoin(picks, eq(picks.userId, users.id))
      .leftJoin(pickSettlements, eq(pickSettlements.pickId, picks.id))
      .where(eq(users.id, profile.id))
      .groupBy(users.id),
    getHistoryStats(name),
    getProfileAvatar(name),
    claimInfo(profile),
  ]);
  const stats = {
    ...(rows[0] ? withRoi(rows[0]) : emptyStats(name)),
    avatarUrl,
    hidden: false,
    ...claims,
  };
  return history ? { ...stats, history } : stats;
}

export async function getGuildStats(input: {
  guildId: string;
  from: Date;
  to: Date;
}): Promise<CapperStats[]> {
  const filters: SQL[] = [
    eq(picks.guildId, input.guildId),
    gte(picks.commenceTime, input.from),
    lte(picks.commenceTime, input.to),
  ];
  const rows = await getDb()
    .select(statColumns)
    .from(picks)
    .innerJoin(users, eq(users.id, picks.userId))
    .leftJoin(pickSettlements, eq(pickSettlements.pickId, picks.id))
    .where(and(...filters))
    .groupBy(users.id)
    .orderBy(desc(net));
  return rows.map(withRoi);
}
