import { C, signColor } from "../lib/theme";

export function Sparkline(props: {
  values: number[];
  width: number;
  height: number;
}) {
  const series = [0, ...props.values];
  const min = Math.min(0, ...series);
  const max = Math.max(0, ...series);
  const span = max - min || 1;
  const pad = 4;
  const x = (i: number) =>
    pad + (i / Math.max(1, series.length - 1)) * (props.width - pad * 2);
  const y = (v: number) =>
    pad + (1 - (v - min) / span) * (props.height - pad * 2);
  const line = series.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const color = signColor(series[series.length - 1] ?? 0);
  return (
    <svg width={props.width} height={props.height}>
      <line
        x1={pad}
        x2={props.width - pad}
        y1={y(0)}
        y2={y(0)}
        stroke={C.hairline}
        strokeWidth={1}
      />
      <polygon
        points={`${x(0)},${y(0)} ${line} ${x(series.length - 1)},${y(0)}`}
        fill={color}
        fillOpacity={0.12}
      />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
