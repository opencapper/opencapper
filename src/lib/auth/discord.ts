import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { hasLocale, type Locale } from "next-intl";
import { NextResponse, type NextRequest } from "next/server";

export const LOGIN_COOKIE = "openev_login";
export const LOGIN_COOKIE_PATH = "/api/auth";
export const LOGIN_TTL_SECONDS = 600;

// Registered on the Discord app; the API also allows it in DISCORD_REDIRECT_URIS.
const CALLBACK_PATH = "/api/auth/callback/discord";

const LOGIN_ERRORS = ["invalid_state", "invalid_redirect_uri", "discord_denied", "discord_unavailable"] as const;

export type LoginError = (typeof LOGIN_ERRORS)[number];

export type PendingLogin = { state: string; next: string; locale: Locale };

export function loginError(code: unknown): LoginError {
  return LOGIN_ERRORS.find((e) => e === code) ?? "discord_unavailable";
}

export function pickLocale(value: unknown): Locale {
  return typeof value === "string" && hasLocale(routing.locales, value) ? value : routing.defaultLocale;
}

// Behind Traefik the request origin is the container address, so production sets NEXT_PUBLIC_SITE_URL.
export function siteOrigin(request: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  return configured ? new URL(configured).origin : request.nextUrl.origin;
}

export function callbackUrl(origin: string): string {
  return `${origin}${CALLBACK_PATH}`;
}

// Only same site paths, so a crafted next parameter cannot send the user elsewhere.
export function safeReturn(value: unknown, locale: Locale): string {
  if (typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) return value;
  return getPathname({ href: "/value-bets", locale });
}

export function readPending(raw: string | undefined): PendingLogin | undefined {
  if (!raw) return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return undefined;
  }
  if (typeof parsed !== "object" || parsed === null) return undefined;
  const state = "state" in parsed ? parsed.state : undefined;
  const next = "next" in parsed ? parsed.next : undefined;
  const locale = "locale" in parsed ? parsed.locale : undefined;
  if (typeof state !== "string" || state === "") return undefined;
  const lang = pickLocale(locale);
  return { state, next: safeReturn(next, lang), locale: lang };
}

export function signInFailure(origin: string, locale: Locale, error: LoginError): NextResponse {
  const path = getPathname({ href: "/sign-in", locale });
  return NextResponse.redirect(new URL(`${path}?error=${error}`, origin));
}
