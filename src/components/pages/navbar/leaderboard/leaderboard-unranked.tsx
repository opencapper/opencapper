"use client";

import { SectionLabel } from "@/components/elements/page/page-heading";
import { Card } from "@/components/ui/card";
import type { UnrankedRow } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatPercent, formatUnits } from "@/lib/utils/format/number";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import {
  CapperCell,
  RecordCell,
  SampleCell,
  SportsCell,
} from "./leaderboard-columns";

export function LeaderboardUnranked(props: {
  rows: UnrankedRow[];
  minGraded: number;
}) {
  const t = useTranslations();
  const ctx = { t, locale: useLocale() };

  return (
    <section className="mt-12">
      <SectionLabel>{t("LEADERBOARD.UNRANKED.TITLE")}</SectionLabel>
      <p className="text-foreground/60 mt-3 max-w-3xl text-sm leading-relaxed">
        {t("LEADERBOARD.UNRANKED.BODY", { count: props.minGraded })}
      </p>
      <p className="label-mono text-foreground/45 mt-4 mb-3">
        {t("LEADERBOARD.UNRANKED.COUNT", { total: props.rows.length })}
      </p>
      <Card className="gap-0 py-0">
        <ol className="md:grid md:grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)_repeat(3,minmax(0,0.7fr))_auto] md:gap-x-6">
          {props.rows.map((row) => {
            const share = Math.min(1, row.graded / props.minGraded);
            return (
              <li
                key={row.username}
                className="border-foreground/8 grid gap-3 border-b px-4 py-3 last:border-b-0 md:col-span-full md:grid-cols-subgrid md:items-center"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="truncate">
                    <CapperCell
                      username={row.username}
                      source={row.source}
                      avatarUrl={row.avatarUrl}
                    />
                  </span>
                  <span className="text-muted-foreground tabular text-xs">
                    {t("LEADERBOARD.UNRANKED.PICKS", { count: row.picks })}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={props.minGraded}
                    aria-valuenow={row.graded}
                    aria-label={t("LEADERBOARD.UNRANKED.PROGRESS", {
                      graded: row.graded,
                      min: props.minGraded,
                    })}
                    className="bg-foreground/8 h-1.5 w-full overflow-hidden rounded-full"
                  >
                    <div
                      className="bg-foreground/50 h-full rounded-full"
                      style={{ width: `${share * 100}%` }}
                    />
                  </div>
                  <span className="text-muted-foreground tabular text-xs">
                    {t("LEADERBOARD.UNRANKED.PROGRESS", {
                      graded: row.graded,
                      min: props.minGraded,
                    })}
                  </span>
                </div>
                <Stat label={t("LEADERBOARD.COLUMNS.RECORD")}>
                  <RecordCell row={row} ctx={ctx} />
                </Stat>
                <Stat label={t("LEADERBOARD.COLUMNS.UNITS")}>
                  <span className="text-muted-foreground tabular">
                    {formatUnits(row.units, ctx.locale)}
                  </span>
                </Stat>
                <Stat label={t("LEADERBOARD.COLUMNS.ROI")}>
                  <span
                    className={cn(
                      "text-muted-foreground tabular opacity-60",
                      row.unitsRisked === 0 && "opacity-40",
                    )}
                    title={t("LEADERBOARD.UNRANKED.SMALL_SAMPLE", {
                      count: row.graded,
                    })}
                  >
                    {row.unitsRisked > 0
                      ? formatPercent(row.roi, ctx.locale)
                      : t("PROFILE.STATS.NO_ROI")}
                  </span>
                </Stat>
                <div className="flex items-center justify-between gap-3 md:justify-end">
                  <SportsCell row={row} ctx={ctx} />
                  {row.gradedHistory > 0 && <SampleCell row={row} ctx={ctx} />}
                </div>
              </li>
            );
          })}
        </ol>
      </Card>
    </section>
  );
}

function Stat(props: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-2 md:flex-col md:items-start md:gap-0.5">
      <span className="label-mono text-foreground/45 text-[10px]">
        {props.label}
      </span>
      {props.children}
    </div>
  );
}
