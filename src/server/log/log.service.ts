import { getDb, type Db } from "@/lib/db/server/client";
import { pickLog, picks, users } from "@/lib/db/schema/server";
import type { Pick, PickLogEntry } from "@/lib/db/schema/server";
import type {
  LogEntry,
  LogExportEntry,
  LogExportPage,
  LogHead,
} from "@/lib/types";
import { dayjs } from "@/lib/utils/format/date";
import { ApiError } from "@/server/errors";
import { and, asc, desc, eq, gte, isNull, sql } from "drizzle-orm";
import { createHash } from "node:crypto";

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

// Arbitrary constant; every writer of the chain takes this lock so roots link in commit order.
const LOG_LOCK_KEY = 7_331_001;
const BACKFILL_BATCH = 500;
export const GENESIS_ROOT = Buffer.alloc(32);

function sha256(data: Buffer | string): Buffer {
  return createHash("sha256").update(data).digest();
}

export function canonicalPick(pick: Pick): string {
  return JSON.stringify({
    id: pick.id,
    userId: pick.userId,
    sequence: pick.sequence,
    sportKey: pick.sportKey,
    eventId: pick.eventId,
    market: pick.market,
    selection: pick.selection,
    point: pick.point,
    oddsDecimal: pick.oddsDecimal,
    bookmaker: pick.bookmaker,
    units: pick.units,
    createdAt: dayjs(pick.createdAt).toISOString(),
  });
}

async function lockLog(tx: Tx) {
  await tx.execute(sql`select pg_advisory_xact_lock(${LOG_LOCK_KEY})`);
}

async function lastEntry(tx: Tx) {
  const [last] = await tx
    .select({ seq: pickLog.seq, root: pickLog.root })
    .from(pickLog)
    .orderBy(desc(pickLog.seq))
    .limit(1);
  return last ?? { seq: 0, root: GENESIS_ROOT };
}

async function insertEntry(
  tx: Tx,
  pick: Pick,
  last: { seq: number; root: Buffer },
) {
  const leafHash = sha256(canonicalPick(pick));
  const root = sha256(Buffer.concat([last.root, leafHash]));
  const entry = { seq: last.seq + 1, pickId: pick.id, leafHash, root };
  await tx.insert(pickLog).values({ ...entry, prevRoot: last.root });
  return entry;
}

export async function appendPick(tx: Tx, pick: Pick): Promise<number> {
  await lockLog(tx);
  const entry = await insertEntry(tx, pick, await lastEntry(tx));
  return entry.seq;
}

// Picks written before the log existed, or by a path that skipped it, get logged in id order.
export async function backfillLog(): Promise<number> {
  let total = 0;
  for (;;) {
    const added = await getDb().transaction(async (tx) => {
      await lockLog(tx);
      const rows = await tx
        .select({ pick: picks })
        .from(picks)
        .leftJoin(pickLog, eq(pickLog.pickId, picks.id))
        .where(isNull(pickLog.seq))
        .orderBy(asc(picks.id))
        .limit(BACKFILL_BATCH);
      let last = await lastEntry(tx);
      for (const row of rows) last = await insertEntry(tx, row.pick, last);
      return rows.length;
    });
    total += added;
    if (added < BACKFILL_BATCH) return total;
  }
}

function hex(buf: Buffer): string {
  return buf.toString("hex");
}

function toLogEntry(
  entry: PickLogEntry,
  pick: Pick,
  username: string,
): LogEntry {
  return {
    seq: entry.seq,
    pickId: String(pick.id),
    username,
    leaf: hex(entry.leafHash),
    prevRoot: hex(entry.prevRoot),
    root: hex(entry.root),
    canonical: canonicalPick(pick),
  };
}

export async function getHeadRow() {
  const [last] = await getDb()
    .select()
    .from(pickLog)
    .orderBy(desc(pickLog.seq))
    .limit(1);
  return last ?? null;
}

export async function getLogHead(): Promise<LogHead> {
  const last = await getHeadRow();
  return {
    size: last?.seq ?? 0,
    root: hex(last?.root ?? GENESIS_ROOT),
    updatedAt: last ? dayjs(last.createdAt).toISOString() : null,
  };
}

export async function getPickEntry(pickId: number): Promise<LogEntry> {
  const [row] = await getDb()
    .select({ entry: pickLog, pick: picks, username: users.username })
    .from(pickLog)
    .innerJoin(picks, eq(picks.id, pickLog.pickId))
    .innerJoin(users, eq(users.id, picks.userId))
    .where(eq(pickLog.pickId, pickId))
    .limit(1);
  if (!row) throw new ApiError(404, "ERRORS.PICK_NOT_LOGGED");
  return toLogEntry(row.entry, row.pick, row.username);
}

export async function getUserSequenceEntry(
  username: string,
  sequence: number,
): Promise<LogEntry> {
  const [row] = await getDb()
    .select({ entry: pickLog, pick: picks, username: users.username })
    .from(pickLog)
    .innerJoin(picks, eq(picks.id, pickLog.pickId))
    .innerJoin(users, eq(users.id, picks.userId))
    .where(
      and(
        eq(users.username, username.toLowerCase()),
        eq(picks.sequence, sequence),
      ),
    )
    .limit(1);
  if (!row) throw new ApiError(404, "ERRORS.PICK_NOT_LOGGED");
  return toLogEntry(row.entry, row.pick, row.username);
}

export async function listEntries(
  from: number,
  limit: number,
): Promise<LogExportPage> {
  const rows = await getDb()
    .select({ entry: pickLog, pick: picks, username: users.username })
    .from(pickLog)
    .innerJoin(picks, eq(picks.id, pickLog.pickId))
    .innerJoin(users, eq(users.id, picks.userId))
    .where(gte(pickLog.seq, from))
    .orderBy(asc(pickLog.seq))
    .limit(limit + 1);
  const page = rows.slice(0, limit);
  const entries: LogExportEntry[] = page.map((row) => ({
    ...toLogEntry(row.entry, row.pick, row.username),
    loggedAt: dayjs(row.entry.createdAt).toISOString(),
  }));
  return {
    entries,
    next: rows.length > limit ? rows[limit].entry.seq : null,
  };
}
