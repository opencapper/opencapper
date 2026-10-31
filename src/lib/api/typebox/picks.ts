import { t } from "elysia";

export const PickResult = t.Union([
  t.Literal("pending"),
  t.Literal("win"),
  t.Literal("loss"),
  t.Literal("push"),
  t.Literal("void"),
  t.Literal("half_win"),
  t.Literal("half_loss"),
  t.Literal("split"),
]);
export type PickResult = typeof PickResult.static;

export const PICK_RESULTS = PickResult.anyOf.map((l) => l.const);

export const PickMarket = t.Union([
  t.Literal("h2h"),
  t.Literal("spreads"),
  t.Literal("totals"),
]);
export type PickMarket = typeof PickMarket.static;

export const PICK_MARKETS = PickMarket.anyOf.map((l) => l.const);

// The one stake scale for every caller (web, Discord, Telegram, importers), so units compare across channels.
export const PICK_UNITS_MIN = 0.5;
export const PICK_UNITS_MAX = 5;
export const PICK_UNITS_STEP = 0.5;

export const PickUnits = t.Number({
  minimum: PICK_UNITS_MIN,
  maximum: PICK_UNITS_MAX,
  multipleOf: PICK_UNITS_STEP,
});

const DiscordId = t.String({ pattern: "^[0-9]{5,25}$" });

export const SportKey = t.String({ pattern: "^[a-z0-9_]{2,64}$" });

const EventId = t.String({ pattern: "^[A-Za-z0-9]{8,64}$" });

export const TELEGRAM_CHAT_PREFIX = "tg:";

// A Discord guild id, or a Telegram chat stored as `tg:<chatId>`.
const ChatScope = t.String({ pattern: "^([0-9]{5,25}|tg:-?[0-9]{1,20})$" });

export const CreatePickBody = t.Object({
  discordUserId: DiscordId,
  discordUsername: t.String({ minLength: 2, maxLength: 32 }),
  guildId: DiscordId,
  sportKey: SportKey,
  eventId: EventId,
  market: PickMarket,
  selection: t.String({ minLength: 1, maxLength: 128 }),
  units: PickUnits,
});
export type CreatePickBody = typeof CreatePickBody.static;

export const TelegramPickBody = t.Object({
  telegramUserId: t.String({ pattern: "^[0-9]{1,20}$" }),
  telegramUsername: t.String({ minLength: 1, maxLength: 64 }),
  chatId: t.String({ pattern: "^-?[0-9]{1,20}$" }),
  sportKey: SportKey,
  eventId: EventId,
  market: PickMarket,
  selection: t.String({ minLength: 1, maxLength: 128 }),
  units: PickUnits,
});
export type TelegramPickBody = typeof TelegramPickBody.static;

export const EventsQuery = t.Object({ sport: SportKey });

export const RecapQuery = t.Object({
  guildId: ChatScope,
  from: t.Optional(t.String({ format: "date-time" })),
  to: t.Optional(t.String({ format: "date-time" })),
});

export const SettledPicksQuery = t.Object({
  guildId: ChatScope,
  since: t.String({ format: "date-time" }),
});
export type SettledPicksQuery = typeof SettledPicksQuery.static;

export const WebPickBody = t.Object({
  sportKey: SportKey,
  eventId: EventId,
  market: PickMarket,
  selection: t.String({ minLength: 1, maxLength: 128 }),
  units: PickUnits,
});
export type WebPickBody = typeof WebPickBody.static;

export const EventOddsParams = t.Object({
  sportKey: SportKey,
  eventId: EventId,
});
