"use client";

import { CapperAvatar } from "@/components/elements/capper/capper-avatar";
import { PublicBadge } from "@/components/elements/source/source-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useHydrated } from "@/hooks/ui/use-hydrated-hook";
import { Link } from "@/i18n/navigation";
import type { CheckMatchKind } from "@/lib/api/typebox/check";
import { msg } from "@/lib/config/constants";
import type { CheckMatch, CheckRecord } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils/format/date";
import {
  formatPercent,
  formatRecord,
  formatUnits,
} from "@/lib/utils/format/number";
import { useLocale, useTranslations } from "next-intl";

const MATCHED_BY = {
  username: msg("CHECK.MATCH.USERNAME"),
  discord: msg("CHECK.MATCH.DISCORD"),
  telegram: msg("CHECK.MATCH.TELEGRAM"),
  polymarket: msg("CHECK.MATCH.POLYMARKET"),
  reddit: msg("CHECK.MATCH.REDDIT"),
} satisfies Record<CheckMatchKind, string>;

function signTone(value: number) {
  if (value > 0) return "text-pick-win";
  if (value < 0) return "text-pick-loss";
  return undefined;
}

export function CheckMatchCard(props: { match: CheckMatch }) {
  const t = useTranslations("CHECK");
  const tRoot = useTranslations();
  const locale = useLocale();
  const hydrated = useHydrated();
  const match = props.match;
  const total = match.total;
  const graded = total.graded > 0;
  const profile = {
    pathname: "/u/[username]" as const,
    params: { username: match.username },
  };

  const cells = [
    {
      label: t("STATS.RECORD"),
      value: formatRecord(total),
      hint: t("STATS.RECORD_HINT"),
    },
    {
      label: t("STATS.UNITS"),
      value: formatUnits(total.units, locale),
      tone: signTone(total.units),
    },
    {
      label: t("STATS.ROI"),
      value: graded ? formatPercent(total.roi, locale) : t("STATS.NO_ROI"),
      tone: graded ? signTone(total.roi) : "text-muted-foreground",
    },
    {
      label: t("STATS.SAMPLE"),
      value: String(total.graded),
      hint: t("STATS.PENDING", { count: match.live.pending }),
    },
  ];

  return (
    <li className="border-foreground/10 bg-card rounded-xl border p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <CapperAvatar
          username={match.username}
          imageUrl={match.avatarUrl}
          className="size-12"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={profile}
              className="truncate text-lg font-medium tracking-tight hover:underline"
            >
              @{match.username}
            </Link>
            {match.status === "member" && (
              <Badge
                variant="outline"
                className="text-primary border-primary/40"
              >
                <Icon name="shield-check" />
                {t("STATUS.MEMBER")}
              </Badge>
            )}
            {match.platform && (
              <PublicBadge
                platform={match.platform}
                claimed={match.status === "claimed"}
              />
            )}
            {match.claimedBy && (
              <Link
                href={{
                  pathname: "/u/[username]",
                  params: { username: match.claimedBy },
                }}
                className="text-muted-foreground inline-flex items-center gap-1 text-xs underline-offset-4 hover:underline"
              >
                <Icon name="user-check" className="size-3.5" />
                {tRoot("PROFILE.CLAIMED_BY", { username: match.claimedBy })}
              </Link>
            )}
          </div>
          <p className="text-foreground/50 mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <span>{tRoot(MATCHED_BY[match.matchedBy])}</span>
            <span>
              {match.lastPickAt
                ? t("STATS.LAST", {
                    date: formatDateTime(match.lastPickAt, locale, hydrated),
                  })
                : t("STATS.NO_LAST")}
            </span>
          </p>
        </div>
        <Button
          variant="outline"
          className="sm:ml-auto"
          nativeButton={false}
          render={<Link href={profile} />}
        >
          {t("RESULT.PROFILE")}
          <Icon name="arrow-up-right" />
        </Button>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cells.map((cell) => (
          <div
            key={cell.label}
            className="border-foreground/8 rounded-lg border px-3 py-2.5"
          >
            <dt className="label-mono text-foreground/45 text-[10px]">
              {cell.label}
            </dt>
            <dd
              className={cn(
                "tabular mt-1 text-xl font-medium tracking-tight",
                cell.tone,
              )}
            >
              {cell.value}
            </dd>
            {cell.hint && (
              <p className="text-foreground/40 mt-0.5 text-[11px]">
                {cell.hint}
              </p>
            )}
          </div>
        ))}
      </dl>

      <div className="border-foreground/8 mt-4 grid gap-2 border-t pt-4 text-sm">
        <SplitRow label={t("SPLIT.LIVE")} record={match.live} />
        {match.history && (
          <SplitRow label={t("SPLIT.HISTORY")} record={match.history} />
        )}
      </div>

      {!graded && (
        <p className="text-foreground/55 mt-4 flex items-start gap-2 text-sm">
          <Icon name="info" className="mt-0.5 size-4 shrink-0" />
          {t("RESULT.NO_GRADED")}
        </p>
      )}
    </li>
  );
}

function SplitRow(props: { label: string; record: CheckRecord }) {
  const t = useTranslations("CHECK");
  const locale = useLocale();
  const record = props.record;
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <span className="text-foreground/60">{props.label}</span>
      <span className="tabular text-foreground/85 flex gap-4">
        <span>{formatRecord(record)}</span>
        <span className={signTone(record.units)}>
          {t("SPLIT.UNITS", { units: formatUnits(record.units, locale) })}
        </span>
        <span className={record.graded > 0 ? signTone(record.roi) : undefined}>
          {record.graded > 0
            ? formatPercent(record.roi, locale)
            : t("STATS.NO_ROI")}
        </span>
      </span>
    </div>
  );
}
