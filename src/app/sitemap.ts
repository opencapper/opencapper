import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { env } from "@/lib/config/env";
import { LOCALES } from "@/lib/config/constants";
import { listSitemapProfiles } from "@/server/users/sitemap.service";
import type { MetadataRoute } from "next";

// Built per request: the profile list needs the database, which the build does not have.
export const dynamic = "force-dynamic";

type Href = Parameters<typeof getPathname>[0]["href"];

const PAGES = [
  "/",
  "/leaderboard",
  "/check",
  "/verify",
  "/impressum",
  "/privacy",
  "/terms",
] as const satisfies Href[];

function entry(href: Href, lastModified?: Date): MetadataRoute.Sitemap[number] {
  const url = (locale: (typeof LOCALES)[number]) =>
    `${env.siteOrigin}${getPathname({ locale, href })}`;
  return {
    url: url(LOCALES[0]),
    lastModified,
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((locale) => [locale, url(locale)]),
      ),
    },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const profiles = await listSitemapProfiles().catch(() => []);
  return [
    ...PAGES.map((href) => entry(href)),
    ...profiles.map((profile) =>
      entry(
        { pathname: "/u/[username]", params: { username: profile.username } },
        profile.lastPickAt ?? undefined,
      ),
    ),
  ];
}
