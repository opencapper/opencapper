"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { LandingDashPoint } from "@/lib/types";
import { formatShortDate } from "@/lib/utils/format/date";
import { useLocale, useTranslations } from "next-intl";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

export function DashChart(props: { points: LandingDashPoint[] }) {
  const t = useTranslations();
  const locale = useLocale();
  const final = props.points.at(-1)?.units ?? 0;
  // Last value per day, so the axis never repeats a date.
  const data = props.points.reduce<{ date: string; units: number }[]>(
    (acc, point) => {
      const date = formatShortDate(point.at, locale);
      const last = acc.at(-1);
      if (last && last.date === date) last.units = point.units;
      else acc.push({ date, units: point.units });
      return acc;
    },
    [],
  );
  const config = {
    units: {
      label: t("PROFILE.CHART.UNITS"),
      color: final < 0 ? "var(--pick-loss)" : "var(--pick-win)",
    },
  } satisfies ChartConfig;

  return (
    <ChartContainer
      config={config}
      className="tabular aspect-auto min-h-36 w-full flex-1"
    >
      <AreaChart data={data} margin={{ left: 0, right: 16, top: 4 }}>
        <CartesianGrid vertical={false} strokeOpacity={0.4} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          minTickGap={32}
          fontSize={10}
        />
        <YAxis tickLine={false} axisLine={false} width={32} fontSize={10} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          dataKey="units"
          type="linear"
          stroke="var(--color-units)"
          fill="var(--color-units)"
          fillOpacity={0.12}
          strokeWidth={2}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}
