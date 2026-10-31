import { getDb } from "@/lib/db/server/client";
import { logAnchors } from "@/lib/db/schema/server";
import type { ApiLogAnchor } from "@/lib/types";
import { dayjs } from "@/lib/utils/format/date";
import { OTS_CALENDARS } from "@/server/constants";
import { ApiError } from "@/server/errors";
import { backfillLog, getHeadRow } from "@/server/log/log.service";
import {
  OP_APPEND,
  OP_SHA256,
  OTS_FORK,
  bitcoinAttestations,
  hasPending,
  otsHeader,
  parseOts,
  serializeOts,
  upgradeOts,
} from "@/server/log/ots";
import { desc, eq } from "drizzle-orm";
import { createHash, randomBytes } from "node:crypto";

const ANCHOR_EVERY_MS = 24 * 60 * 60 * 1000;
const CHECK_EVERY_MS = 60 * 60 * 1000;
const FIRST_CHECK_MS = 60 * 1000;
const CALENDAR_TIMEOUT_MS = 20_000;
const MAX_CALENDAR_REPLY = 10_000;
const MAX_UPGRADE_REPLY = 100_000;
const OTS_ACCEPT = "application/vnd.opentimestamps.v1";

async function submitDigest(
  calendar: string,
  digest: Buffer,
): Promise<Buffer | null> {
  try {
    const res = await fetch(`${calendar}/digest`, {
      method: "POST",
      body: new Uint8Array(digest),
      headers: {
        Accept: OTS_ACCEPT,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "opencapper",
      },
      signal: AbortSignal.timeout(CALENDAR_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.warn(`[log] calendar ${calendar} answered ${res.status}`);
      return null;
    }
    const body = Buffer.from(await res.arrayBuffer());
    if (body.length === 0 || body.length > MAX_CALENDAR_REPLY) return null;
    return body;
  } catch (error) {
    console.warn(`[log] calendar ${calendar} failed`, error);
    return null;
  }
}

// Each calendar gets its own nonce so every branch is a single path and no timestamp merge is needed.
async function stampRoot(root: Buffer): Promise<Buffer | null> {
  const branches = await Promise.all(
    OTS_CALENDARS.map(async (calendar) => {
      const nonce = randomBytes(16);
      const digest = createHash("sha256")
        .update(Buffer.concat([root, nonce]))
        .digest();
      const reply = await submitDigest(calendar, digest);
      if (!reply) return null;
      return Buffer.concat([
        Buffer.from([OP_APPEND, nonce.length]),
        nonce,
        Buffer.from([OP_SHA256]),
        reply,
      ]);
    }),
  );
  const ok = branches.flatMap((b) => (b ? [b] : []));
  if (ok.length === 0) return null;
  const body = ok.flatMap((branch, i) =>
    i < ok.length - 1 ? [Buffer.from([OTS_FORK]), branch] : [branch],
  );
  return Buffer.concat([otsHeader(root), ...body]);
}

// 404 means the calendar has not committed this digest to a Bitcoin block yet.
export async function fetchCalendarUpgrade(
  calendar: string,
  commitment: Buffer,
): Promise<Buffer | null> {
  try {
    const res = await fetch(
      `${calendar}/timestamp/${commitment.toString("hex")}`,
      {
        headers: { Accept: OTS_ACCEPT, "User-Agent": "opencapper" },
        signal: AbortSignal.timeout(CALENDAR_TIMEOUT_MS),
      },
    );
    if (!res.ok) return null;
    const body = Buffer.from(await res.arrayBuffer());
    if (body.length === 0 || body.length > MAX_UPGRADE_REPLY) return null;
    return body;
  } catch (error) {
    console.warn(`[log] calendar ${calendar} upgrade failed`, error);
    return null;
  }
}

// Calendars commit to Bitcoin a few hours after stamping; retried every tick until a block attests.
async function upgradeAnchors() {
  const rows = await getDb()
    .select({ id: logAnchors.id, ots: logAnchors.ots })
    .from(logAnchors)
    .where(eq(logAnchors.upgraded, false));
  for (const row of rows) {
    try {
      const proof = parseOts(row.ots);
      if (!hasPending(proof)) continue;
      const result = await upgradeOts(proof, fetchCalendarUpgrade);
      if (!result.changed) continue;
      const upgraded = bitcoinAttestations(result.proof).length > 0;
      await getDb()
        .update(logAnchors)
        .set({ ots: serializeOts(result.proof), upgraded })
        .where(eq(logAnchors.id, row.id));
      console.log(`[log] anchor ${row.id} upgraded to a Bitcoin attestation`);
    } catch (error) {
      console.error(`[log] anchor ${row.id} upgrade failed`, error);
    }
  }
}

async function anchorIfDue() {
  await backfillLog();
  const head = await getHeadRow();
  if (!head) return;
  const [last] = await getDb()
    .select()
    .from(logAnchors)
    .orderBy(desc(logAnchors.createdAt))
    .limit(1);
  if (last && last.root.equals(head.root)) return;
  // Half a tick of slack, or the hourly check lands just short and each stamp slips an hour.
  if (
    last &&
    dayjs().diff(dayjs(last.createdAt)) < ANCHOR_EVERY_MS - CHECK_EVERY_MS / 2
  )
    return;
  const ots = await stampRoot(head.root);
  if (!ots) {
    console.warn("[log] every calendar failed, retrying next run");
    return;
  }
  await getDb()
    .insert(logAnchors)
    .values({ root: head.root, size: head.seq, ots });
  console.log(`[log] anchored root at size ${head.seq}`);
}

let started = false;
let running = false;

async function tick() {
  if (running) return;
  running = true;
  try {
    await upgradeAnchors();
  } catch (error) {
    console.error("[log] anchor upgrade failed", error);
  }
  try {
    await anchorIfDue();
  } catch (error) {
    console.error("[log] anchoring failed", error);
  } finally {
    running = false;
  }
}

export function startLogAnchoring() {
  if (started) return;
  started = true;
  setTimeout(() => void tick(), FIRST_CHECK_MS).unref();
  setInterval(() => void tick(), CHECK_EVERY_MS).unref();
}

export async function listAnchors(limit = 100): Promise<ApiLogAnchor[]> {
  const rows = await getDb()
    .select({
      id: logAnchors.id,
      root: logAnchors.root,
      size: logAnchors.size,
      upgraded: logAnchors.upgraded,
      createdAt: logAnchors.createdAt,
    })
    .from(logAnchors)
    .orderBy(desc(logAnchors.createdAt))
    .limit(limit);
  return rows.map((row) => ({
    id: row.id,
    root: row.root.toString("hex"),
    size: row.size,
    upgraded: row.upgraded,
    createdAt: dayjs(row.createdAt).toISOString(),
    download: `/api/log/anchors/${row.id}.ots`,
  }));
}

export async function getAnchorOts(id: number): Promise<Response> {
  const [row] = await getDb()
    .select({ ots: logAnchors.ots, size: logAnchors.size })
    .from(logAnchors)
    .where(eq(logAnchors.id, id))
    .limit(1);
  if (!row) throw new ApiError(404, "ERRORS.ANCHOR_NOT_FOUND");
  return new Response(new Uint8Array(row.ots), {
    headers: {
      "Content-Type": "application/vnd.opentimestamps.v1",
      "Content-Disposition": `attachment; filename="opencapper-log-${row.size}.ots"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
