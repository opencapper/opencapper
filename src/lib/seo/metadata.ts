import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  buildOgUrl,
  type OgQuery,
  type OgTemplate,
} from "@/lib/api/typebox/og";
import { sportLabelKey } from "@/components/elements/sport/sport-icon";
import type { LeaderboardPeriod } from "@/lib/api/typebox/leaderboard";
import { APP_VALUES, LOCALES, msg } from "@/lib/config/constants";
import { env } from "@/lib/config/env";
import { PICK_STATUS_KEY } from "@/lib/config/markets";
import type { SportGroup } from "@/lib/config/sports";
import { vendorName } from "@/lib/config/vendor-registry";
import type { ApiPick, CapperStats } from "@/lib/types";
import { formatUtcDateTime } from "@/lib/utils/format/date";
import {
  formatAmericanOdds,
  formatPercent,
  formatPlainUnits,
  formatRecord,
  formatShortUnits,
} from "@/lib/utils/format/number";
import type { Metadata } from "next";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";

type Href = Parameters<typeof getPathname>[0]["href"];

const OG_LOCALE = {
  en: "en_US",
  de: "de_DE",
  es: "es_ES",
  "pt-BR": "pt_BR",
  fr: "fr_FR",
  it: "it_IT",
  pl: "pl_PL",
  tr: "tr_TR",
  nl: "nl_NL",
  ja: "ja_JP",
} satisfies Record<Locale, string>;

export function ogImage(
  template: OgTemplate,
  locale: Locale,
  query: Omit<OgQuery, "v" | "locale"> = {},
): string {
  return buildOgUrl(template, { ...query, locale });
}

function alternateLanguages(href: Href): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    languages[locale] = getPathname({ locale, href });
  }
  languages["x-default"] = getPathname({ locale: LOCALES[0], href });
  return languages;
}

export function buildMetadata(params: {
  locale: Locale;
  href: Href;
  title: string;
  description: string;
  image: string;
  index?: boolean;
}): Metadata {
  const canonical = getPathname({ locale: params.locale, href: params.href });
  const images = [
    { url: params.image, width: 1200, height: 630, alt: params.title },
  ];
  const index = params.index ?? true;
  return {
    title: params.title,
    description: params.description,
    alternates: {
      canonical,
      languages: alternateLanguages(params.href),
    },
    openGraph: {
      type: "website",
      siteName: env.appName,
      url: canonical,
      title: params.title,
      description: params.description,
      locale: OG_LOCALE[params.locale],
      alternateLocale: LOCALES.filter((l) => l !== params.locale).map(
        (l) => OG_LOCALE[l],
      ),
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: params.title,
      description: params.description,
      images,
    },
    robots: { index, follow: index },
  };
}

// Metadata must render without a database, as during the build.
export async function orNull<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch {
    return null;
  }
}

export async function profileText(
  locale: Locale,
  stats: CapperStats,
): Promise<{ title: string; description: string }> {
  const t = await getTranslations({ locale, namespace: "OG" });
  return {
    title: t("PROFILE_TITLE", {
      ...APP_VALUES,
      username: stats.username,
      record: formatRecord(stats),
      units: formatShortUnits(stats.units, locale),
      roi: formatPercent(stats.roi, locale),
    }),
    description: t("PROFILE_DESCRIPTION", {
      username: stats.username,
      wins: stats.wins,
      losses: stats.losses,
      pushes: stats.pushes,
      picks: stats.picks,
    }),
  };
}

export async function pickMetadata(
  locale: Locale,
  href: Href,
  pick: ApiPick,
): Promise<Metadata> {
  const t = await getTranslations({ locale });
  const odds = formatAmericanOdds(pick.odds);
  return buildMetadata({
    locale,
    href,
    title: t("OG.PICK_TITLE", {
      ...APP_VALUES,
      username: pick.username,
      seq: String(pick.sequence),
      selection: pick.selection,
      odds,
      units: formatPlainUnits(pick.units, locale),
    }),
    description: t("OG.PICK_DESCRIPTION", {
      away: pick.away,
      home: pick.home,
      time: formatUtcDateTime(pick.createdAt, locale),
      odds,
      bookmaker: vendorName(pick.bookmaker),
      status: t(PICK_STATUS_KEY[pick.result]),
    }),
    image: ogImage("pick", locale, { pick: pick.id }),
  });
}

const PERIOD_KEY = {
  "30d": msg("LEADERBOARD.FILTERS.PERIOD_30D"),
  "90d": msg("LEADERBOARD.FILTERS.PERIOD_90D"),
  "1y": msg("LEADERBOARD.FILTERS.PERIOD_1Y"),
  all: msg("LEADERBOARD.FILTERS.PERIOD_ALL"),
} satisfies Record<LeaderboardPeriod, string>;

export async function leaderboardFilters(
  locale: Locale,
  sports: SportGroup[],
  period: LeaderboardPeriod | undefined,
): Promise<string> {
  const t = await getTranslations({ locale });
  const list = new Intl.ListFormat(locale, { type: "conjunction" });
  return [
    t(PERIOD_KEY[period ?? "all"]),
    sports.length > 0
      ? list.format(sports.map((sport) => t(sportLabelKey(sport))))
      : t("LEADERBOARD.FILTERS.ALL_SPORTS"),
  ].join(", ");
}
