"use client";

import { CARD_LABEL } from "@/components/elements/page/page-heading";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { ApiPick } from "@/lib/types";
import { formatShortDate } from "@/lib/utils/format/date";
import { useLocale, useTranslations } from "next-intl";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

function decimalOdds(american: number): number {
  return american > 0 ? 1 + american / 100 : 1 + 100 / -american;
}

function netUnits(pick: ApiPick): number {
  if (pick.result === "win") return pick.units * (decimalOdds(pick.odds) - 1);
  if (pick.result === "loss") return -pick.units;
  return 0;
}

export function UnitsChart(props: { picks: ApiPick[] }) {
  const t = useTranslations("PROFILE.CHART");
  const locale = useLocale();

  const graded = props.picks
    .filter((pick) => pick.result !== "pending" && pick.result !== "void")
    .toSorted((a, b) => a.sequence - b.sequence);
  const points = graded.reduce<
    { sequence: number; date: string; units: number }[]
  >((acc, pick) => {
    const previous = acc.at(-1)?.units ?? 0;
    acc.push({
      sequence: pick.sequence,
      date: formatShortDate(pick.commenceTime, locale),
      units: Math.round((previous + netUnits(pick)) * 100) / 100,
    });
    return acc;
  }, []);

  const final = points.at(-1)?.units ?? 0;
  const config = {
    units: {
      label: t("UNITS"),
      color: final < 0 ? "var(--pick-loss)" : "var(--pick-win)",
    },
  } satisfies ChartConfig;

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className={CARD_LABEL}>{t("TITLE")}</CardTitle>
        <CardDescription>{t("DESCRIPTION")}</CardDescription>
      </CardHeader>
      <CardContent>
        {points.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("EMPTY")}</p>
        ) : (
          <ChartContainer
            config={config}
            className="tabular aspect-auto h-64 w-full"
          >
            <AreaChart data={points} margin={{ left: 0, right: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                minTickGap={24}
              />
              <YAxis tickLine={false} axisLine={false} width={40} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                dataKey="units"
                type="monotone"
                stroke="var(--color-units)"
                fill="var(--color-units)"
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
