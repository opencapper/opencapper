import type { SourcePlatform } from "@/lib/api/typebox/sources";
import { getDb } from "@/lib/db/server/client";
import { authUser, profileClaims, users } from "@/lib/db/schema/server";
import type {
  ApiClaimedProfile,
  ApiProfileClaimant,
  ClaimMode,
  MyClaim,
} from "@/lib/types";
import { dayjs } from "@/lib/utils/format/date";
import { serverEnv } from "@/server/env";
import { avatarColumns, avatarUrl } from "@/server/users/avatar";
import { visibleUser } from "@/server/users/hidden";
import { and, eq, isNull } from "drizzle-orm";

export const activeClaim = isNull(profileClaims.revokedAt);

// Reddit proof needs the OAuth API; without it a claim waits for staff.
export function claimModeFor(platform: SourcePlatform): ClaimMode {
  if (platform === "reddit" && !serverEnv.importRedditEnabled) return "manual";
  return "bio";
}

export async function findClaimant(
  profileUserId: number,
): Promise<ApiProfileClaimant | null> {
  const [row] = await getDb()
    .select({
      username: users.username,
      verifiedAt: profileClaims.verifiedAt,
      ...avatarColumns,
    })
    .from(profileClaims)
    .innerJoin(users, eq(users.id, profileClaims.claimantUserId))
    .leftJoin(authUser, eq(authUser.id, users.authUserId))
    .where(and(eq(profileClaims.profileUserId, profileUserId), activeClaim))
    .limit(1);
  return row
    ? {
        username: row.username,
        avatarUrl: avatarUrl(row, 64),
        verifiedAt: dayjs(row.verifiedAt).toISOString(),
      }
    : null;
}

// Back links from a claimant's own profile; hidden profiles stay unlinked.
export async function listClaimedProfiles(
  claimantUserId: number,
): Promise<ApiClaimedProfile[]> {
  const rows = await getDb()
    .select({ username: users.username, platform: users.sourcePlatform })
    .from(profileClaims)
    .innerJoin(users, eq(users.id, profileClaims.profileUserId))
    .where(
      and(
        eq(profileClaims.claimantUserId, claimantUserId),
        activeClaim,
        visibleUser,
      ),
    )
    .orderBy(users.username);
  return rows.flatMap((row) =>
    row.platform ? [{ username: row.username, platform: row.platform }] : [],
  );
}

export async function listOwnClaims(
  claimantUserId: number,
): Promise<MyClaim[]> {
  const rows = await getDb()
    .select({
      username: users.username,
      platform: users.sourcePlatform,
      hiddenAt: users.hiddenAt,
      verifiedAt: profileClaims.verifiedAt,
    })
    .from(profileClaims)
    .innerJoin(users, eq(users.id, profileClaims.profileUserId))
    .where(and(eq(profileClaims.claimantUserId, claimantUserId), activeClaim))
    .orderBy(users.username);
  return rows.flatMap((row) =>
    row.platform
      ? [
          {
            username: row.username,
            platform: row.platform,
            hidden: row.hiddenAt !== null,
            verifiedAt: dayjs(row.verifiedAt).toISOString(),
          },
        ]
      : [],
  );
}
