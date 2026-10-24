import { env } from "@/lib/config/env";
import {
  ac,
  roles,
  type AuthRole,
  type Permissions,
} from "@/lib/config/permissions";
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
import { ApiError, englishError } from "@/server/errors";
import type { ErrorCode } from "@/lib/utils/api-error";
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
import {
  APIError,
  createAuthMiddleware,
  getSessionFromCtx,
} from "better-auth/api";
import { admin } from "better-auth/plugins";
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

const TargetUserBody = Type.Object({ userId: Type.String() });

function forbidden(code: ErrorCode) {
  return new APIError("FORBIDDEN", { message: englishError(code), code });
}

// Highest role wins when the plugin stores a comma separated list.
export function effectiveRole(
  authUserId: string,
  stored: string | null | undefined,
): AuthRole {
  if (serverEnv.adminUserIds.includes(authUserId)) return "admin";
  const list = (stored ?? "").split(",").map((role) => role.trim());
  if (list.includes("admin")) return "admin";
  if (list.includes("moderator")) return "moderator";
  return "user";
}

async function storedRole(authUserId: string) {
  const [row] = await getDb()
    .select({ role: authUser.role })
    .from(authUser)
    .where(eq(authUser.id, authUserId))
    .limit(1);
  return row?.role;
}

// The plugin lets anyone with `ban` ban an admin and lets ADMIN_USER_IDS impersonate; both stay closed here.
const guardAdminEndpoints = createAuthMiddleware(async (ctx) => {
  if (ctx.path === "/admin/impersonate-user")
    throw forbidden("ERRORS.FORBIDDEN");
  if (ctx.path !== "/admin/ban-user") return;
  const body: unknown = ctx.body;
  if (!Value.Check(TargetUserBody, body)) return;
  const session = await getSessionFromCtx(ctx);
  if (session?.user.id === body.userId)
    throw forbidden("ERRORS.CANNOT_BAN_SELF");
  if (effectiveRole(body.userId, await storedRole(body.userId)) === "admin")
    throw forbidden("ERRORS.CANNOT_BAN_ADMIN");
});

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
    hooks: { before: guardAdminEndpoints },
    plugins: [
      telegramAuth({ botToken: () => serverEnv.telegramBotToken }),
      admin({
        ac,
        roles,
        defaultRole: "user",
        adminUserIds: serverEnv.adminUserIds,
      }),
    ],
  });
}

let auth: ReturnType<typeof createAuth> | null = null;

// Lazy so `next build` imports the auth route without a DATABASE_URL.
export function getAuth() {
  auth ??= createAuth();
  return auth;
}

function toAuthUser(
  user: User,
  image: string | null,
  role: AuthRole,
): AuthUser {
  return {
    id: user.id,
    discordId: user.discordId,
    username: user.username,
    avatarUrl: avatarUrl({ ...user, authImage: image }, 64),
    role,
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
  return toAuthUser(
    user,
    session.user.image ?? null,
    effectiveRole(session.user.id, session.user.role),
  );
}

export async function requireAuthUser(headers: Headers): Promise<AuthUser> {
  const user = await getAuthUser(headers);
  if (!user) throw new ApiError(401, "ERRORS.LOGIN_REQUIRED");
  return user;
}

// Permission check through the admin plugin, so ADMIN_USER_IDS and the role table stay the single source.
export async function requirePermission(
  headers: Headers,
  permissions: Permissions,
): Promise<AuthUser> {
  const user = await requireAuthUser(headers);
  const result = await getAuth().api.userHasPermission({
    headers,
    body: { permissions },
  });
  if (!result.success) throw new ApiError(403, "ERRORS.FORBIDDEN");
  return user;
}
