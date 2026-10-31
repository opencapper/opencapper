import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { msg } from "@/lib/config/constants";
import type { IconName } from "@/lib/config/icon-map";
import type { CapperStats } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  formatCount,
  formatPercent,
  formatPlainPercent,
  formatPlainUnits,
  formatRecord,
  formatShortUnits,
  formatUnits,
} from "@/lib/utils/format/number";
import {
  historyRecord,
  liveRecord,
  scopedRecord,
  type RecordScope,
  type ScopedRecord,
} from "@/lib/utils/stats";
import { useLocale, useTranslations } from "next-intl";

const SCOPES = ["all", "live"] as const satisfies RecordScope[];

const SCOPE_LABELS = {
  all: msg("LEADERBOARD.FILTERS.SCOPE_ALL"),
  live: msg("LEADERBOARD.FILTERS.SCOPE_LIVE"),
} satisfies Record<RecordScope, string>;

function signTone(value: number) {
  if (value > 0) return "text-pick-win";
  if (value < 0) return "text-pick-loss";
  return undefined;
}

export function ProfileStats(props: {
  stats: CapperStats;
  scope: RecordScope;
  onScopeChange: (scope: RecordScope) => void;
  minPicksForRoi: number;
}) {
  const t = useTranslations("PROFILE.STATS");
  const tRoot = useTranslations();
  const locale = useLocale();
  const record = scopedRecord(props.stats, props.scope);
  const history = historyRecord(props.stats);
  const graded = record.unitsRisked > 0;
  const gradedPicks = record.graded;
  const smallSample = graded && gradedPicks < props.minPicksForRoi;
  const summary = (r: ScopedRecord) =>
    t("SCOPE_SUMMARY", {
      record: formatRecord(r, locale),
      units: formatShortUnits(r.units, locale),
    });
  const clv = props.stats.clv;
  const clvValue = clv === undefined ? "" : formatPlainPercent(clv, locale);
  const clvTooltip =
    clv === undefined
      ? undefined
      : clv > 0
        ? t("CLV_BEAT", { value: clvValue })
        : clv < 0
          ? t("CLV_MISSED", { value: clvValue })
          : t("CLV_EVEN");

  const cells: {
    icon: IconName;
    label: string;
    value: string;
    hint: string;
    tone?: string;
    tooltip?: string;
  }[] = [
    {
      icon: "hash",
      label: t("PICKS"),
      value: formatCount(record.picks, locale),
      hint: t("PICKS_HINT", { pending: props.stats.pending }),
    },
    {
      icon: "scale",
      label: t("RECORD"),
      value: t("RECORD_VALUE", {
        won: record.wins,
        lost: record.losses,
        push: record.pushes,
      }),
      hint: t("RECORD_HINT"),
    },
    {
      icon: "coins",
      label: t("UNITS"),
      value: formatUnits(record.units, locale),
      hint: t("UNITS_HINT"),
      tone: signTone(record.units),
    },
    {
      icon: "percent",
      label: t("ROI"),
      value: graded ? formatPercent(record.roi, locale) : t("NO_ROI"),
      hint: smallSample
        ? t("ROI_SMALL_SAMPLE", {
            count: gradedPicks,
            min: props.minPicksForRoi,
          })
        : t("ROI_HINT"),
      tone: smallSample
        ? "text-muted-foreground opacity-60"
        : graded
          ? signTone(record.roi)
          : undefined,
    },
    {
      icon: "target",
      label: t("RISKED"),
      value: formatPlainUnits(record.unitsRisked, locale),
      hint: t("RISKED_HINT"),
    },
    {
      icon: "trending-up",
      label: t("CLV"),
      value: clv === undefined ? t("NO_CLV") : formatPercent(clv, locale),
      hint:
        clv === undefined
          ? t("CLV_NONE")
          : props.scope === "all" && history
            ? t("CLV_HINT_LIVE", { count: props.stats.clvSample ?? 0 })
            : t("CLV_HINT", { count: props.stats.clvSample ?? 0 }),
      tone: clv === undefined ? "text-muted-foreground" : signTone(clv),
      tooltip: clvTooltip,
    },
  ];

  return (
    <section className="mt-8">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {history ? (
          <div className="flex flex-col gap-1.5">
            <span className="label-mono text-foreground/45 text-[10px]">
              {tRoot("LEADERBOARD.FILTERS.SCOPE")}
            </span>
            <Tabs
              value={props.scope}
              onValueChange={(value) => {
                const next = SCOPES.find((s) => s === value);
                if (next) props.onScopeChange(next);
              }}
            >
              <TabsList>
                {SCOPES.map((scope) => (
                  <TabsTrigger key={scope} value={scope}>
                    {tRoot(SCOPE_LABELS[scope])}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        ) : (
          <p className="label-mono text-foreground/45 text-[10px]">
            {t("SCOPE_LIVE_ONLY")}
          </p>
        )}
        {history && (
          <p className="text-foreground/60 tabular text-xs sm:text-right">
            {t("SCOPE_SPLIT", {
              live: summary(liveRecord(props.stats)),
              history: summary(history),
            })}
          </p>
        )}
      </div>
      {history && (
        <p className="text-foreground/45 mb-4 max-w-3xl text-xs leading-relaxed">
          {props.scope === "all"
            ? tRoot("LEADERBOARD.SCOPE_HINT_ALL")
            : tRoot("LEADERBOARD.SCOPE_HINT_LIVE")}
        </p>
      )}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        {cells.map((cell) => (
          <Card key={cell.label} size="sm">
            <CardHeader>
              <CardDescription className="label-mono text-foreground/45 flex items-center gap-1.5 text-[10px]">
                <Icon name={cell.icon} className="size-3.5" />
                {cell.label}
              </CardDescription>
              <CardTitle
                className={cn(
                  "tabular text-2xl font-medium tracking-tight",
                  cell.tone,
                )}
              >
                {cell.tooltip ? (
                  <Tooltip>
                    <TooltipTrigger className="cursor-help text-left">
                      {cell.value}
                    </TooltipTrigger>
                    <TooltipContent className="max-w-64">
                      {cell.tooltip}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  cell.value
                )}
              </CardTitle>
              <p className="text-foreground/45 text-xs">{cell.hint}</p>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
}
