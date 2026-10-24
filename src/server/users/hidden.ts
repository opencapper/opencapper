import type { SourcePlatform } from "@/lib/api/typebox/sources";
import { getDb } from "@/lib/db/server/client";
import { users } from "@/lib/db/schema/server";
import { and, eq, isNotNull, isNull } from "drizzle-orm";

export const visibleUser = isNull(users.hiddenAt);

export async function isHiddenProfile(username: string): Promise<boolean> {
  const [row] = await getDb()
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.username, username.toLowerCase()),
        isNotNull(users.hiddenAt),
      ),
    )
    .limit(1);
  return row !== undefined;
}

// Lowercased source handles (wallets, Reddit names) the importers must skip.
export async function hiddenHandles(
  platform: SourcePlatform,
): Promise<Set<string>> {
  const rows = await getDb()
    .select({ handle: users.sourceHandle })
    .from(users)
    .where(and(eq(users.sourcePlatform, platform), isNotNull(users.hiddenAt)));
  return new Set(rows.flatMap((row) => (row.handle ? [row.handle] : [])));
}
