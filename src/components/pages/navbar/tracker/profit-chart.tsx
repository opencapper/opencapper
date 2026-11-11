"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { BetStats } from "@/lib/api/client";
import { currency } from "@/lib/format";
import { useLocale, useTranslations } from "next-intl";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

function shortDate(date: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : locale, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function ProfitChart(props: { daily: BetStats["daily"]; currency: string }) {
  const t = useTranslations("TRACKER");
  const locale = useLocale();
  const points = props.daily.map((d) => ({
    date: shortDate(d.date, locale),
    profit: Number(d.cumulative_profit),
  }));
  const final = points.at(-1)?.profit ?? 0;
  const config = {
    profit: {
      label: t("CHART_PROFIT"),
      color: final < 0 ? "var(--destructive)" : "var(--success)",
    },
  } satisfies ChartConfig;

  if (points.length === 0) {
    return <p className="text-muted-foreground px-4 py-10 text-center text-sm">{t("CHART_EMPTY")}</p>;
  }

  return (
    <div className="px-2 py-4 sm:px-4">
      <ChartContainer config={config} className="tabular aspect-auto h-64 w-full">
        <AreaChart data={points} margin={{ left: 0, right: 8, top: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis tickLine={false} axisLine={false} width={56} />
          <ChartTooltip
            content={
              <ChartTooltipContent valueFormatter={(v) => currency(v, locale, props.currency)} />
            }
          />
          <Area
            dataKey="profit"
            type="linear"
            stroke="var(--color-profit)"
            fill="var(--color-profit)"
            fillOpacity={0.15}
            strokeWidth={2}
            isAnimationActive={false}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
