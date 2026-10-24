import { Leaderboard } from "@/components/pages/navbar/leaderboard/leaderboard";
import { LEADERBOARD_PERIODS } from "@/lib/api/typebox/leaderboard";
import { APP_VALUES } from "@/lib/config/constants";
import { SPORT_GROUPS } from "@/lib/config/sports";
import { buildMetadata, leaderboardFilters, ogImage } from "@/lib/seo/metadata";
import { serverLocale } from "@/lib/utils/server";
import { serverEnv } from "@/server/env";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const locale = await serverLocale(props);
  const t = await getTranslations({ locale });
  const query = await props.searchParams;
  const sport = SPORT_GROUPS.find((g) => g === query.sport);
  const period = LEADERBOARD_PERIODS.find((p) => p === query.period);
  const filtered = Boolean(sport || (period && period !== "all"));
  return buildMetadata({
    locale,
    href: "/leaderboard",
    title: filtered
      ? t("OG.LEADERBOARD_TITLE", {
          ...APP_VALUES,
          filters: await leaderboardFilters(locale, sport, period),
        })
      : t("LEADERBOARD.TITLE"),
    description: t("LEADERBOARD.DESCRIPTION"),
    image: ogImage("leaderboard", locale, { sport, period }),
  });
}

export default async function LeaderboardPage(props: Props) {
  setRequestLocale(await serverLocale(props));
  return (
    <Suspense>
      <Leaderboard minGraded={serverEnv.ranking.leaderboardMinGradedPicks} />
    </Suspense>
  );
}
