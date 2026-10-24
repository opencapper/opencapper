import { env } from "@/lib/config/env";
import { getDb } from "@/lib/db/server/client";
import {
  authAccount,
  authSession,
  authUser,
  authVerification,
  users,
  type User,
} from "@/lib/db/schema/server";
import type { AuthUser } from "@/lib/types";
import { SESSION_MAX_AGE } from "@/server/constants";
import { serverEnv } from "@/server/env";
import { ApiError } from "@/server/errors";
import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { TELEGRAM_PROVIDER_ID, telegramAuth } from "@/server/auth/telegram";
import { avatarUrl } from "@/server/users/avatar";
import {
  createAuthDomainUser,
  findUserByAuthId,
  linkAuthUser,
  upsertDiscordUser,
} from "@/server/users/identity.service";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { and, eq, or } from "drizzle-orm";

const DiscordUserSchema = Type.Object({
  id: Type.String({ pattern: "^[0-9]{5,25}$" }),
  username: Type.String({ minLength: 2, maxLength: 32 }),
  avatar: Type.Union([Type.String(), Type.Null()]),
});

// Runs on every Discord sign in with the raw profile, so the domain row tracks renames and avatars.
async function upsertDomainUser(profile: unknown) {
  if (!Value.Check(DiscordUserSchema, profile))
    throw new ApiError(502, "ERRORS.DISCORD_PROFILE_INVALID");
  const user = await upsertDiscordUser(getDb(), {
    discordId: profile.id,
    username: profile.username,
    avatar: profile.avatar,
  });
  return { name: user.username };
}

function createAuth() {
  return betterAuth({
    baseURL: env.siteOrigin,
    secret: serverEnv.betterAuthSecret,
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema: {
        user: authUser,
        session: authSession,
        account: authAccount,
        verification: authVerification,
      },
    }),
    session: { expiresIn: SESSION_MAX_AGE },
    // Cloudflare tunnel then Traefik: the client IP only survives in these headers.
    advanced: {
      ipAddress: { ipAddressHeaders: ["cf-connecting-ip", "x-forwarded-for"] },
    },
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ["discord", "google", TELEGRAM_PROVIDER_ID],
      },
    },
    socialProviders: {
      discord: {
        clientId: serverEnv.discordClientId,
        clientSecret: serverEnv.discordClientSecret,
        overrideUserInfoOnSignIn: true,
        mapProfileToUser: upsertDomainUser,
      },
      ...(serverEnv.googleEnabled
        ? {
            google: {
              clientId: serverEnv.googleClientId,
              clientSecret: serverEnv.googleClientSecret,
            },
          }
        : {}),
    },
    plugins: [telegramAuth({ botToken: () => serverEnv.telegramBotToken })],
  });
}

let auth: ReturnType<typeof createAuth> | null = null;

// Lazy so `next build` imports the auth route without a DATABASE_URL.
export function getAuth() {
  auth ??= createAuth();
  return auth;
}

function toAuthUser(user: User, image: string | null): AuthUser {
  return {
    id: user.id,
    discordId: user.discordId,
    username: user.username,
    avatarUrl: avatarUrl({ ...user, authImage: image }, 64),
  };
}

async function linkedProviderUser(authUserId: string) {
  const rows = await getDb()
    .select({ user: users, providerId: authAccount.providerId })
    .from(authAccount)
    .innerJoin(
      users,
      or(
        and(
          eq(authAccount.providerId, "discord"),
          eq(users.discordId, authAccount.accountId),
        ),
        and(
          eq(authAccount.providerId, TELEGRAM_PROVIDER_ID),
          eq(users.telegramId, authAccount.accountId),
        ),
      ),
    )
    .where(eq(authAccount.userId, authUserId));
  // Discord first: it was the only identity before, so it holds the existing profile.
  return (rows.find((row) => row.providerId === "discord") ?? rows.at(0))?.user;
}

async function resolveDomainUser(session: {
  id: string;
  name: string;
  email: string;
}): Promise<User> {
  const db = getDb();
  const byAuth = await findUserByAuthId(db, session.id);
  if (byAuth) return byAuth;
  const linked = await linkedProviderUser(session.id);
  if (linked) return linkAuthUser(db, linked, session.id);
  return createAuthDomainUser(db, {
    authUserId: session.id,
    name: session.name,
    email: session.email,
  });
}

export async function getAuthUser(headers: Headers): Promise<AuthUser | null> {
  const session = await getAuth().api.getSession({ headers });
  if (!session) return null;
  const user = await resolveDomainUser(session.user);
  return toAuthUser(user, session.user.image ?? null);
}

export async function requireAuthUser(headers: Headers): Promise<AuthUser> {
  const user = await getAuthUser(headers);
  if (!user) throw new ApiError(401, "ERRORS.LOGIN_REQUIRED");
  return user;
}
