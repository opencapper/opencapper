"use server";

import { redirect } from "@/i18n/navigation";
import { api, load, type AlertPrefs, type BetPatch, type NewBet, type Settings } from "@/lib/api/client";
import { authHeaders, SESSION_COOKIE } from "@/lib/auth/session";
import { getLocale } from "next-intl/server";
import { cookies } from "next/headers";

export type ActionError = "signed_out" | "invalid" | "not_found" | "unreachable";

export type ActionResult = { ok: true } | { ok: false; error: ActionError };

function failure(status: number | undefined): ActionResult {
  if (status === undefined) return { ok: false, error: "unreachable" };
  if (status === 401) return { ok: false, error: "signed_out" };
  if (status === 404) return { ok: false, error: "not_found" };
  if (status >= 500) return { ok: false, error: "unreachable" };
  return { ok: false, error: "invalid" };
}

export async function signOut(): Promise<void> {
  const headers = await authHeaders();
  if (headers) await api.POST("/v1/auth/logout", { headers }).catch(() => undefined);
  (await cookies()).delete(SESSION_COOKIE);
  redirect({ href: "/", locale: await getLocale() });
}

async function authed<T>(call: (headers: { Authorization: string }) => Promise<{ data?: T; response: Response }>): Promise<ActionResult> {
  const headers = await authHeaders();
  if (!headers) return { ok: false, error: "signed_out" };
  const res = await call(headers).catch(() => undefined);
  return res?.response.ok ? { ok: true } : failure(res?.response.status);
}

export async function saveSettings(settings: Settings): Promise<ActionResult> {
  return authed((headers) => api.PUT("/v1/me/settings", { headers, body: settings }));
}

export async function trackBet(bet: NewBet): Promise<ActionResult> {
  return authed((headers) => api.POST("/v1/bets", { headers, body: bet }));
}

export async function updateBet(id: string, patch: BetPatch): Promise<ActionResult> {
  return authed((headers) => api.PATCH("/v1/bets/{id}", { headers, params: { path: { id } }, body: patch }));
}

export async function deleteBet(id: string): Promise<ActionResult> {
  return authed((headers) => api.DELETE("/v1/bets/{id}", { headers, params: { path: { id } } }));
}

export async function saveAlerts(prefs: AlertPrefs): Promise<ActionResult> {
  return authed((headers) => api.PUT("/v1/me/alerts", { headers, body: prefs }));
}

export type TelegramLinkResult =
  | { ok: true; url: string; expiresAt: string }
  | { ok: false; error: ActionError | "telegram_unavailable" };

export async function startTelegramLink(): Promise<TelegramLinkResult> {
  const headers = await authHeaders();
  if (!headers) return { ok: false, error: "signed_out" };
  const res = await api.POST("/v1/me/telegram/link", { headers }).catch(() => undefined);
  if (res?.data) return { ok: true, url: res.data.url, expiresAt: res.data.expires_at };
  if (res?.error?.code === "telegram_unavailable") return { ok: false, error: "telegram_unavailable" };
  const failed = failure(res?.response.status);
  return failed.ok ? { ok: false, error: "unreachable" } : failed;
}

export async function unlinkTelegram(): Promise<ActionResult> {
  return authed((headers) => api.DELETE("/v1/me/telegram", { headers }));
}

export type TelegramState = { linked: boolean; username?: string | null };

export async function fetchTelegram(): Promise<TelegramState | null> {
  const headers = await authHeaders();
  if (!headers) return null;
  const me = await load(api.GET("/v1/me", { headers, cache: "no-store" }));
  return me ? { linked: me.telegram_linked, username: me.telegram_username } : null;
}
