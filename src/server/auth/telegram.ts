import { getDb } from "@/lib/db/server/client";
import { englishError } from "@/server/errors";
import { upsertTelegramUser } from "@/server/users/identity.service";
import { Type, type Static } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import type { BetterAuthPlugin } from "better-auth";
import {
  APIError,
  createAuthEndpoint,
  getSessionFromCtx,
} from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import { handleOAuthUserInfo } from "better-auth/oauth2";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const TELEGRAM_PROVIDER_ID = "telegram";
const MAX_AGE_SECONDS = 24 * 60 * 60;
const CLOCK_SKEW_SECONDS = 60;

const TelegramLoginSchema = Type.Object(
  {
    id: Type.Integer({ minimum: 1 }),
    first_name: Type.Optional(Type.String({ maxLength: 256 })),
    last_name: Type.Optional(Type.String({ maxLength: 256 })),
    username: Type.Optional(Type.String({ maxLength: 64 })),
    photo_url: Type.Optional(Type.String({ maxLength: 2048 })),
    auth_date: Type.Integer({ minimum: 0 }),
    hash: Type.String({ pattern: "^[0-9a-f]{64}$" }),
  },
  { additionalProperties: Type.Union([Type.String(), Type.Number()]) },
);
export type TelegramLogin = Static<typeof TelegramLoginSchema>;

export function telegramDataCheckString(payload: Record<string, unknown>) {
  return Object.keys(payload)
    .filter((key) => key !== "hash")
    .toSorted()
    .map((key) => `${key}=${String(payload[key])}`)
    .join("\n");
}

// https://core.telegram.org/widgets/login#checking-authorization
export function verifyTelegramLogin(
  payload: unknown,
  botToken: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): TelegramLogin | null {
  if (!botToken || !Value.Check(TelegramLoginSchema, payload)) return null;
  const secret = createHash("sha256").update(botToken).digest();
  const expected = createHmac("sha256", secret)
    .update(telegramDataCheckString(payload))
    .digest();
  const received = Buffer.from(payload.hash, "hex");
  if (received.length !== expected.length) return null;
  if (!timingSafeEqual(received, expected)) return null;
  const age = nowSeconds - payload.auth_date;
  if (age > MAX_AGE_SECONDS || age < -CLOCK_SKEW_SECONDS) return null;
  return payload;
}

function displayName(login: TelegramLogin) {
  const full = [login.first_name, login.last_name].filter(Boolean).join(" ");
  return login.username ?? (full || `tg_${login.id}`);
}

export function telegramAuth(options: { botToken: () => string }) {
  return {
    id: "telegram-login",
    endpoints: {
      telegramSignIn: createAuthEndpoint(
        "/telegram/sign-in",
        { method: "POST" },
        async (ctx) => {
          const body: unknown = ctx.body;
          const login = verifyTelegramLogin(body, options.botToken());
          if (!login)
            throw new APIError("UNAUTHORIZED", {
              message: englishError("ERRORS.TELEGRAM_AUTH_INVALID"),
              code: "ERRORS.TELEGRAM_AUTH_INVALID",
            });
          const telegramId = String(login.id);
          const current = await getSessionFromCtx(ctx);
          const result = await handleOAuthUserInfo(ctx, {
            userInfo: {
              id: telegramId,
              name: displayName(login),
              // Better Auth requires an email; .invalid never resolves and never matches a real one.
              email: `${telegramId}@telegram.invalid`,
              emailVerified: false,
              image: login.photo_url ?? null,
            },
            account: {
              providerId: TELEGRAM_PROVIDER_ID,
              accountId: telegramId,
            },
            // Signed in already: attach Telegram to that user, since there is no email to link by.
            selectedUser: current
              ? { userId: current.user.id, profile: "preserve" }
              : undefined,
          });
          if (!result.data)
            throw new APIError("UNAUTHORIZED", {
              message: result.error,
              code: "ERRORS.TELEGRAM_LINK_FAILED",
            });
          await upsertTelegramUser(getDb(), {
            telegramId,
            username: login.username ?? displayName(login),
          });
          await setSessionCookie(ctx, result.data);
          return ctx.json({ ok: true });
        },
      ),
    },
  } satisfies BetterAuthPlugin;
}
