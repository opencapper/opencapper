"use client";

import { Icon } from "@/components/ui/icon";
import type { IconName } from "@/lib/config/icon-map";
import { cn } from "@/lib/utils";
import { useState, type ReactNode } from "react";

export type DashTab = { id: string; label: string; path: string; panel: ReactNode };

export type DashTick = { key: string; icon: IconName; text: ReactNode; when: string };

const EDGE_MASK = "linear-gradient(to right, transparent, black 8%, black 92%, transparent)";

function Ticker(props: { label: string; ticks: DashTick[] }) {
  if (props.ticks.length === 0) return null;
  return (
    <div className="border-foreground/6 flex items-center border-b">
      <span className="label-mono text-foreground/60 border-foreground/6 flex shrink-0 items-center gap-1.5 border-r px-3 py-2 text-[9px]">
        <span className="bg-success size-1.5 animate-pulse rounded-full motion-reduce:animate-none" />
        {props.label}
      </span>
      <div
        className="thin-scrollbar min-w-0 flex-1 overflow-hidden motion-reduce:overflow-x-auto"
        style={{ maskImage: EDGE_MASK, WebkitMaskImage: EDGE_MASK }}
      >
        <ul
          className="animate-marquee flex w-max hover:[animation-play-state:paused]"
          style={{ animationDuration: `${props.ticks.length * 5}s` }}
        >
          {[0, 1].map((copy) =>
            props.ticks.map((tick) => (
              <li
                key={`${copy}-${tick.key}`}
                aria-hidden={copy === 1}
                className={cn(
                  "text-foreground/65 flex items-center gap-2 px-4 py-2 text-[11px] whitespace-nowrap",
                  copy === 1 && "motion-reduce:hidden",
                )}
              >
                <Icon name={tick.icon} className="text-foreground/40 size-3" />
                <span className="flex items-center gap-1.5">{tick.text}</span>
                <span className="text-foreground/35 font-mono text-[10px]">{tick.when}</span>
              </li>
            )),
          )}
        </ul>
      </div>
    </div>
  );
}

export function DashFrame(props: { host: string; tabs: DashTab[]; tickerLabel: string; ticks: DashTick[] }) {
  const tabState = useState(props.tabs[0]?.id ?? "");
  const tab = tabState[0];
  const active = props.tabs.find((item) => item.id === tab) ?? props.tabs[0];

  return (
    <div className="border-foreground/8 bg-card @container overflow-hidden rounded-lg border">
      <div className="bg-foreground/2 border-foreground/6 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b px-3 py-2">
        <div className="flex min-w-0 flex-1 basis-48 items-center gap-2">
          <span aria-hidden className="flex shrink-0 items-center gap-1.5">
            <span className="bg-foreground/10 size-2 rounded-full" />
            <span className="bg-foreground/10 size-2 rounded-full" />
            <span className="bg-foreground/10 size-2 rounded-full" />
          </span>
          <span className="text-foreground/35 ml-1 truncate font-mono text-[10px]">
            {props.host}
            {active?.path}
          </span>
        </div>
        <div role="tablist" className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1">
          {props.tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => tabState[1](item.id)}
              className={cn(
                "font-mono text-[9px] tracking-wider uppercase transition-colors",
                tab === item.id ? "text-foreground/80" : "text-foreground/30 hover:text-foreground/60",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <Ticker label={props.tickerLabel} ticks={props.ticks} />
      <div role="tabpanel" key={active?.id} className="animate-fade-in p-3 sm:p-4">
        {active?.panel}
      </div>
    </div>
  );
}
