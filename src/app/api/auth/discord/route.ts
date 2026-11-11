import { api } from "@/lib/api/client";
import {
  callbackUrl,
  LOGIN_COOKIE,
  LOGIN_COOKIE_PATH,
  LOGIN_TTL_SECONDS,
  loginError,
  pickLocale,
  safeReturn,
  signInFailure,
  siteOrigin,
  type PendingLogin,
} from "@/lib/auth/discord";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const locale = pickLocale(params.get("locale"));
  const origin = siteOrigin(request);
  const res = await api
    .GET("/v1/auth/discord/authorize", {
      params: { query: { redirect_uri: callbackUrl(origin) } },
      cache: "no-store",
    })
    .catch(() => undefined);
  if (!res?.data) return signInFailure(origin, locale, loginError(res?.error?.code));

  const pending: PendingLogin = {
    state: res.data.state,
    next: safeReturn(params.get("next"), locale),
    locale,
  };
  const response = NextResponse.redirect(res.data.url);
  response.cookies.set({
    name: LOGIN_COOKIE,
    value: JSON.stringify(pending),
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: LOGIN_COOKIE_PATH,
    maxAge: LOGIN_TTL_SECONDS,
  });
  return response;
}
