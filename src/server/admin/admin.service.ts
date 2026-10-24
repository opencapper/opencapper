import {
  ADMIN_LIST_LIMIT,
  ADMIN_USERS_PAGE_SIZE,
  type AdminUsersQuery,
} from "@/lib/api/typebox/admin";
import { SOURCE_PLATFORMS } from "@/lib/api/typebox/sources";
import { getDb } from "@/lib/db/server/client";
import {
  authAccount,
  authUser,
  historyPicks,
  pickLog,
  pickSettlements,
  pickSources,
  picks,
  profileClaims,
  users,
} from "@/lib/db/schema/server";
import type {
  AdminImportedProfile,
  AdminPick,
  AdminSystem,
  AdminUsersPage,
} from "@/lib/types";
import { dayjs } from "@/lib/utils/format/date";
import { effectiveRole } from "@/server/auth/auth";
import { serverEnv } from "@/server/env";
import { getImportRuns } from "@/server/importers/import.job";
import { listAnchors } from "@/server/log/anchor.service";
import { getLogHead } from "@/server/log/log.service";
import { getBoardBudget } from "@/server/odds/board.service";
import { getOddsCredits } from "@/server/odds/odds.service";
import {
  lookupParticipants,
  pendingLookups,
} from "@/server/participants/participants.service";
import { toApiPick } from "@/server/picks/picks.mapper";
import { activeClaim } from "@/server/claims/profile-claims";
import { avatarColumns, avatarUrl } from "@/server/users/avatar";
import { and, count, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

function pickCounts() {
  return getDb()
    .select({ userId: picks.userId, total: count().as("pick_total") })
    .from(picks)
    .groupBy(picks.userId)
    .as("pick_counts");
}

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

export async function listAdminUsers(
  query: AdminUsersQuery,
): Promise<AdminUsersPage> {
  const db = getDb();
  const page = Number(query.page ?? 1);
  const pageSize = Number(query.pageSize ?? ADMIN_USERS_PAGE_SIZE);
  const search = query.q?.trim();
  const pattern = search ? `%${escapeLike(search.toLowerCase())}%` : null;
  // Imported profiles have their own tab; this one lists people who can sign in or post through a bot.
  const where = and(
    isNull(users.sourcePlatform),
    pattern
      ? or(ilike(users.username, pattern), ilike(authUser.email, pattern))
      : undefined,
  );
  const counts = pickCounts();
  const providers = db
    .select({
      userId: authAccount.userId,
      list: sql<string[]>`array_agg(distinct ${authAccount.providerId})`.as(
        "list",
      ),
    })
    .from(authAccount)
    .groupBy(authAccount.userId)
    .as("providers");

  const [rows, totals] = await Promise.all([
    db
      .select({
        id: users.id,
        authUserId: users.authUserId,
        username: users.username,
        telegramId: users.telegramId,
        createdAt: users.createdAt,
        email: authUser.email,
        role: authUser.role,
        banned: authUser.banned,
        banReason: authUser.banReason,
        banExpires: authUser.banExpires,
        providers: providers.list,
        picks: counts.total,
        ...avatarColumns,
      })
      .from(users)
      .leftJoin(authUser, eq(authUser.id, users.authUserId))
      .leftJoin(providers, eq(providers.userId, users.authUserId))
      .leftJoin(counts, eq(counts.userId, users.id))
      .where(where)
      .orderBy(desc(users.createdAt), desc(users.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ total: count() })
      .from(users)
      .leftJoin(authUser, eq(authUser.id, users.authUserId))
      .where(where),
  ]);

  return {
    rows: rows.map((row) => {
      // Bot only identities have no Better Auth account row yet.
      const linked = new Set(row.providers ?? []);
      if (row.discordId) linked.add("discord");
      if (row.telegramId) linked.add("telegram");
      return {
        id: row.id,
        authUserId: row.authUserId,
        username: row.username,
        avatarUrl: avatarUrl(row, 64),
        email: row.email,
        providers: [...linked].toSorted(),
        role: row.authUserId ? effectiveRole(row.authUserId, row.role) : "user",
        banned: Boolean(row.banned),
        banReason: row.banReason,
        banExpires: row.banExpires ? dayjs(row.banExpires).toISOString() : null,
        picks: row.picks ?? 0,
        createdAt: dayjs(row.createdAt).toISOString(),
      };
    }),
    total: totals[0]?.total ?? 0,
    page,
    pageSize,
  };
}

export async function listImportedProfiles(): Promise<AdminImportedProfile[]> {
  const db = getDb();
  const counts = pickCounts();
  const history = db
    .select({
      userId: historyPicks.userId,
      total: count().as("history_total"),
      lastAt: sql<string | null>`max(${historyPicks.createdAt})`.as(
        "last_history_at",
      ),
    })
    .from(historyPicks)
    .groupBy(historyPicks.userId)
    .as("history_counts");
  const lastLive = db
    .select({
      userId: picks.userId,
      lastAt: sql<string | null>`max(${pickSources.createdAt})`.as(
        "last_live_at",
      ),
    })
    .from(pickSources)
    .innerJoin(picks, eq(picks.id, pickSources.pickId))
    .groupBy(picks.userId)
    .as("live_imports");
  const claimant = alias(users, "claimant");
  const claims = db
    .select({
      profileUserId: profileClaims.profileUserId,
      claimant: sql<string>`${claimant.username}`.as("claimant_username"),
    })
    .from(profileClaims)
    .innerJoin(claimant, eq(claimant.id, profileClaims.claimantUserId))
    .where(activeClaim)
    .as("active_claims");

  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      platform: users.sourcePlatform,
      handle: users.sourceHandle,
      url: users.sourceUrl,
      picks: counts.total,
      historyPicks: history.total,
      lastLive: lastLive.lastAt,
      lastHistory: history.lastAt,
      hiddenAt: users.hiddenAt,
      claimedBy: claims.claimant,
      ...avatarColumns,
    })
    .from(users)
    .leftJoin(authUser, eq(authUser.id, users.authUserId))
    .leftJoin(counts, eq(counts.userId, users.id))
    .leftJoin(history, eq(history.userId, users.id))
    .leftJoin(lastLive, eq(lastLive.userId, users.id))
    .leftJoin(claims, eq(claims.profileUserId, users.id))
    .where(sql`${users.sourcePlatform} is not null`)
    .orderBy(desc(users.createdAt))
    .limit(ADMIN_LIST_LIMIT);

  return rows.flatMap((row) => {
    if (!row.platform || !row.handle || !row.url) return [];
    const times = [row.lastLive, row.lastHistory]
      .filter((value) => value !== null)
      .map((value) => dayjs(value).valueOf());
    return [
      {
        id: row.id,
        username: row.username,
        avatarUrl: avatarUrl(row, 64),
        platform: row.platform,
        handle: row.handle,
        url: row.url,
        picks: row.picks ?? 0,
        historyPicks: row.historyPicks ?? 0,
        lastImportAt: times.length
          ? dayjs(Math.max(...times)).toISOString()
          : null,
        hiddenAt: row.hiddenAt ? dayjs(row.hiddenAt).toISOString() : null,
        claimedBy: row.claimedBy,
      },
    ];
  });
}

export async function listRecentPicks(): Promise<AdminPick[]> {
  const rows = await getDb()
    .select({
      pick: picks,
      username: users.username,
      settlement: pickSettlements,
      logSeq: pickLog.seq,
      source: pickSources,
      ...avatarColumns,
    })
    .from(picks)
    .innerJoin(users, eq(users.id, picks.userId))
    .leftJoin(authUser, eq(authUser.id, users.authUserId))
    .leftJoin(pickSettlements, eq(pickSettlements.pickId, picks.id))
    .leftJoin(pickLog, eq(pickLog.pickId, picks.id))
    .leftJoin(pickSources, eq(pickSources.pickId, picks.id))
    .orderBy(desc(picks.createdAt), desc(picks.id))
    .limit(ADMIN_LIST_LIMIT);
  const images = await lookupParticipants(
    rows.flatMap((row) => [
      { sportKey: row.pick.sportKey, name: row.pick.home },
      { sportKey: row.pick.sportKey, name: row.pick.away },
    ]),
  );
  return rows.map((row) => ({
    ...toApiPick(
      row.pick,
      row.username,
      images,
      row.settlement,
      row.logSeq,
      row.source,
    ),
    avatarUrl: avatarUrl(row, 64),
  }));
}

export async function getSystemStatus(): Promise<AdminSystem> {
  const runs = getImportRuns();
  const enabled = {
    polymarket: serverEnv.importPolymarketEnabled,
    reddit: serverEnv.importRedditEnabled,
  };
  const [head, anchors] = await Promise.all([getLogHead(), listAnchors(1)]);
  return {
    oddsConfigured: Boolean(serverEnv.oddsApiKey),
    oddsCredits: getOddsCredits(),
    board: getBoardBudget(),
    importOddsCreditsPerDay: serverEnv.importOddsCreditsPerDay,
    historyDays: serverEnv.importPolymarketHistoryDays,
    gradingEnabled: serverEnv.gradingEnabled,
    importers: SOURCE_PLATFORMS.map((platform) => ({
      platform,
      enabled: enabled[platform],
      lastRun: runs[platform] ?? null,
    })),
    log: { head, lastAnchor: anchors.at(0) ?? null },
    imagesPending: pendingLookups(),
  };
}
