import type { SourcePlatform } from "@/lib/api/typebox/sources";
import { getDb } from "@/lib/db/server/client";
import {
  claimChallenges,
  profileClaims,
  users,
  type User,
} from "@/lib/db/schema/server";
import type { AuthUser, ClaimChallenge } from "@/lib/types";
import { dayjs } from "@/lib/utils/format/date";
import { activeClaim, claimModeFor } from "@/server/claims/profile-claims";
import { CLAIM_EDIT_URL } from "@/server/constants";
import { ApiError } from "@/server/errors";
import { fetchUserDescription } from "@/server/importers/reddit/reddit.api";
import { clearLeaderboardCache } from "@/server/leaderboard/leaderboard.service";
import { fetchProfileBio } from "@/server/polymarket/polymarket.api";
import {
  and,
  count,
  eq,
  gt,
  isNotNull,
  isNull,
  max,
  sql,
  type SQL,
} from "drizzle-orm";
import { randomInt } from "node:crypto";

const CODE_PREFIX = "opencapper-";
const CODE_ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";
const CODE_LENGTH = 6;
const CODE_TTL_HOURS = 2;
const STARTS_PER_HOUR = 10;
const VERIFY_SPACING_SECONDS = 15;
const VERIFY_ATTEMPTS_PER_HOUR = 10;

function newCode(): string {
  let code = CODE_PREFIX;
  for (let i = 0; i < CODE_LENGTH; i++)
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return code;
}

async function importedProfile(
  where: SQL,
): Promise<User & { sourcePlatform: SourcePlatform; sourceHandle: string }> {
  const [row] = await getDb().select().from(users).where(where).limit(1);
  if (!row?.sourcePlatform || !row.sourceHandle)
    throw new ApiError(404, "ERRORS.CLAIM_NOT_IMPORTED");
  return {
    ...row,
    sourcePlatform: row.sourcePlatform,
    sourceHandle: row.sourceHandle,
  };
}

function profileByName(username: string) {
  return importedProfile(eq(users.username, username.toLowerCase()));
}

async function currentClaimant(profileUserId: number) {
  const [row] = await getDb()
    .select({ claimantUserId: profileClaims.claimantUserId })
    .from(profileClaims)
    .where(and(eq(profileClaims.profileUserId, profileUserId), activeClaim))
    .limit(1);
  return row?.claimantUserId ?? null;
}

async function assertUnclaimed(profileUserId: number) {
  if ((await currentClaimant(profileUserId)) !== null)
    throw new ApiError(409, "ERRORS.PROFILE_ALREADY_CLAIMED");
}

export async function startClaim(
  claimant: AuthUser,
  username: string,
): Promise<ClaimChallenge> {
  const profile = await profileByName(username);
  if (profile.hiddenAt) throw new ApiError(404, "ERRORS.CLAIM_NOT_IMPORTED");
  await assertUnclaimed(profile.id);
  if (claimModeFor(profile.sourcePlatform) === "manual")
    throw new ApiError(409, "ERRORS.CLAIM_MANUAL_ONLY");

  const db = getDb();
  const hourAgo = dayjs().subtract(1, "hour").toDate();
  const [issued] = await db
    .select({ total: count() })
    .from(claimChallenges)
    .where(
      and(
        eq(claimChallenges.claimantUserId, claimant.id),
        gt(claimChallenges.createdAt, hourAgo),
      ),
    );
  if ((issued?.total ?? 0) >= STARTS_PER_HOUR)
    throw new ApiError(429, "ERRORS.CLAIM_RATE_LIMITED");

  const code = newCode();
  const expiresAt = dayjs().add(CODE_TTL_HOURS, "hour").toDate();
  // A restart issues a new code but keeps the attempt counter, so restarting does not reset the limit.
  await db
    .insert(claimChallenges)
    .values({
      profileUserId: profile.id,
      claimantUserId: claimant.id,
      code,
      expiresAt,
    })
    .onConflictDoUpdate({
      target: [claimChallenges.profileUserId, claimChallenges.claimantUserId],
      set: { code, expiresAt, createdAt: new Date() },
    });
  return {
    code,
    expiresAt: expiresAt.toISOString(),
    platform: profile.sourcePlatform,
    editUrl: CLAIM_EDIT_URL[profile.sourcePlatform],
  };
}

async function sourceBio(platform: SourcePlatform, handle: string) {
  try {
    return platform === "polymarket"
      ? await fetchProfileBio(handle)
      : await fetchUserDescription(handle);
  } catch (error) {
    console.error(`claim bio lookup ${platform} failed`, error);
    throw new ApiError(502, "ERRORS.CLAIM_SOURCE_UNAVAILABLE");
  }
}

async function countAttempt(challengeId: number, claimantUserId: number) {
  const db = getDb();
  const [last] = await db
    .select({ at: max(claimChallenges.lastAttemptAt) })
    .from(claimChallenges)
    .where(eq(claimChallenges.claimantUserId, claimantUserId));
  if (
    last?.at &&
    dayjs().diff(dayjs(last.at), "second") < VERIFY_SPACING_SECONDS
  )
    throw new ApiError(429, "ERRORS.CLAIM_RATE_LIMITED");
  const [row] = await db
    .update(claimChallenges)
    .set({
      attempts: sql`case when ${claimChallenges.lastAttemptAt} is null or ${claimChallenges.lastAttemptAt} < now() - interval '1 hour' then 1 else ${claimChallenges.attempts} + 1 end`,
      lastAttemptAt: sql`now()`,
    })
    .where(eq(claimChallenges.id, challengeId))
    .returning({ attempts: claimChallenges.attempts });
  if (!row || row.attempts > VERIFY_ATTEMPTS_PER_HOUR)
    throw new ApiError(429, "ERRORS.CLAIM_RATE_LIMITED");
}

export async function verifyClaim(
  claimant: AuthUser,
  username: string,
): Promise<{ username: string }> {
  const profile = await profileByName(username);
  await assertUnclaimed(profile.id);
  const db = getDb();
  const [challenge] = await db
    .select()
    .from(claimChallenges)
    .where(
      and(
        eq(claimChallenges.profileUserId, profile.id),
        eq(claimChallenges.claimantUserId, claimant.id),
      ),
    )
    .limit(1);
  if (!challenge) throw new ApiError(404, "ERRORS.CLAIM_NOT_STARTED");
  if (!dayjs(challenge.expiresAt).isAfter(dayjs()))
    throw new ApiError(410, "ERRORS.CLAIM_CODE_EXPIRED");
  await countAttempt(challenge.id, claimant.id);

  const bio = await sourceBio(profile.sourcePlatform, profile.sourceHandle);
  if (!bio.toLowerCase().includes(challenge.code))
    throw new ApiError(422, "ERRORS.CLAIM_CODE_NOT_FOUND");

  await recordClaim({
    profileUserId: profile.id,
    claimantUserId: claimant.id,
    method:
      profile.sourcePlatform === "polymarket" ? "polymarket_bio" : "reddit_bio",
    approvedByUserId: null,
  });
  return { username: profile.username };
}

async function recordClaim(values: typeof profileClaims.$inferInsert) {
  await getDb().transaction(async (tx) => {
    // The partial unique index allows one active claim per profile; a race loses here.
    const [claim] = await tx
      .insert(profileClaims)
      .values(values)
      .onConflictDoNothing()
      .returning({ id: profileClaims.id });
    if (!claim) throw new ApiError(409, "ERRORS.PROFILE_ALREADY_CLAIMED");
    await tx
      .delete(claimChallenges)
      .where(eq(claimChallenges.profileUserId, values.profileUserId));
  });
}

async function setHidden(profileUserId: number, hidden: boolean) {
  await getDb()
    .update(users)
    .set({ hiddenAt: hidden ? new Date() : null })
    .where(
      and(
        eq(users.id, profileUserId),
        isNotNull(users.sourcePlatform),
        hidden ? isNull(users.hiddenAt) : isNotNull(users.hiddenAt),
      ),
    );
  clearLeaderboardCache();
}

export async function setOwnProfileHidden(
  claimant: AuthUser,
  username: string,
  hidden: boolean,
): Promise<{ username: string; hidden: boolean }> {
  const profile = await profileByName(username);
  if ((await currentClaimant(profile.id)) !== claimant.id)
    throw new ApiError(403, "ERRORS.NOT_PROFILE_OWNER");
  await setHidden(profile.id, hidden);
  return { username: profile.username, hidden };
}

export async function adminSetHidden(
  profileUserId: number,
  hidden: boolean,
): Promise<{ id: number; hidden: boolean }> {
  await importedProfile(eq(users.id, profileUserId));
  await setHidden(profileUserId, hidden);
  return { id: profileUserId, hidden };
}

export async function adminApproveClaim(
  profileUserId: number,
  claimantName: string,
  approver: AuthUser,
): Promise<{ id: number; claimant: string }> {
  const profile = await importedProfile(eq(users.id, profileUserId));
  await assertUnclaimed(profile.id);
  const [claimant] = await getDb()
    .select({ id: users.id, username: users.username })
    .from(users)
    .where(
      and(
        eq(users.username, claimantName.trim().replace(/^@/, "").toLowerCase()),
        isNull(users.sourcePlatform),
      ),
    )
    .limit(1);
  if (!claimant) throw new ApiError(404, "ERRORS.CLAIMANT_NOT_FOUND");
  await recordClaim({
    profileUserId: profile.id,
    claimantUserId: claimant.id,
    method: "admin",
    approvedByUserId: approver.id,
  });
  return { id: profile.id, claimant: claimant.username };
}

export async function adminRevokeClaim(
  profileUserId: number,
): Promise<{ id: number }> {
  const [revoked] = await getDb()
    .update(profileClaims)
    .set({ revokedAt: new Date() })
    .where(and(eq(profileClaims.profileUserId, profileUserId), activeClaim))
    .returning({ id: profileClaims.id });
  if (!revoked) throw new ApiError(404, "ERRORS.CLAIM_NOT_FOUND");
  return { id: profileUserId };
}
