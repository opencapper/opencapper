import { getDb, type Db } from "@/lib/db/server/client";
import {
  pickLog,
  pickSettlements,
  pickSources,
  picks,
  users,
} from "@/lib/db/schema/server";
import type { PickMarket, SettledPicksQuery } from "@/lib/api/typebox/picks";
import {
  EXCHANGE_BOOKMAKER,
  type SourcePlatform,
} from "@/lib/api/typebox/sources";
import type { ApiPick, ApiSettledPick } from "@/lib/types";
import { dayjs } from "@/lib/utils/format/date";
import {
  captureOdds,
  fetchEventOdds,
  formatLine,
  type CapturedOdds,
} from "@/server/odds/odds.service";
import { appendPick } from "@/server/log/log.service";
import { lookupParticipants } from "@/server/participants/participants.service";
import { toApiPick } from "@/server/picks/picks.mapper";
import { ApiError } from "@/server/errors";
import {
  upsertDiscordUser,
  upsertSourceUser,
  upsertTelegramUser,
} from "@/server/users/identity.service";
import { and, asc, eq, gt, ne, sql } from "drizzle-orm";

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
    })
    .from(picks)
    .innerJoin(users, eq(users.id, picks.userId))
    .leftJoin(pickSettlements, eq(pickSettlements.pickId, picks.id))
    .leftJoin(pickLog, eq(pickLog.pickId, picks.id))
    .leftJoin(pickSources, eq(pickSources.pickId, picks.id))
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
  );
}
