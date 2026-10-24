import type { Db } from "@/lib/db/server/client";
import { users, type User } from "@/lib/db/schema/server";
import type { SourcePlatform } from "@/lib/api/typebox/sources";
import { ApiError } from "@/server/errors";
import { and, eq, isNull, ne, notExists, sql } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { randomBytes } from "node:crypto";

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
type Conn = Db | Tx;

const USERNAME_MAX = 32;
const SUFFIX_LENGTH = 4;
const INSERT_ATTEMPTS = 5;

export function slugifyUsername(raw: string): string {
  return raw
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_.]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[_.]+|[_.]+$/g, "")
    .slice(0, USERNAME_MAX);
}

function withSuffix(base: string): string {
  const suffix = randomBytes(SUFFIX_LENGTH)
    .toString("hex")
    .slice(0, SUFFIX_LENGTH);
  return `${base.slice(0, USERNAME_MAX - SUFFIX_LENGTH - 1)}_${suffix}`;
}

// Any unique violation (identity or username) yields no row instead of aborting the transaction.
async function insertUnique(
  db: Conn,
  base: string,
  values: Omit<typeof users.$inferInsert, "username">,
  existing: () => Promise<User | undefined>,
): Promise<User> {
  for (let attempt = 0; attempt < INSERT_ATTEMPTS; attempt++) {
    const username = attempt === 0 ? base : withSuffix(base);
    const [row] = await db
      .insert(users)
      .values({ ...values, username })
      .onConflictDoNothing()
      .returning();
    if (row) return row;
    const found = await existing();
    if (found) return found;
  }
  throw new ApiError(409, "ERRORS.USERNAME_UNAVAILABLE");
}

function baseName(raw: string, fallback: string): string {
  const slug = slugifyUsername(raw);
  return slug.length >= 2 ? slug : fallback;
}

async function findBy(db: Conn, column: PgColumn, id: string) {
  const [row] = await db.select().from(users).where(eq(column, id)).limit(1);
  return row;
}

// Tracks Discord renames like before, but never takes a name another user already holds.
export async function upsertDiscordUser(
  db: Conn,
  input: { discordId: string; username: string; avatar?: string | null },
): Promise<User> {
  // Lowercased only, not slugified: existing Discord names are stored exactly like this.
  const desired = input.username.toLowerCase();
  const current = await findBy(db, users.discordId, input.discordId);
  if (!current)
    return insertUnique(
      db,
      desired,
      { discordId: input.discordId, avatar: input.avatar ?? null },
      () => findBy(db, users.discordId, input.discordId),
    );

  const taken = db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.username, desired), ne(users.id, current.id)));
  const [updated] = await db
    .update(users)
    .set({
      username: sql`case when ${notExists(taken)} then ${desired} else ${users.username} end`,
      ...(input.avatar === undefined ? {} : { avatar: input.avatar }),
    })
    .where(eq(users.id, current.id))
    .returning();
  return updated ?? current;
}

export async function upsertTelegramUser(
  db: Conn,
  input: { telegramId: string; username: string },
): Promise<User> {
  const current = await findBy(db, users.telegramId, input.telegramId);
  if (current) return current;
  return insertUnique(
    db,
    baseName(input.username, `tg_${input.telegramId}`),
    { telegramId: input.telegramId },
    () => findBy(db, users.telegramId, input.telegramId),
  );
}

const SOURCE_PREFIX = {
  polymarket: "pm_",
  reddit: "rd_",
} satisfies Record<SourcePlatform, string>;

// Unclaimed public profile keyed on the platform identity (wallet, Reddit name), never on the display name.
export async function upsertSourceUser(
  db: Conn,
  input: {
    platform: SourcePlatform;
    handle: string;
    displayName: string;
    url: string;
  },
): Promise<User> {
  const handle = input.handle.toLowerCase();
  const existing = async () => {
    const [row] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.sourcePlatform, input.platform),
          eq(users.sourceHandle, handle),
        ),
      )
      .limit(1);
    return row;
  };
  const current = await existing();
  if (current) return current;
  const prefix = SOURCE_PREFIX[input.platform];
  const slug = slugifyUsername(input.displayName).slice(
    0,
    USERNAME_MAX - prefix.length,
  );
  return insertUnique(
    db,
    `${prefix}${slug.length >= 2 ? slug : slugifyUsername(handle).slice(0, 12)}`,
    {
      sourcePlatform: input.platform,
      sourceHandle: handle,
      sourceUrl: input.url,
    },
    existing,
  );
}

export async function createAuthDomainUser(
  db: Conn,
  input: { authUserId: string; name: string; email: string },
): Promise<User> {
  const fallback = baseName(input.email.split("@")[0] ?? "", "capper");
  return insertUnique(
    db,
    baseName(input.name, fallback),
    { authUserId: input.authUserId },
    () => findBy(db, users.authUserId, input.authUserId),
  );
}

export async function findUserByAuthId(db: Conn, authUserId: string) {
  return findBy(db, users.authUserId, authUserId);
}

export async function linkAuthUser(
  db: Conn,
  user: User,
  authUserId: string,
): Promise<User> {
  if (user.authUserId) return user;
  const [linked] = await db
    .update(users)
    .set({ authUserId })
    .where(and(eq(users.id, user.id), isNull(users.authUserId)))
    .returning();
  return linked ?? user;
}
