"use client";

import { SectionLabel } from "@/components/elements/page/page-heading";
import { DataTable } from "@/components/elements/table/data-table";
import type { UnrankedRow } from "@/lib/types";
import { useLocale, useTranslations } from "next-intl";
import { buildUnrankedColumns } from "./leaderboard-columns";

export function LeaderboardUnranked(props: {
  rows: UnrankedRow[];
  minGraded: number;
}) {
  const t = useTranslations();
  const columns = buildUnrankedColumns(
    { t, locale: useLocale() },
    props.minGraded,
  );

  return (
    <section className="mt-12">
      <SectionLabel>{t("LEADERBOARD.UNRANKED.TITLE")}</SectionLabel>
      <p className="text-foreground/60 mt-3 max-w-3xl text-sm leading-relaxed">
        {t("LEADERBOARD.UNRANKED.BODY", { count: props.minGraded })}
      </p>
      <p className="label-mono text-foreground/45 mt-4 mb-3">
        {t("LEADERBOARD.UNRANKED.COUNT", { total: props.rows.length })}
      </p>
      <DataTable
        id="LEADERBOARD_UNRANKED"
        data={props.rows}
        columns={columns}
        localSorting
      />
    </section>
  );
}
