import { PICK_MARKETS, PICK_RESULTS } from "@/lib/api/typebox/picks";
import type { PickMarket, PickResult } from "@/lib/api/typebox/picks";
import { PARTICIPANT_KINDS } from "@/lib/api/typebox/participants";
import type { ParticipantKind } from "@/lib/api/typebox/participants";
import { SOURCE_PLATFORMS } from "@/lib/api/typebox/sources";
import type { SourcePlatform } from "@/lib/api/typebox/sources";
import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  customType,
  index,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

function sqlList(values: readonly string[]) {
  return sql.raw(values.map((v) => `'${v}'`).join(", "));
}

// Plain unique constraints on nullable columns: Postgres allows any number of nulls.
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    discordId: text("discord_id").unique(),
    telegramId: text("telegram_id").unique(),
    authUserId: text("auth_user_id")
      .unique()
      .references(() => authUser.id, { onDelete: "set null" }),
    username: text("username").notNull().unique(),
    avatar: text("avatar"),
    // Unclaimed public profile imported from another platform; no auth link until claimed.
    sourcePlatform: text("source_platform").$type<SourcePlatform>(),
    sourceHandle: text("source_handle"),
    sourceUrl: text("source_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("users_source_idx").on(
      table.sourcePlatform,
      table.sourceHandle,
    ),
    check(
      "users_source_platform_check",
      sql`${table.sourcePlatform} in (${sqlList(SOURCE_PLATFORMS)})`,
    ),
    check(
      "users_source_complete_check",
      sql`(${table.sourcePlatform} is null) = (${table.sourceHandle} is null) and (${table.sourcePlatform} is null) = (${table.sourceUrl} is null)`,
    ),
  ],
);

export const picks = pgTable(
  "picks",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    guildId: text("guild_id"),
    sequence: integer("sequence").notNull(),
    sportKey: text("sport_key").notNull(),
    eventId: text("event_id").notNull(),
    home: text("home").notNull(),
    away: text("away").notNull(),
    commenceTime: timestamp("commence_time", { withTimezone: true }).notNull(),
    market: text("market").$type<PickMarket>().notNull(),
    selection: text("selection").notNull(),
    point: numeric("point", { precision: 8, scale: 2, mode: "number" }),
    bookmaker: text("bookmaker").notNull(),
    oddsDecimal: numeric("odds_decimal", {
      precision: 10,
      scale: 3,
      mode: "number",
    }).notNull(),
    oddsCapturedAt: timestamp("odds_captured_at", {
      withTimezone: true,
    }).notNull(),
    units: numeric("units", {
      precision: 8,
      scale: 2,
      mode: "number",
    }).notNull(),
    result: text("result").$type<PickResult>().notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("picks_user_sequence_idx").on(table.userId, table.sequence),
    index("picks_guild_commence_idx").on(table.guildId, table.commenceTime),
    check(
      "picks_result_check",
      sql`${table.result} in (${sqlList(PICK_RESULTS)})`,
    ),
    check(
      "picks_market_check",
      sql`${table.market} in (${sqlList(PICK_MARKETS)})`,
    ),
    check("picks_units_check", sql`${table.units} > 0`),
    check("picks_odds_check", sql`${table.oddsDecimal} > 1`),
  ],
);

export const pickSettlements = pgTable(
  "pick_settlements",
  {
    pickId: integer("pick_id")
      .primaryKey()
      .references(() => picks.id),
    result: text("result").$type<PickResult>().notNull().default("pending"),
    homeScore: numeric("home_score", {
      precision: 8,
      scale: 2,
      mode: "number",
    }),
    awayScore: numeric("away_score", {
      precision: 8,
      scale: 2,
      mode: "number",
    }),
    gradedAt: timestamp("graded_at", { withTimezone: true }),
    closingOddsDecimal: numeric("closing_odds_decimal", {
      precision: 10,
      scale: 3,
      mode: "number",
    }),
    closingBookmaker: text("closing_bookmaker"),
    closingCapturedAt: timestamp("closing_captured_at", { withTimezone: true }),
    clv: numeric("clv", { precision: 10, scale: 6, mode: "number" }),
  },
  (table) => [
    index("pick_settlements_graded_at_idx").on(table.gradedAt),
    check(
      "pick_settlements_result_check",
      sql`${table.result} in (${sqlList(PICK_RESULTS)})`,
    ),
    check(
      "pick_settlements_closing_odds_check",
      sql`${table.closingOddsDecimal} > 1`,
    ),
  ],
);

export const pickSources = pgTable(
  "pick_sources",
  {
    pickId: integer("pick_id")
      .primaryKey()
      .references(() => picks.id),
    platform: text("platform").$type<SourcePlatform>().notNull(),
    // Dedupe key per platform: Polymarket `<wallet>:<conditionId>`, Reddit the comment id.
    externalId: text("external_id").notNull(),
    url: text("url").notNull(),
    postedAt: timestamp("posted_at", { withTimezone: true }).notNull(),
    rawText: text("raw_text"),
    // Polymarket condition id and outcome index, graded from the market resolution.
    marketRef: text("market_ref"),
    outcomeIndex: integer("outcome_index"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("pick_sources_external_idx").on(
      table.platform,
      table.externalId,
    ),
    check(
      "pick_sources_platform_check",
      sql`${table.platform} in (${sqlList(SOURCE_PLATFORMS)})`,
    ),
  ],
);

// On chain trades from before an event start, imported after resolution. Never in `picks` or `pick_log`.
export const historyPicks = pgTable(
  "history_picks",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    platform: text("platform").$type<SourcePlatform>().notNull(),
    // Same key as the live importer's `pick_sources.external_id`: one pick per trader, game and market type.
    externalId: text("external_id").notNull(),
    txHash: text("tx_hash").notNull(),
    url: text("url").notNull(),
    tradedAt: timestamp("traded_at", { withTimezone: true }).notNull(),
    commenceTime: timestamp("commence_time", { withTimezone: true }).notNull(),
    sportKey: text("sport_key").notNull(),
    eventSlug: text("event_slug").notNull(),
    home: text("home").notNull(),
    away: text("away").notNull(),
    market: text("market").$type<PickMarket>().notNull(),
    selection: text("selection").notNull(),
    point: numeric("point", { precision: 8, scale: 2, mode: "number" }),
    oddsDecimal: numeric("odds_decimal", {
      precision: 10,
      scale: 3,
      mode: "number",
    }).notNull(),
    units: numeric("units", {
      precision: 8,
      scale: 2,
      mode: "number",
    }).notNull(),
    marketRef: text("market_ref").notNull(),
    outcomeIndex: integer("outcome_index").notNull(),
    result: text("result").$type<PickResult>().notNull(),
    gradedAt: timestamp("graded_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("history_picks_external_idx").on(
      table.platform,
      table.externalId,
    ),
    uniqueIndex("history_picks_tx_idx").on(table.txHash),
    index("history_picks_user_idx").on(table.userId, table.commenceTime),
    check(
      "history_picks_platform_check",
      sql`${table.platform} in (${sqlList(SOURCE_PLATFORMS)})`,
    ),
    check(
      "history_picks_result_check",
      sql`${table.result} in ('win', 'loss', 'push', 'void')`,
    ),
    check(
      "history_picks_market_check",
      sql`${table.market} in (${sqlList(PICK_MARKETS)})`,
    ),
    check("history_picks_units_check", sql`${table.units} > 0`),
    check("history_picks_odds_check", sql`${table.oddsDecimal} > 1`),
    check(
      "history_picks_before_start_check",
      sql`${table.tradedAt} < ${table.commenceTime}`,
    ),
  ],
);

export const participants = pgTable(
  "participants",
  {
    id: serial("id").primaryKey(),
    sportGroup: text("sport_group").notNull(),
    name: text("name").notNull(),
    kind: text("kind").$type<ParticipantKind>().notNull(),
    imageUrl: text("image_url"),
    country: text("country"),
    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("participants_sport_group_name_idx").on(
      table.sportGroup,
      table.name,
    ),
    check(
      "participants_kind_check",
      sql`${table.kind} in (${sqlList(PARTICIPANT_KINDS)})`,
    ),
  ],
);

export const pickLog = pgTable(
  "pick_log",
  {
    seq: bigint("seq", { mode: "number" }).primaryKey(),
    pickId: integer("pick_id")
      .notNull()
      .unique()
      .references(() => picks.id),
    leafHash: bytea("leaf_hash").notNull(),
    prevRoot: bytea("prev_root").notNull(),
    root: bytea("root").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("pick_log_seq_check", sql`${table.seq} > 0`),
    check(
      "pick_log_hash_length_check",
      sql`octet_length(${table.leafHash}) = 32 and octet_length(${table.prevRoot}) = 32 and octet_length(${table.root}) = 32`,
    ),
  ],
);

export const logAnchors = pgTable(
  "log_anchors",
  {
    id: serial("id").primaryKey(),
    root: bytea("root").notNull(),
    size: bigint("size", { mode: "number" }).notNull(),
    ots: bytea("ots").notNull(),
    upgraded: boolean("upgraded").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("log_anchors_created_idx").on(table.createdAt)],
);

export const authUser = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const authSession = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => authUser.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const authAccount = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => authUser.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const authVerification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export type User = typeof users.$inferSelect;
export type Pick = typeof picks.$inferSelect;
export type PickSettlement = typeof pickSettlements.$inferSelect;
export type PickSource = typeof pickSources.$inferSelect;
export type HistoryPick = typeof historyPicks.$inferSelect;
export type Participant = typeof participants.$inferSelect;
export type PickLogEntry = typeof pickLog.$inferSelect;
export type LogAnchor = typeof logAnchors.$inferSelect;
