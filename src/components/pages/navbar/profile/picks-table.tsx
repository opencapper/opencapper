"use client";

import {
  CARD_LABEL,
  TABLE_HEAD,
} from "@/components/elements/page/page-heading";
import { PickStatusBadge } from "@/components/elements/badge/pick-status-badge";
import { Matchup } from "@/components/elements/participant/matchup";
import { SourceIcon } from "@/components/elements/source/source-badge";
import {
  SportIcon,
  sportLabelKey,
} from "@/components/elements/sport/sport-icon";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VendorLabel } from "@/components/elements/vendor/vendor-logo";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
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
import { Link } from "@/i18n/navigation";
import { isMarket, MARKET_KEY } from "@/lib/config/markets";
import type { ProofMarkerStyle } from "@/lib/config/ranking";
import { cn } from "@/lib/utils";
import type { ApiPick, ApiPickSource } from "@/lib/types";
import { EXCHANGE_BOOKMAKER } from "@/lib/api/typebox/sources";
import { formatDateTime } from "@/lib/utils/format/date";
import {
  formatAmericanOdds,
  formatPercent,
  formatPlainPercent,
  formatPlainUnits,
} from "@/lib/utils/format/number";
import { useLocale, useTranslations } from "next-intl";
import { useEffect } from "react";

export function PicksTable(props: {
  picks: ApiPick[];
  marker: ProofMarkerStyle;
  highlightPickId?: string | null;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const highlightId = props.highlightPickId ?? null;

  useEffect(() => {
    if (!highlightId) return;
    document
      .getElementById(`pick-${highlightId}`)
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [highlightId, props.picks]);

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className={CARD_LABEL}>{t("PROFILE.PICKS.TITLE")}</CardTitle>
        <CardDescription>{t("PROFILE.PICKS.DESCRIPTION")}</CardDescription>
      </CardHeader>
      <CardContent>
        {props.picks.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {t("PROFILE.PICKS.EMPTY")}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={TABLE_HEAD}>
                  {t("PROFILE.PICKS.SEQUENCE")}
                </TableHead>
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
                <TableHead className={TABLE_HEAD}>
                  {t("PROFILE.PICKS.CLV")}
                </TableHead>
                <TableHead className={cn(TABLE_HEAD, "text-right")}>
                  {t("PROFILE.PICKS.UNITS")}
                </TableHead>
                <TableHead className={TABLE_HEAD}>
                  {t("PROFILE.PICKS.STATUS")}
                </TableHead>
                <TableHead className={TABLE_HEAD}>
                  {t("PROFILE.PICKS.LOCKED_AT")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {props.picks.map((pick) => {
                const lockedAt = formatDateTime(pick.createdAt, locale);
                return (
                  <TableRow
                    key={pick.id}
                    id={`pick-${pick.id}`}
                    className={cn(
                      pick.id === highlightId &&
                        "bg-primary/10 hover:bg-primary/15",
                    )}
                  >
                    <TableCell className="text-muted-foreground tabular">
                      {pick.sequence}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <span
                                role="img"
                                aria-label={t(sportLabelKey(pick.sportKey))}
                                className="text-muted-foreground inline-flex shrink-0"
                              />
                            }
                          >
                            <SportIcon sportKey={pick.sportKey} />
                          </TooltipTrigger>
                          <TooltipContent>
                            {t(sportLabelKey(pick.sportKey))}
                          </TooltipContent>
                        </Tooltip>
                        <Matchup event={pick} />
                      </div>
                      <div className="text-muted-foreground mt-1 text-xs">
                        {t("PROFILE.PICKS.STARTS_AT", {
                          time: formatDateTime(pick.commenceTime, locale),
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      {isMarket(pick.market)
                        ? t(MARKET_KEY[pick.market])
                        : pick.market}
                    </TableCell>
                    <TableCell>
                      {pick.selection}
                      {pick.source && <SourceLine source={pick.source} />}
                    </TableCell>
                    <TableCell>
                      <div className="tabular">
                        {formatAmericanOdds(pick.odds)}
                      </div>
                      <VendorLabel
                        vendorKey={pick.bookmaker}
                        className="text-muted-foreground mt-0.5 text-xs"
                      />
                    </TableCell>
                    <TableCell>
                      <ClvCell pick={pick} />
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {formatPlainUnits(pick.units, locale)}
                    </TableCell>
                    <TableCell>
                      <PickStatusBadge result={pick.result} />
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger className="text-muted-foreground tabular flex items-center gap-1.5 text-xs">
                          <Icon
                            name="lock"
                            className={cn(
                              "size-3.5",
                              props.marker === "filled"
                                ? "bg-primary text-primary-foreground rounded-sm p-0.5"
                                : "text-primary",
                            )}
                          />
                          {lockedAt}
                        </TooltipTrigger>
                        <TooltipContent className="max-w-64">
                          {pick.bookmaker === EXCHANGE_BOOKMAKER && pick.source
                            ? t("SOURCES.FILL_HINT", {
                                time: lockedAt,
                                filled: formatDateTime(
                                  pick.source.postedAt,
                                  locale,
                                ),
                              })
                            : t("PROFILE.PICKS.LOCKED_HINT", {
                                time: lockedAt,
                              })}
                        </TooltipContent>
                      </Tooltip>
                      {pick.logSeq != null && (
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Badge
                                variant="outline"
                                className="text-muted-foreground mt-1.5"
                                render={
                                  <Link
                                    href={{
                                      pathname: "/verify",
                                      query: { pick: pick.id },
                                    }}
                                  />
                                }
                              />
                            }
                          >
                            <Icon name="shield-check" />
                            {t("PROFILE.PICKS.IN_LOG")}
                          </TooltipTrigger>
                          <TooltipContent className="max-w-64">
                            {t("PROFILE.PICKS.IN_LOG_HINT", {
                              seq: pick.logSeq,
                            })}
                          </TooltipContent>
                        </Tooltip>
                      )}
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

function SourceLine(props: { source: ApiPickSource }) {
  const t = useTranslations("SOURCES");
  const locale = useLocale();
  return (
    <div className="text-muted-foreground mt-1 text-xs">
      <Tooltip>
        <TooltipTrigger
          render={
            <a
              href={props.source.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center gap-1 underline-offset-4 hover:underline"
            />
          }
        >
          <SourceIcon platform={props.source.platform} className="size-3" />
          {t("PICK_SOURCE", { platform: props.source.platform })}
        </TooltipTrigger>
        <TooltipContent className="max-w-64">
          {t("POSTED_AT", {
            time: formatDateTime(props.source.postedAt, locale),
          })}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

function ClvCell(props: { pick: ApiPick }) {
  const t = useTranslations("PROFILE.PICKS");
  const locale = useLocale();
  const clv = props.pick.clv;
  const closing = props.pick.closingOdds;

  if (clv === undefined || closing === undefined)
    return (
      <Tooltip>
        <TooltipTrigger className="text-muted-foreground cursor-help text-xs">
          {t("CLV_NONE")}
        </TooltipTrigger>
        <TooltipContent className="max-w-64">
          {t("CLV_NONE_HINT")}
        </TooltipContent>
      </Tooltip>
    );

  const odds = formatAmericanOdds(closing);
  const value = formatPlainPercent(clv, locale);
  return (
    <Tooltip>
      <TooltipTrigger
        className={cn(
          "tabular cursor-help",
          clv > 0 && "text-pick-win",
          clv < 0 && "text-pick-loss",
        )}
      >
        {formatPercent(clv, locale)}
      </TooltipTrigger>
      <TooltipContent className="max-w-64">
        {clv > 0
          ? t("CLV_BEAT", { odds, value })
          : clv < 0
            ? t("CLV_MISSED", { odds, value })
            : t("CLV_EVEN", { odds })}
      </TooltipContent>
    </Tooltip>
  );
}
