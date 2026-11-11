"use client";

import { useState } from "react";

type Point = { at: string; odds: string };
type Series = { label: string; color: string; points: Point[] };

const W = 640;
const H = 200;
const PAD = { left: 44, right: 12, top: 12, bottom: 24 };

function fmtTime(t: number): string {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" }).format(
    new Date(t),
  );
}

// Last known price of a series at a moment; prices hold until they change.
function valueAt(points: { t: number; v: number }[], t: number): number | undefined {
  let v: number | undefined;
  for (const p of points) {
    if (p.t > t) break;
    v = p.v;
  }
  return v;
}

export function PriceChart(props: { series: Series[]; now: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const series = props.series
    .map((s) => ({
      label: s.label,
      color: s.color,
      points: s.points.map((p) => ({ t: new Date(p.at).getTime(), v: Number(p.odds) })),
    }))
    .filter((s) => s.points.length > 0);

  if (series.length === 0) {
    return <div className="px-4 py-10 text-center text-sm text-muted">No price changes recorded yet.</div>;
  }

  const all = series.flatMap((s) => s.points);
  const t0 = Math.min(...all.map((p) => p.t));
  const t1 = Math.max(props.now, t0 + 60_000);
  const lo = Math.min(...all.map((p) => p.v));
  const hi = Math.max(...all.map((p) => p.v));
  const span = Math.max(hi - lo, 0.04);
  const vMin = lo - span * 0.15;
  const vMax = hi + span * 0.15;
  const x = (t: number) => PAD.left + ((t - t0) / (t1 - t0)) * (W - PAD.left - PAD.right);
  const y = (v: number) => PAD.top + (1 - (v - vMin) / (vMax - vMin)) * (H - PAD.top - PAD.bottom);
  const ticks = [vMin + (vMax - vMin) * 0.2, (vMin + vMax) / 2, vMin + (vMax - vMin) * 0.8];

  const path = (pts: { t: number; v: number }[]) => {
    let d = "";
    pts.forEach((p, i) => {
      d += i === 0 ? `M${x(p.t)},${y(p.v)}` : `H${x(p.t)}V${y(p.v)}`;
    });
    return `${d}H${x(t1)}`;
  };

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - box.left) / box.width) * W;
    if (px < PAD.left || px > W - PAD.right) return setHover(null);
    setHover(t0 + ((px - PAD.left) / (W - PAD.left - PAD.right)) * (t1 - t0));
  };

  return (
    <div className="flex flex-col gap-2 px-4 py-3">
      <div className="flex flex-wrap gap-4 text-xs text-muted">
        {series.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-label="Price history"
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        >
          {ticks.map((v) => (
            <g key={v}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} stroke="var(--line)" />
              <text x={PAD.left - 6} y={y(v) + 3} textAnchor="end" fontSize="10" fill="var(--muted)">
                {v.toFixed(2)}
              </text>
            </g>
          ))}
          <text x={PAD.left} y={H - 6} fontSize="10" fill="var(--muted)">
            {fmtTime(t0)}
          </text>
          <text x={W - PAD.right} y={H - 6} textAnchor="end" fontSize="10" fill="var(--muted)">
            now
          </text>
          {series.map((s) => (
            <path key={s.label} d={path(s.points)} fill="none" stroke={s.color} strokeWidth={2} />
          ))}
          {hover !== null && (
            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={H - PAD.bottom} stroke="var(--muted)" strokeDasharray="3 3" />
          )}
          {hover !== null &&
            series.map((s) => {
              const v = valueAt(s.points, hover);
              return v === undefined ? null : (
                <circle key={s.label} cx={x(hover)} cy={y(v)} r={4} fill={s.color} stroke="var(--panel)" strokeWidth={2} />
              );
            })}
        </svg>
        {hover !== null && (
          <div
            className="pointer-events-none absolute top-1 border border-line bg-background px-2 py-1.5 text-xs shadow"
            style={{ left: `${Math.min((x(hover) / W) * 100, 70)}%` }}
          >
            <div className="text-muted">{fmtTime(hover)}</div>
            {series.map((s) => {
              const v = valueAt(s.points, hover);
              return (
                <div key={s.label} className="tabular flex justify-between gap-4 font-mono">
                  <span className="text-muted">{s.label}</span>
                  <span>{v === undefined ? "n/a" : v.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
