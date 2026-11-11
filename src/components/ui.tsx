import Link from "next/link";
import type { Confidence } from "@/lib/api/client";
import { CONFIDENCE_HINT, percent } from "@/lib/format";

export function PageHeader(props: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <header className="flex flex-col gap-2">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">{props.eyebrow}</div>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{props.title}</h1>
      {props.children && <div className="max-w-3xl text-sm leading-relaxed text-muted">{props.children}</div>}
    </header>
  );
}

const TONE = { win: "text-win", bad: "text-bad", warn: "text-warn" };

export function Stat(props: { label: string; value: string; hint?: string; tone?: keyof typeof TONE }) {
  const tone = props.tone ? TONE[props.tone] : "";
  return (
    <div className="border border-line bg-panel px-4 py-3" title={props.hint}>
      <div className="text-[11px] uppercase tracking-wider text-muted">{props.label}</div>
      <div className={`tabular mt-1 font-mono text-xl ${tone}`}>{props.value}</div>
    </div>
  );
}

export function Panel(props: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`border border-line bg-panel ${props.className ?? ""}`}>
      {props.title && (
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted">{props.title}</h2>
          {props.action}
        </div>
      )}
      {props.children}
    </section>
  );
}

const CONFIDENCE_STYLE: Record<Confidence, string> = {
  high: "text-win border-win/30 bg-win/10",
  medium: "text-warn border-warn/30 bg-warn/10",
  low: "text-muted border-line bg-background",
  check: "text-bad border-bad/30 bg-bad/10",
};

export function ConfidenceBadge(props: { value: Confidence }) {
  return (
    <span
      title={CONFIDENCE_HINT[props.value]}
      className={`inline-block border px-2 py-0.5 text-[11px] capitalize ${CONFIDENCE_STYLE[props.value]}`}
    >
      {props.value}
    </span>
  );
}

export function Ev(props: { value: number | null | undefined; className?: string }) {
  if (props.value === null || props.value === undefined) return <span className="text-muted">n/a</span>;
  const tone = props.value > 0 ? "text-win" : props.value < -0.05 ? "text-bad" : "text-muted";
  return <span className={`tabular font-mono ${tone} ${props.className ?? ""}`}>{percent(props.value)}</span>;
}

export function Chip(props: { active: boolean; href: string; children: React.ReactNode }) {
  return (
    <Link
      href={props.href}
      className={`border px-3 py-1 text-xs transition-colors ${
        props.active
          ? "border-foreground/40 bg-foreground/10 text-foreground"
          : "border-line text-muted hover:text-foreground"
      }`}
    >
      {props.children}
    </Link>
  );
}

export function FilterRow(props: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-16 shrink-0 text-xs text-muted">{props.label}</span>
      {props.children}
    </div>
  );
}

export function Unreachable() {
  return (
    <div className="border border-line bg-panel px-4 py-16 text-center text-sm text-muted">
      The odds engine is not reachable right now. Try again in a minute.
    </div>
  );
}

export function Empty(props: { children: React.ReactNode }) {
  return <div className="px-4 py-12 text-center text-sm text-muted">{props.children}</div>;
}

export const th = "px-3 py-2 text-[11px] font-normal uppercase tracking-wider text-muted";
export const td = "px-3 py-2.5 align-top";
