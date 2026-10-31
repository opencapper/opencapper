import {
  CreatePickBody,
  SettledPicksQuery,
  TELEGRAM_CHAT_PREFIX,
  TelegramPickBody,
} from "@/lib/api/typebox/picks";
import { assertBotToken } from "@/server/auth/bot-token";
import { ApiError } from "@/server/errors";
import { getPublicPick } from "@/server/picks/lookup.service";
import {
  createPick,
  getSettledPicks,
  unitsError,
  type CreatePickInput,
  type PickIdentity,
} from "@/server/picks/picks.service";
import { throttlePicks } from "@/server/picks/pick-throttle";
import type { TSchema } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { Elysia, t } from "elysia";

function hasKey(body: unknown, key: string) {
  return typeof body === "object" && body !== null && key in body;
}

// Same message shape as the global VALIDATION handler, so Discord bot errors read as before.
function invalid(schema: TSchema, body: unknown): ApiError {
  const path = Value.Errors(schema, body).First()?.path;
  if (path === "/units") return unitsError();
  return new ApiError(422, "ERRORS.INVALID_REQUEST", { path: path || "body" });
}

function toPickInput(body: unknown): CreatePickInput {
  if (hasKey(body, "telegramUserId")) {
    if (hasKey(body, "discordUserId"))
      throw new ApiError(422, "ERRORS.IDENTITY_CONFLICT");
    if (!Value.Check(TelegramPickBody, body))
      throw invalid(TelegramPickBody, body);
    return {
      identity: {
        kind: "telegram",
        telegramId: body.telegramUserId,
        username: body.telegramUsername,
      },
      guildId: `${TELEGRAM_CHAT_PREFIX}${body.chatId}`,
      sportKey: body.sportKey,
      eventId: body.eventId,
      market: body.market,
      selection: body.selection,
      units: body.units,
    };
  }
  if (!Value.Check(CreatePickBody, body)) throw invalid(CreatePickBody, body);
  return {
    identity: {
      kind: "discord",
      discordId: body.discordUserId,
      username: body.discordUsername,
    },
    guildId: body.guildId,
    sportKey: body.sportKey,
    eventId: body.eventId,
    market: body.market,
    selection: body.selection,
    units: body.units,
  };
}

function pickerKey(identity: PickIdentity): string {
  if (identity.kind === "discord") return `discord:${identity.discordId}`;
  if (identity.kind === "telegram") return `telegram:${identity.telegramId}`;
  if (identity.kind === "user") return `user:${identity.userId}`;
  return `source:${identity.platform}:${identity.handle}`;
}

export const picksRoute = new Elysia({ prefix: "/picks" })
  .post(
    "/",
    async (ctx) => {
      assertBotToken(ctx.headers.authorization);
      const input = toPickInput(ctx.body);
      throttlePicks(pickerKey(input.identity));
      return createPick(input);
    },
    { body: t.Unknown() },
  )
  .get(
    "/settled",
    async (ctx) => {
      assertBotToken(ctx.headers.authorization);
      return getSettledPicks(ctx.query);
    },
    { query: SettledPicksQuery },
  )
  .get("/:id", async (ctx) => getPublicPick({ pickId: ctx.params.id }), {
    params: t.Object({ id: t.Numeric({ minimum: 1, multipleOf: 1 }) }),
  });
