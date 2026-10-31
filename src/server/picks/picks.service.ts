import { getDb, type Db } from "@/lib/db/server/client";
import {
  authUser,
  pickDisqualifications,
  pickLog,
  pickSettlements,
  pickSources,
  picks,
  users,
} from "@/lib/db/schema/server";
import {
  PICK_UNITS_MAX,
  PICK_UNITS_MIN,
  PICK_UNITS_STEP,
  PickUnits,
  type PickMarket,
  type SettledPicksQuery,
} from "@/lib/api/typebox/picks";
import {
  EXCHANGE_BOOKMAKER,
  type SourcePlatform,
} from "@/lib/api/typebox/sources";
import type { ApiPick, ApiSettledPick } from "@/lib/types";
import { dayjs } from "@/lib/utils/format/date";
import {
  captureOdds,
  fetchEventOdds,
  findUpcomingEvent,
  formatLine,
  type CapturedOdds,
} from "@/server/odds/odds.service";
import { spendUserCredits } from "@/server/odds/credits";
import { readSelection, resolveOutcome } from "@/server/odds/selection";
import { appendPick } from "@/server/log/log.service";
import { lookupParticipants } from "@/server/participants/participants.service";
import { toApiPick } from "@/server/picks/picks.mapper";
import { countedPick } from "@/server/stats/stats.service";
import { ApiError } from "@/server/errors";
import {
  upsertDiscordUser,
  upsertSourceUser,
  upsertTelegramUser,
} from "@/server/users/identity.service";
import { Value } from "@sinclair/typebox/value";
import { and, asc, eq, gt, isNotNull, ne, sql, type SQL } from "drizzle-orm";

export type PickIdentity =
  | { kind: "discord"; discordId: string; username: string }
  | { kind: "telegram"; telegramId: string; username: string }
  | { kind: "user"; userId: number }
  | {
      kind: "source";
      platform: SourcePlatform;
      handle: string;
      displayName: string;
      url: string;
    };

// The one exception to platform captured odds: an on chain exchange fill, set only by the server side importer.
export type ExchangeFill = {
  bookmaker: typeof EXCHANGE_BOOKMAKER;
  home: string;
  away: string;
  commenceTime: Date;
  outcome: string;
  point: number | null;
  oddsDecimal: number;
  filledAt: Date;
};

export type PickSourceInput = {
  platform: SourcePlatform;
  externalId: string;
  url: string;
  postedAt: Date;
  rawText: string | null;
  marketRef: string | null;
  outcomeIndex: number | null;
};

export type CreatePickInput = {
  identity: PickIdentity;
  guildId: string | null;
  sportKey: string;
  eventId: string;
  market: PickMarket;
  selection: string;
  units: number;
  exchangeFill?: ExchangeFill;
  source?: PickSourceInput;
  loadOdds?: typeof fetchEventOdds;
};

// One market times two regions.
const CAPTURE_CREDITS = 2;

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

async function resolvePicker(tx: Tx, identity: PickIdentity) {
  if (identity.kind === "discord")
    return upsertDiscordUser(tx, {
      discordId: identity.discordId,
      username: identity.username,
    });
  if (identity.kind === "telegram")
    return upsertTelegramUser(tx, {
      telegramId: identity.telegramId,
      username: identity.username,
    });
  if (identity.kind === "source")
    return upsertSourceUser(tx, {
      platform: identity.platform,
      handle: identity.handle,
      displayName: identity.displayName,
      url: identity.url,
    });
  const [row] = await tx
    .select()
    .from(users)
    .where(eq(users.id, identity.userId))
    .limit(1);
  if (!row) throw new ApiError(401, "ERRORS.LOGIN_REQUIRED");
  return row;
}

function identityMatch(identity: PickIdentity) {
  if (identity.kind === "discord")
    return eq(users.discordId, identity.discordId);
  if (identity.kind === "telegram")
    return eq(users.telegramId, identity.telegramId);
  if (identity.kind === "user") return eq(users.id, identity.userId);
  return null;
}

// Before odds capture so a banned caller spends no credits; a bot identity is covered once linked to a web login.
async function assertNotBanned(identity: PickIdentity) {
  const match = identityMatch(identity);
  if (!match) return;
  const [row] = await getDb()
    .select({ banned: authUser.banned, banExpires: authUser.banExpires })
    .from(users)
    .innerJoin(authUser, eq(authUser.id, users.authUserId))
    .where(match)
    .limit(1);
  if (!row?.banned) return;
  if (row.banExpires && !dayjs(row.banExpires).isAfter(dayjs())) return;
  throw new ApiError(403, "ERRORS.USER_BANNED");
}

// Imported profiles hidden at the owner's request get no new picks.
async function assertNotHidden(identity: PickIdentity) {
  if (identity.kind !== "source") return;
  const [row] = await getDb()
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.sourcePlatform, identity.platform),
        eq(users.sourceHandle, identity.handle.toLowerCase()),
        isNotNull(users.hiddenAt),
      ),
    )
    .limit(1);
  if (row) throw new ApiError(409, "ERRORS.PROFILE_HIDDEN");
}

function samePickExists(match: SQL, input: CreatePickInput, db: Db | Tx) {
  return db
    .select({ id: picks.id })
    .from(picks)
    .innerJoin(users, eq(users.id, picks.userId))
    .where(
      and(
        match,
        eq(picks.sportKey, input.sportKey),
        eq(picks.eventId, input.eventId),
        eq(picks.market, input.market),
      ),
    )
    .limit(1);
}

// One pick per event and market, so nobody pads a record by taking both sides or the same side twice.
async function assertNoDuplicate(input: CreatePickInput) {
  const match = identityMatch(input.identity);
  if (!match) return;
  const rows = await samePickExists(match, input, getDb());
  if (rows.length > 0) throw new ApiError(409, "ERRORS.PICK_DUPLICATE");
}

export function unitsError(): ApiError {
  return new ApiError(422, "ERRORS.UNITS_INVALID", {
    min: PICK_UNITS_MIN,
    max: PICK_UNITS_MAX,
    step: PICK_UNITS_STEP,
  });
}

// Everything checkable from free data, so a pick that would fail spends no Odds API credits.
async function precheckPick(input: CreatePickInput) {
  const parsed = readSelection(input.market, input.selection);
  const event = await findUpcomingEvent(input.sportKey, input.eventId);
  resolveOutcome({
    sportKey: input.sportKey,
    market: input.market,
    side: parsed.side,
    home: event.home,
    away: event.away,
  });
  await assertNoDuplicate(input);
}

function exchangeOdds(fill: ExchangeFill): CapturedOdds {
  const commence = dayjs(fill.commenceTime);
  if (!commence.isAfter(dayjs()))
    throw new ApiError(409, "ERRORS.EVENT_STARTED");
  if (!dayjs(fill.filledAt).isBefore(commence))
    throw new ApiError(409, "ERRORS.FILL_AFTER_START");
  if (!(fill.oddsDecimal > 1))
    throw new ApiError(422, "ERRORS.FILL_PRICE_INVALID");
  return {
    home: fill.home,
    away: fill.away,
    commenceTime: commence.toDate(),
    outcome: fill.outcome,
    bookmaker: fill.bookmaker,
    oddsDecimal: fill.oddsDecimal,
    point: fill.point,
    capturedAt: fill.filledAt,
  };
}

export async function createPick(input: CreatePickInput): Promise<ApiPick> {
  await assertNotBanned(input.identity);
  await assertNotHidden(input.identity);
  if (!Value.Check(PickUnits, input.units)) throw unitsError();
  // Importers match events and dedupe through pick_sources on their own.
  if (!input.source) await precheckPick(input);
  if (!input.source && !input.exchangeFill) spendUserCredits(CAPTURE_CREDITS);
  const odds = input.exchangeFill
    ? exchangeOdds(input.exchangeFill)
    : await captureOdds(input, input.loadOdds);
  if (input.source && !dayjs(input.source.postedAt).isBefore(odds.commenceTime))
    throw new ApiError(409, "ERRORS.SOURCE_AFTER_START");

  const created = await getDb().transaction(async (tx) => {
    const user = await resolvePicker(tx, input.identity);

    // Row lock serialises concurrent picks so sequence numbers stay gapless.
    await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, user.id))
      .for("update");

    if (
      !input.source &&
      (await samePickExists(eq(users.id, user.id), input, tx)).length > 0
    )
      throw new ApiError(409, "ERRORS.PICK_DUPLICATE");

    const [next] = await tx
      .select({
        sequence: sql`coalesce(max(${picks.sequence}), 0) + 1`.mapWith(Number),
      })
      .from(picks)
      .where(eq(picks.userId, user.id));

    const [pick] = await tx
      .insert(picks)
      .values({
        userId: user.id,
        guildId: input.guildId,
        sequence: next.sequence,
        sportKey: input.sportKey,
        eventId: input.eventId,
        home: odds.home,
        away: odds.away,
        commenceTime: odds.commenceTime,
        market: input.market,
        selection: formatLine(odds.outcome, odds.point ?? undefined),
        point: odds.point,
        bookmaker: odds.bookmaker,
        oddsDecimal: odds.oddsDecimal,
        oddsCapturedAt: odds.capturedAt,
        units: input.units,
        // Millisecond precision so the logged canonical createdAt equals the stored value.
        createdAt: new Date(),
      })
      .returning();

    if (input.source) {
      const [source] = await tx
        .insert(pickSources)
        .values({ pickId: pick.id, ...input.source })
        .onConflictDoNothing()
        .returning({ pickId: pickSources.pickId });
      if (!source) throw new ApiError(409, "ERRORS.SOURCE_ALREADY_IMPORTED");
    }

    const logSeq = await appendPick(tx, pick);
    return { pick, username: user.username, logSeq };
  });

  const images = await lookupParticipants([
    { sportKey: created.pick.sportKey, name: created.pick.home },
    { sportKey: created.pick.sportKey, name: created.pick.away },
  ]);
  return toApiPick(
    created.pick,
    created.username,
    images,
    null,
    created.logSeq,
  );
}

export async function getSettledPicks(
  input: SettledPicksQuery,
): Promise<ApiSettledPick[]> {
  const rows = await getDb()
    .select({
      pick: picks,
      username: users.username,
      settlement: pickSettlements,
    })
    .from(pickSettlements)
    .innerJoin(picks, eq(picks.id, pickSettlements.pickId))
    .innerJoin(users, eq(users.id, picks.userId))
    .where(
      and(
        eq(picks.guildId, input.guildId),
        ne(picks.result, "pending"),
        gt(pickSettlements.gradedAt, dayjs(input.since).toDate()),
        countedPick,
      ),
    )
    .orderBy(asc(pickSettlements.gradedAt), asc(picks.id))
    .limit(100);
  const images = await lookupParticipants(
    rows.flatMap((row) => [
      { sportKey: row.pick.sportKey, name: row.pick.home },
      { sportKey: row.pick.sportKey, name: row.pick.away },
    ]),
  );
  return rows.flatMap((row) =>
    row.settlement.gradedAt
      ? [
          {
            ...toApiPick(row.pick, row.username, images, row.settlement),
            settledAt: dayjs(row.settlement.gradedAt).toISOString(),
          },
        ]
      : [],
  );
}

export type PickRef =
  { pickId: number } | { username: string; sequence: number };

export async function findPick(ref: PickRef): Promise<ApiPick | null> {
  const [row] = await getDb()
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
    .where(
      "pickId" in ref
        ? eq(picks.id, ref.pickId)
        : and(
            eq(users.username, ref.username.toLowerCase()),
            eq(picks.sequence, ref.sequence),
          ),
    )
    .limit(1);
  if (!row) return null;
  const images = await lookupParticipants([
    { sportKey: row.pick.sportKey, name: row.pick.home },
    { sportKey: row.pick.sportKey, name: row.pick.away },
  ]);
  return toApiPick(
    row.pick,
    row.username,
    images,
    row.settlement,
    row.logSeq,
    row.source,
    row.disqualification,
  );
}
