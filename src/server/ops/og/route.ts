import { OgParams, OgQuery, type OgTemplate } from "@/lib/api/typebox/og";
import { LOCALES } from "@/lib/config/constants";
import { findPick } from "@/server/picks/picks.service";
import { isHiddenProfile } from "@/server/users/hidden";
import { Elysia } from "elysia";
import type { Locale } from "next-intl";
import type { ReactNode } from "react";
import { renderPng } from "./lib/render";
import { brandCard } from "./templates/brand";
import { homeCard } from "./templates/home";
import { leaderboardCard } from "./templates/leaderboard";
import { pickCard } from "./templates/pick";
import { profileCard } from "./templates/profile";
import { verifyCard } from "./templates/verify";

const CACHE = {
  short: "public, max-age=300, s-maxage=600, stale-while-revalidate=3600",
  long: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
  fallback: "public, max-age=60, s-maxage=60",
} as const;

const TTL = {
  home: "long",
  verify: "short",
  profile: "short",
  pick: "short",
  leaderboard: "short",
} satisfies Record<OgTemplate, keyof typeof CACHE>;

function username(value: string | undefined): string | undefined {
  return value?.replace(/^@/, "");
}

async function card(
  template: OgTemplate,
  locale: Locale,
  query: OgQuery,
): Promise<ReactNode | null> {
  if (template === "home") return homeCard(locale);
  if (template === "verify") return verifyCard(locale);
  if (template === "leaderboard") return leaderboardCard(locale, query);
  const user = username(query.username);
  if (template === "profile") return user ? profileCard(locale, user) : null;
  const pick = query.pick
    ? await findPick({ pickId: Number(query.pick) })
    : user && query.seq
      ? await findPick({ username: user, sequence: Number(query.seq) })
      : null;
  if (!pick || (await isHiddenProfile(pick.username))) return null;
  return pickCard(locale, pick);
}

export const ogRoute = new Elysia({ prefix: "/og" }).get(
  "/:template",
  async (ctx) => {
    const locale = ctx.query.locale ?? LOCALES[0];
    const template = ctx.params.template;
    let node: ReactNode | null = null;
    try {
      node = await card(template, locale, ctx.query);
    } catch (error) {
      console.error(`[og] ${template} card failed, serving brand card`, error);
    }
    const png = await renderPng(node ?? (await brandCard(locale)), locale);
    return new Response(png, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": CACHE[node ? TTL[template] : "fallback"],
        "Cross-Origin-Resource-Policy": "cross-origin",
      },
    });
  },
  { params: OgParams, query: OgQuery },
);
