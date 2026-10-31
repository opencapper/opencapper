"use client";

import { useHydrated } from "@/hooks/ui/use-hydrated-hook";
import {
  CARD_LABEL,
  SectionLabel,
} from "@/components/elements/page/page-heading";
import { SourceIcon } from "@/components/elements/source/source-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminSystemQuery } from "@/hooks/admin/admin-hook";
import type { AdminImporterStatus, AdminSystem as System } from "@/lib/types";
import { cn } from "@/lib/utils";
import { apiErrorText } from "@/lib/utils/api-error";
import { formatDateTime } from "@/lib/utils/format/date";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

export function AdminSystem(props: { active: boolean }) {
  const t = useTranslations();
  const system = useAdminSystemQuery(props.active);

  if (system.isError)
    return (
      <Card>
        <CardContent className="text-destructive">
          {apiErrorText(t, system.error, t("ADMIN.LOAD_FAILED"))}
        </CardContent>
      </Card>
    );
  if (!system.data)
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-36" />
        ))}
      </div>
    );
  return <SystemCards system={system.data} />;
}

function SystemCards(props: { system: System }) {
  const t = useTranslations();
  const locale = useLocale();
  const local = useHydrated();
  const system = props.system;
  const credits = system.oddsCredits;
  const anchor = system.log.lastAnchor;

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <SectionLabel index={1}>{t("ADMIN.SYSTEM.CREDITS")}</SectionLabel>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label={t("ADMIN.SYSTEM.ODDS_REMAINING")}
            value={credits.remaining ?? "?"}
            note={
              !system.oddsConfigured
                ? t("ADMIN.SYSTEM.ODDS_NOT_CONFIGURED")
                : credits.updatedAt
                  ? t("ADMIN.SYSTEM.AS_OF", {
                      time: formatDateTime(credits.updatedAt, locale, local),
                    })
                  : t("ADMIN.SYSTEM.NO_CALL_YET")
            }
          />
          <StatCard
            label={t("ADMIN.SYSTEM.ODDS_USED")}
            value={credits.used ?? "?"}
            note={t("ADMIN.SYSTEM.ODDS_USED_HINT")}
          />
          <StatCard
            label={t("ADMIN.SYSTEM.BOARD_BUDGET")}
            value={`${system.board.used} / ${system.board.limit}`}
            note={t("ADMIN.SYSTEM.BOARD_BUDGET_HINT")}
          />
          <StatCard
            label={t("ADMIN.SYSTEM.USER_BUDGET")}
            value={`${system.userOdds.used} / ${system.userOdds.limit}`}
            note={t("ADMIN.SYSTEM.USER_BUDGET_HINT", {
              reserve: system.userOdds.reserve,
            })}
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionLabel index={2}>{t("ADMIN.SYSTEM.JOBS")}</SectionLabel>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {system.importers.map((importer) => (
            <ImporterCard key={importer.platform} importer={importer} />
          ))}
          <StatCard
            label={t("ADMIN.SYSTEM.GRADING")}
            value={<OnOff on={system.gradingEnabled} />}
            note={t("ADMIN.SYSTEM.IMPORT_BUDGET", {
              credits: system.importOddsCreditsPerDay,
              days: system.historyDays,
            })}
          />
          <StatCard
            label={t("ADMIN.SYSTEM.GRADING_BACKLOG")}
            value={system.grading.overdue}
            note={t("ADMIN.SYSTEM.GRADING_BACKLOG_HINT", {
              timedOut: system.grading.timedOut,
              disqualified: system.grading.disqualified,
            })}
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionLabel index={3}>{t("ADMIN.SYSTEM.LOG")}</SectionLabel>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label={t("ADMIN.SYSTEM.LOG_SIZE")}
            value={system.log.head.size}
            note={
              <span
                className="block truncate font-mono"
                title={system.log.head.root}
              >
                {system.log.head.root}
              </span>
            }
          />
          <StatCard
            label={t("ADMIN.SYSTEM.LAST_ANCHOR")}
            value={anchor ? anchor.size : "?"}
            note={
              !anchor
                ? t("ADMIN.SYSTEM.NO_ANCHOR")
                : anchor.upgraded
                  ? t("ADMIN.SYSTEM.ANCHOR_CONFIRMED", {
                      time: formatDateTime(anchor.createdAt, locale, local),
                    })
                  : t("ADMIN.SYSTEM.ANCHOR_PENDING", {
                      time: formatDateTime(anchor.createdAt, locale, local),
                    })
            }
          />
          <StatCard
            label={t("ADMIN.SYSTEM.IMAGES_PENDING")}
            value={system.imagesPending}
            note={t("ADMIN.SYSTEM.IMAGES_HINT")}
          />
        </div>
      </section>
    </div>
  );
}

function ImporterCard(props: { importer: AdminImporterStatus }) {
  const t = useTranslations();
  const locale = useLocale();
  const local = useHydrated();
  const run = props.importer.lastRun;
  return (
    <StatCard
      label={
        <span className="inline-flex items-center gap-1.5">
          <SourceIcon platform={props.importer.platform} className="size-3" />
          {t("ADMIN.SYSTEM.IMPORTER", { platform: props.importer.platform })}
        </span>
      }
      value={<OnOff on={props.importer.enabled} />}
      note={
        !run
          ? t("ADMIN.SYSTEM.NO_RUN_YET")
          : run.failed
            ? t("ADMIN.SYSTEM.RUN_FAILED", {
                time: formatDateTime(run.at, locale, local),
              })
            : t("ADMIN.SYSTEM.RUN", {
                time: formatDateTime(run.at, locale, local),
                created: run.created,
                skipped: run.skipped,
                credits: run.credits,
              })
      }
    />
  );
}

function OnOff(props: { on: boolean }) {
  const t = useTranslations();
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent text-sm",
        props.on
          ? "bg-pick-win/15 text-pick-win"
          : "bg-foreground/5 text-muted-foreground",
      )}
    >
      {t(props.on ? "ADMIN.SYSTEM.ON" : "ADMIN.SYSTEM.OFF")}
    </Badge>
  );
}

function StatCard(props: {
  label: ReactNode;
  value: ReactNode;
  note: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className={CARD_LABEL}>{props.label}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="tabular text-foreground/95 text-2xl font-medium tracking-tight">
          {props.value}
        </div>
        <div className="text-muted-foreground min-w-0 text-xs leading-relaxed">
          {props.note}
        </div>
      </CardContent>
    </Card>
  );
}
