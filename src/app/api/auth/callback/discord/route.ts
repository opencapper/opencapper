import { routing } from "@/i18n/routing";
import { api } from "@/lib/api/client";
import {
  callbackUrl,
  LOGIN_COOKIE,
  LOGIN_COOKIE_PATH,
  loginError,
  readPending,
  signInFailure,
  siteOrigin,
  type PendingLogin,
} from "@/lib/auth/discord";
import { sessionCookie } from "@/lib/auth/session";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const pending = readPending(request.cookies.get(LOGIN_COOKIE)?.value);
  const response = await finish(request, pending);
  response.cookies.delete({ name: LOGIN_COOKIE, path: LOGIN_COOKIE_PATH });
  return response;
}

async function finish(request: NextRequest, pending: PendingLogin | undefined): Promise<NextResponse> {
  const params = request.nextUrl.searchParams;
  const origin = siteOrigin(request);
  const locale = pending?.locale ?? routing.defaultLocale;
  const state = params.get("state");
  if (!pending || !state || state !== pending.state) return signInFailure(origin, locale, "invalid_state");
  // Discord returns error=access_denied without a code when the user cancels on the consent page.
  const code = params.get("code");
  if (!code) return signInFailure(origin, locale, "discord_denied");

  const res = await api
    .POST("/v1/auth/discord/callback", {
      body: { code, state, redirect_uri: callbackUrl(origin) },
      cache: "no-store",
    })
    .catch(() => undefined);
  if (!res?.data) return signInFailure(origin, locale, loginError(res?.error?.code));

  const response = NextResponse.redirect(new URL(pending.next, origin));
  response.cookies.set(sessionCookie(res.data.token, res.data.expires_at));
  return response;
}
