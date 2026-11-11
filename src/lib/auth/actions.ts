"use server";

import { redirect } from "@/i18n/navigation";
import { api, type BetPatch, type NewBet, type Settings } from "@/lib/api/client";
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
