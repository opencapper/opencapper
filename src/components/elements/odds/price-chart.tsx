"use client";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { PricePoint } from "@/lib/api/client";
import { time } from "@/lib/format";
import { useLocale, useTranslations } from "next-intl";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

type Row = { t: number; book?: number; sharp?: number };

// One row per moment either price changed; each series holds its last price until it moves.
function mergeSeries(book: PricePoint[], sharp: PricePoint[], now: number): Row[] {
  const point = (key: "book" | "sharp") => (p: PricePoint) => ({
    t: new Date(p.at).getTime(),
    key,
    v: Number(p.odds),
  });
  const events = [...book.map(point("book")), ...sharp.map(point("sharp"))];
  events.sort((a, b) => a.t - b.t);
  const rows: Row[] = [];
  const last: Row = { t: 0 };
  for (const e of events) {
    last[e.key] = e.v;
    const row: Row = { t: e.t, book: last.book, sharp: last.sharp };
    const prev = rows.at(-1);
    if (prev && prev.t === e.t) rows[rows.length - 1] = row;
    else rows.push(row);
  }
  const end = rows.at(-1);
  if (end && end.t < now) rows.push({ t: now, book: end.book, sharp: end.sharp });
  return rows;
}

export function PriceChart(props: {
  bookLabel: string;
  bookColor: string;
  sharpColor: string;
  book: PricePoint[];
  sharp: PricePoint[];
  now: number;
}) {
  const t = useTranslations("BET");
  const locale = useLocale();
  const rows = mergeSeries(props.book, props.sharp, props.now);

  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground px-4 py-10 text-center text-sm">
        {t("CHART_EMPTY")}
      </p>
    );
  }

  const config = {
    book: { label: props.bookLabel, color: props.bookColor },
    sharp: { label: t("PINNACLE"), color: props.sharpColor },
  } satisfies ChartConfig;

  return (
    <div className="px-2 py-4 sm:px-4">
      <ChartContainer config={config} className="tabular aspect-auto h-56 w-full">
        <LineChart data={rows} margin={{ left: 0, right: 8, top: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            tickLine={false}
            axisLine={false}
            minTickGap={32}
            tickFormatter={(v: number) => time(new Date(v).toISOString(), locale)}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={40}
            domain={["auto", "auto"]}
            tickFormatter={(v: number) => v.toFixed(2)}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(_value, payload) => {
                  const first = payload[0];
                  const at = first ? Number(first.payload.t) : undefined;
                  return at === undefined ? "" : time(new Date(at).toISOString(), locale);
                }}
                valueFormatter={(v) => v.toFixed(2)}
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Line
            dataKey="book"
            type="stepAfter"
            stroke="var(--color-book)"
            strokeWidth={2}
            dot={false}
            connectNulls
            isAnimationActive={false}
          />
          <Line
            dataKey="sharp"
            type="stepAfter"
            stroke="var(--color-sharp)"
            strokeWidth={2}
            dot={false}
            connectNulls
            isAnimationActive={false}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}
