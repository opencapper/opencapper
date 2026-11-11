"use server";

import { redirect } from "@/i18n/navigation";
import { api, type BetPatch, type NewBet, type Settings } from "@/lib/api/client";
import { authHeaders, SESSION_COOKIE } from "@/lib/auth/session";
import { getLocale } from "next-intl/server";
import { cookies } from "next/headers";

export type ActionError =
  | "signed_out"
  | "invalid"
  | "not_found"
  | "taken"
  | "credentials"
  | "password_length"
  | "unreachable";

export type ActionResult = { ok: true } | { ok: false; error: ActionError };

function failure(status: number | undefined): ActionResult {
  if (status === undefined) return { ok: false, error: "unreachable" };
  if (status === 401) return { ok: false, error: "signed_out" };
  if (status === 404) return { ok: false, error: "not_found" };
  if (status === 409) return { ok: false, error: "taken" };
  if (status >= 500) return { ok: false, error: "unreachable" };
  return { ok: false, error: "invalid" };
}

// Only same site paths, so a crafted next parameter cannot send the user elsewhere.
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/tracker";
}

async function startSession(token: string, expiresAt: string) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });
}

function credentials(form: FormData) {
  return {
    email: String(form.get("email") ?? "").trim(),
    password: String(form.get("password") ?? ""),
  };
}

export async function signIn(_prev: ActionResult | undefined, form: FormData): Promise<ActionResult> {
  const res = await api.POST("/v1/auth/login", { body: credentials(form) }).catch(() => undefined);
  if (!res?.data) {
    if (res?.response.status === 401) return { ok: false, error: "credentials" };
    return failure(res?.response.status);
  }
  await startSession(res.data.token, res.data.expires_at);
  redirect({ href: safeNext(form.get("next")), locale: await getLocale() });
  return { ok: true };
}

export async function register(_prev: ActionResult | undefined, form: FormData): Promise<ActionResult> {
  const body = credentials(form);
  if (body.password.length < 8) return { ok: false, error: "password_length" };
  const res = await api.POST("/v1/auth/register", { body }).catch(() => undefined);
  if (!res?.data) return failure(res?.response.status);
  await startSession(res.data.token, res.data.expires_at);
  redirect({ href: safeNext(form.get("next")), locale: await getLocale() });
  return { ok: true };
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
