"use client";

import {
  CARD_LABEL,
  TABLE_HEAD,
} from "@/components/elements/page/page-heading";
import { PickStatusBadge } from "@/components/elements/badge/pick-status-badge";
import { Matchup } from "@/components/elements/participant/matchup";
import { SourceIcon } from "@/components/elements/source/source-badge";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUserHistoryQuery } from "@/hooks/users/users-hook";
import { MARKET_KEY } from "@/lib/config/markets";
import type { HistoryStats } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils/format/date";
import { apiErrorText } from "@/lib/utils/api-error";
import {
  formatAmericanOdds,
  formatPercent,
  formatPlainUnits,
  formatUnits,
} from "@/lib/utils/format/number";
import { useLocale, useTranslations } from "next-intl";

export function HistoryTable(props: { username: string; stats: HistoryStats }) {
  const t = useTranslations();
  const locale = useLocale();
  const history = useUserHistoryQuery(props.username);

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className={cn(CARD_LABEL, "flex items-center gap-2")}>
          {t("PROFILE.HISTORY.TITLE")}
          <Badge variant="outline" className="text-muted-foreground">
            <Icon name="shield-check" />
            {t("PROFILE.HISTORY.LABEL")}
          </Badge>
        </CardTitle>
        <CardDescription>{t("PROFILE.HISTORY.DESCRIPTION")}</CardDescription>
        <p className="text-foreground/60 tabular mt-1 text-sm">
          {t("PROFILE.HISTORY.SUMMARY", {
            picks: props.stats.picks,
            won: props.stats.wins,
            lost: props.stats.losses,
            push: props.stats.pushes,
            units: formatUnits(props.stats.units, locale),
            roi: formatPercent(props.stats.roi, locale),
          })}
        </p>
      </CardHeader>
      <CardContent>
        {history.isPending && <Skeleton className="h-72 rounded-xl" />}
        {history.isError && (
          <p className="text-destructive text-sm">
            {apiErrorText(t, history.error, t("PROFILE.ERROR"))}
          </p>
        )}
        {history.data && history.data.length === 0 && (
          <p className="text-muted-foreground text-sm">
            {t("PROFILE.HISTORY.EMPTY")}
          </p>
        )}
        {history.data && history.data.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={TABLE_HEAD}>
                  {t("PROFILE.PICKS.EVENT")}
                </TableHead>
                <TableHead className={TABLE_HEAD}>
                  {t("PROFILE.PICKS.MARKET")}
                </TableHead>
                <TableHead className={TABLE_HEAD}>
                  {t("PROFILE.PICKS.SELECTION")}
                </TableHead>
                <TableHead className={TABLE_HEAD}>
                  {t("PROFILE.PICKS.ODDS")}
                </TableHead>
                <TableHead className={cn(TABLE_HEAD, "text-right")}>
                  {t("PROFILE.PICKS.UNITS")}
                </TableHead>
                <TableHead className={TABLE_HEAD}>
                  {t("PROFILE.PICKS.STATUS")}
                </TableHead>
                <TableHead className={TABLE_HEAD}>
                  {t("PROFILE.HISTORY.TRANSACTION")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.data.map((pick) => {
                const traded = formatDateTime(pick.tradedAt, locale);
                const start = formatDateTime(pick.commenceTime, locale);
                return (
                  <TableRow key={pick.id}>
                    <TableCell>
                      <Matchup event={pick} />
                      <div className="text-muted-foreground mt-1 text-xs">
                        {t("PROFILE.PICKS.STARTS_AT", { time: start })}
                      </div>
                    </TableCell>
                    <TableCell>{t(MARKET_KEY[pick.market])}</TableCell>
                    <TableCell>{pick.selection}</TableCell>
                    <TableCell className="tabular">
                      {formatAmericanOdds(pick.odds)}
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {formatPlainUnits(pick.units, locale)}
                    </TableCell>
                    <TableCell>
                      <PickStatusBadge result={pick.result} />
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <a
                              href={pick.url}
                              target="_blank"
                              rel="noopener noreferrer nofollow"
                              className="text-muted-foreground inline-flex items-center gap-1.5 text-xs underline-offset-4 hover:underline"
                            />
                          }
                        >
                          <SourceIcon
                            platform={pick.platform}
                            className="size-3"
                          />
                          {t("PROFILE.HISTORY.VIEW_TX")}
                          <Icon name="arrow-up-right" className="size-3" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-64">
                          {t("PROFILE.HISTORY.TRADED_HINT", {
                            time: traded,
                            start,
                          })}
                        </TooltipContent>
                      </Tooltip>
                      <div className="text-muted-foreground tabular mt-1 text-xs">
                        {t("PROFILE.HISTORY.TRADED_AT", { time: traded })}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
