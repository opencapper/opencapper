"use client";

import { PageHeading } from "@/components/elements/page/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { useLeaderboardQuery } from "@/hooks/leaderboard/leaderboard-hook";
import { Link } from "@/i18n/navigation";
import { apiErrorText } from "@/lib/utils/api-error";
import { useTranslations } from "next-intl";
import { useLeaderboardFilters } from "./leaderboard-filters";
import { LeaderboardMethod } from "./leaderboard-method";
import { leaderboardQuery } from "./leaderboard-params";
import { LeaderboardResults } from "./leaderboard-results";
import { LeaderboardToolbar } from "./leaderboard-toolbar";
import { LeaderboardUnranked } from "./leaderboard-unranked";

export function Leaderboard(props: { minGraded: number }) {
  const t = useTranslations("LEADERBOARD");
  const tRoot = useTranslations();
  const filterState = useLeaderboardFilters();
  const filters = filterState[0];
  const setFilters = filterState[1];
  const leaderboard = useLeaderboardQuery(leaderboardQuery(filters));
  const data = leaderboard.data;
  const minGraded = data?.minGraded ?? props.minGraded;

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
          </a>{" "}
          <Link
            href="/check"
            className="text-foreground/80 inline-flex items-center gap-1 underline-offset-4 hover:underline"
          >
            <Icon name="user-search" className="size-3.5" />
            {t("CHECK_LINK")}
          </Link>
        </p>
      </PageHeading>

      <div>
        <LeaderboardToolbar filters={filters} onChange={setFilters} />
      </div>

      <div className="mt-6">
        {leaderboard.isPending && (
          <LeaderboardResults
            rows={[]}
            total={0}
            isLoading
            filters={filters}
            onChange={setFilters}
          />
        )}
        {leaderboard.isError && (
          <Card>
            <CardContent className="text-destructive">
              {apiErrorText(tRoot, leaderboard.error, t("ERROR"))}
            </CardContent>
          </Card>
        )}
        {data && data.rows.length === 0 && data.total > 0 && (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="font-medium">{t("PAST_END_TITLE")}</p>
              <p className="text-muted-foreground max-w-md text-sm">
                {t("PAST_END_BODY", { total: data.total })}
              </p>
              <Button
                variant="outline"
                onClick={() => setFilters({ page: null })}
              >
                {t("PAST_END_BACK")}
              </Button>
            </CardContent>
          </Card>
        )}
        {data &&
          data.rows.length === 0 &&
          data.total === 0 &&
          data.unranked.length === 0 && (
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
            <LeaderboardResults
              rows={data.rows}
              total={data.total}
              isLoading={false}
              filters={filters}
              onChange={setFilters}
            />
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
