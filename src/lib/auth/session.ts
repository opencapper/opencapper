import { api, type Settings, type User } from "@/lib/api/client";
import { cookies } from "next/headers";
import { cache } from "react";

export const SESSION_COOKIE = "openev_session";

export function sessionCookie(token: string, expiresAt: string) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
    expires: new Date(expiresAt),
  };
}

export type Account = { user: User; settings: Settings };

export async function sessionToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

export async function authHeaders(): Promise<{ Authorization: string } | undefined> {
  const token = await sessionToken();
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

// One lookup per request; the layout and the page both ask. A 401 or a dead API both read as signed out.
export const getAccount = cache(async (): Promise<Account | undefined> => {
  const headers = await authHeaders();
  if (!headers) return undefined;
  const results = await Promise.all([
    api.GET("/v1/me", { headers, cache: "no-store" }).catch(() => undefined),
    api.GET("/v1/me/settings", { headers, cache: "no-store" }).catch(() => undefined),
  ]);
  const user = results[0]?.data;
  const settings = results[1]?.data;
  if (!user || !settings) return undefined;
  return { user, settings };
});
