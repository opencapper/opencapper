"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ProofMarkerStyle, RankingConfig } from "@/lib/config/ranking";
import type { ApiPick } from "@/lib/types";
import { useAuthUser } from "@/hooks/auth/auth-hook";
import { useUserPicksQuery, useUserStatsQuery } from "@/hooks/users/users-hook";
import { apiErrorText } from "@/lib/utils/api-error";
import { useTranslations } from "next-intl";
import { HiddenProfile } from "./hidden-profile";
import { HistoryTable } from "./history-table";
import { PicksTable } from "./picks-table";
import { ProfileHeader } from "./profile-header";
import { ProfileStats } from "./profile-stats";
import { ShareRecord } from "./share-record";
import { SourceBanner } from "./source-banner";
import { UnitsChart } from "./units-chart";

export function CapperProfile(props: {
  username: string;
  ranking: RankingConfig;
  highlightPickId: string | null;
}) {
  const t = useTranslations("PROFILE");
  const tRoot = useTranslations();
  const stats = useUserStatsQuery(props.username);
  const picks = useUserPicksQuery(props.username);
  const source = stats.data?.source ?? null;
  const known =
    stats.data !== undefined &&
    (stats.data.discordUserId !== null || source !== null);
  const viewer = useAuthUser();
  const own = viewer?.username === props.username.toLowerCase();
  const claimant =
    viewer !== null && stats.data?.claimedBy?.username === viewer.username;
  const history = stats.data?.history;

  if (stats.data?.hidden) return <HiddenProfile username={props.username} />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <ProfileHeader
        username={props.username}
        avatarUrl={stats.data?.avatarUrl}
        verified={known && source === null}
        source={source}
        marker={props.ranking.proofMarkerStyle}
        own={own}
        claimedBy={stats.data?.claimedBy ?? null}
        claimed={stats.data?.claimed ?? []}
      />

      {source && (
        <SourceBanner
          username={props.username}
          source={source}
          claimedBy={stats.data?.claimedBy ?? null}
          claimMode={stats.data?.claimMode ?? null}
        />
      )}

      {stats.isPending && (
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-6">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      )}
      {stats.isError && (
        <Notice
          text={apiErrorText(tRoot, stats.error, t("ERROR"))}
          tone="error"
        />
      )}
      {stats.data && !known && <Notice text={t("NOT_FOUND")} />}
      {stats.data && known && (
        <ProfileStats
          stats={stats.data}
          minPicksForRoi={props.ranking.profileMinPicksForRoi}
        />
      )}
      {stats.data && (own || claimant) && (
        <ShareRecord username={stats.data.username} />
      )}

      {known && (
        <>
          {picks.isPending && <Skeleton className="mt-8 h-72 rounded-xl" />}
          {picks.isError && (
            <Notice
              text={apiErrorText(tRoot, picks.error, t("ERROR"))}
              tone="error"
            />
          )}
          {picks.data && !history && (
            <LivePicks
              picks={picks.data}
              marker={props.ranking.proofMarkerStyle}
              highlightPickId={props.highlightPickId}
            />
          )}
          {picks.data && history && (
            <Tabs
              defaultValue={picks.data.length === 0 ? "history" : "live"}
              className="mt-8"
            >
              <TabsList>
                <TabsTrigger value="live">{t("TABS.LIVE")}</TabsTrigger>
                <TabsTrigger value="history">{t("TABS.HISTORY")}</TabsTrigger>
              </TabsList>
              <TabsContent value="live">
                <LivePicks
                  picks={picks.data}
                  marker={props.ranking.proofMarkerStyle}
                  highlightPickId={props.highlightPickId}
                />
              </TabsContent>
              <TabsContent value="history">
                <HistoryTable username={props.username} stats={history} />
              </TabsContent>
            </Tabs>
          )}
        </>
      )}
    </div>
  );
}

function LivePicks(props: {
  picks: ApiPick[];
  marker: ProofMarkerStyle;
  highlightPickId: string | null;
}) {
  return (
    <>
      <UnitsChart picks={props.picks} />
      <PicksTable
        picks={props.picks}
        marker={props.marker}
        highlightPickId={props.highlightPickId}
      />
    </>
  );
}

function Notice(props: { text: string; tone?: "error" }) {
  return (
    <Card className="mt-8">
      <CardContent
        className={
          props.tone === "error" ? "text-destructive" : "text-muted-foreground"
        }
      >
        {props.text}
      </CardContent>
    </Card>
  );
}
