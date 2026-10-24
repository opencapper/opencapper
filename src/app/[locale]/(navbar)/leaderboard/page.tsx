import { Leaderboard } from "@/components/pages/navbar/leaderboard/leaderboard";
import {
  leaderboardQuery,
  loadLeaderboardFilters,
} from "@/components/pages/navbar/leaderboard/leaderboard-params";
import { APP_VALUES } from "@/lib/config/constants";
import getQueryClient from "@/lib/react-query/client";
import { queryKeys } from "@/lib/react-query/keys";
import { prefetchElysia, serverRpc } from "@/lib/react-query/prefetch";
import { buildMetadata, leaderboardFilters, ogImage } from "@/lib/seo/metadata";
import { serverLocale } from "@/lib/utils/server";
import { serverEnv } from "@/server/env";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
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
  const filters = await loadLeaderboardFilters(props.searchParams);
  const sports = filters.sport;
  const period = filters.period;
  const filtered = sports.length > 0 || period !== "all";
  return buildMetadata({
    locale,
    href: "/leaderboard",
    title: filtered
      ? t("OG.LEADERBOARD_TITLE", {
          ...APP_VALUES,
          filters: await leaderboardFilters(locale, sports, period),
        })
      : t("LEADERBOARD.TITLE"),
    description: t("LEADERBOARD.DESCRIPTION"),
    image: ogImage("leaderboard", locale, {
      sport: sports.length > 0 ? sports.join(",") : undefined,
      period: period === "all" ? undefined : period,
    }),
  });
}

export default async function LeaderboardPage(props: Props) {
  setRequestLocale(await serverLocale(props));
  const queryClient = getQueryClient();
  const query = leaderboardQuery(
    await loadLeaderboardFilters(props.searchParams),
  );
  await prefetchElysia(queryClient, queryKeys.leaderboard(query), (headers) =>
    serverRpc.api.leaderboard.get({ ...headers, query }),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense>
        <Leaderboard minGraded={serverEnv.ranking.leaderboardMinGradedPicks} />
      </Suspense>
    </HydrationBoundary>
  );
}
