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
import type { IconName } from "@/lib/config/icon-map";
import type { CapperStats } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  formatPercent,
  formatPlainPercent,
  formatPlainUnits,
  formatUnits,
} from "@/lib/utils/format/number";
import { useLocale, useTranslations } from "next-intl";

function signTone(value: number) {
  if (value > 0) return "text-pick-win";
  if (value < 0) return "text-pick-loss";
  return undefined;
}

export function ProfileStats(props: {
  stats: CapperStats;
  minPicksForRoi: number;
}) {
  const t = useTranslations("PROFILE.STATS");
  const locale = useLocale();
  const graded = props.stats.unitsRisked > 0;
  const gradedPicks =
    props.stats.wins + props.stats.losses + props.stats.pushes;
  const smallSample = graded && gradedPicks < props.minPicksForRoi;
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
      value: String(props.stats.picks),
      hint: t("PICKS_HINT", { pending: props.stats.pending }),
    },
    {
      icon: "scale",
      label: t("RECORD"),
      value: t("RECORD_VALUE", {
        won: props.stats.wins,
        lost: props.stats.losses,
        push: props.stats.pushes,
      }),
      hint: t("RECORD_HINT"),
    },
    {
      icon: "coins",
      label: t("UNITS"),
      value: formatUnits(props.stats.units, locale),
      hint: t("UNITS_HINT"),
      tone: signTone(props.stats.units),
    },
    {
      icon: "percent",
      label: t("ROI"),
      value: graded ? formatPercent(props.stats.roi, locale) : t("NO_ROI"),
      hint: smallSample
        ? t("ROI_SMALL_SAMPLE", {
            count: gradedPicks,
            min: props.minPicksForRoi,
          })
        : t("ROI_HINT"),
      tone: smallSample
        ? "text-muted-foreground opacity-60"
        : graded
          ? signTone(props.stats.roi)
          : undefined,
    },
    {
      icon: "target",
      label: t("RISKED"),
      value: formatPlainUnits(props.stats.unitsRisked, locale),
      hint: t("RISKED_HINT"),
    },
    {
      icon: "trending-up",
      label: t("CLV"),
      value: clv === undefined ? t("NO_CLV") : formatPercent(clv, locale),
      hint:
        clv === undefined
          ? t("CLV_NONE")
          : t("CLV_HINT", { count: props.stats.clvSample ?? 0 }),
      tone: clv === undefined ? "text-muted-foreground" : signTone(clv),
      tooltip: clvTooltip,
    },
  ];

  return (
    <section className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-6">
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
    </section>
  );
}
