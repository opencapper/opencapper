"use client";

import { PageHeading } from "@/components/elements/page/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeaderboardQuery } from "@/hooks/leaderboard/leaderboard-hook";
import { apiErrorText } from "@/lib/utils/api-error";
import { useTranslations } from "next-intl";
import { useLeaderboardFilters } from "./leaderboard-filters";
import { LeaderboardMethod } from "./leaderboard-method";
import { LeaderboardResults } from "./leaderboard-results";
import { LeaderboardToolbar } from "./leaderboard-toolbar";
import { LeaderboardUnranked } from "./leaderboard-unranked";

export function Leaderboard(props: { minGraded: number }) {
  const t = useTranslations("LEADERBOARD");
  const tRoot = useTranslations();
  const filterState = useLeaderboardFilters();
  const filters = filterState[0];
  const setFilters = filterState[1];
  const leaderboard = useLeaderboardQuery({
    sport: filters.sport ?? undefined,
    period: filters.period,
    sort: filters.sort,
    scope: filters.scope,
    page: String(filters.page),
  });
  const data = leaderboard.data;
  const minGraded = data?.minGraded ?? props.minGraded;
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <PageHeading
        label={t("LABEL")}
        title={t("HEADING")}
        description={t("SUBHEADING")}
      >
        <p className="text-foreground/45 mt-2 font-mono text-xs">
          {t("MIN_PICKS", { count: minGraded })}{" "}
          <a
            href="#how-we-rank"
            className="text-foreground/80 underline-offset-4 hover:underline"
          >
            {t("METHOD.TITLE")}
          </a>
        </p>
      </PageHeading>

      <div>
        <LeaderboardToolbar filters={filters} onChange={setFilters} />
      </div>

      <div className="mt-6">
        {leaderboard.isPending && <Skeleton className="h-96 rounded-xl" />}
        {leaderboard.isError && (
          <Card>
            <CardContent className="text-destructive">
              {apiErrorText(tRoot, leaderboard.error, t("ERROR"))}
            </CardContent>
          </Card>
        )}
        {data && data.rows.length === 0 && data.unranked.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <Icon name="trophy" className="text-muted-foreground size-10" />
              <p className="font-medium">{t("EMPTY_TITLE")}</p>
              <p className="text-muted-foreground max-w-md text-sm">
                {t("EMPTY_BODY", { count: minGraded })}
              </p>
            </CardContent>
          </Card>
        )}
        {data && data.rows.length > 0 && (
          <>
            <p className="label-mono text-foreground/45 mb-3">
              {t("RANKED_COUNT", { total: data.total })}
            </p>
            <p className="text-foreground/45 mb-3 max-w-3xl text-xs leading-relaxed">
              {data.scope === "live"
                ? t("SCOPE_HINT_LIVE")
                : t("SCOPE_HINT_ALL")}
            </p>
            <LeaderboardResults rows={data.rows} />
            {pages > 1 && (
              <nav className="mt-4 flex items-center justify-between gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.page <= 1}
                  onClick={() => setFilters({ page: data.page - 1 })}
                >
                  {t("PAGINATION.PREVIOUS")}
                </Button>
                <span className="text-muted-foreground tabular text-xs">
                  {t("PAGINATION.PAGE", { page: data.page, pages })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.page >= pages}
                  onClick={() => setFilters({ page: data.page + 1 })}
                >
                  {t("PAGINATION.NEXT")}
                </Button>
              </nav>
            )}
          </>
        )}
        {data && data.unranked.length > 0 && (
          <LeaderboardUnranked rows={data.unranked} minGraded={minGraded} />
        )}
      </div>

      <LeaderboardMethod minGraded={minGraded} />
    </div>
  );
}
