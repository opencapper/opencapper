"use client";

import { Icon } from "@/components/ui/icon";
import { msg } from "@/lib/config/constants";
import { env } from "@/lib/config/env";
import type { IconName } from "@/lib/config/icon-map";
import { PICK_STATUS_KEY } from "@/lib/config/markets";
import type { PickResult } from "@/lib/api/typebox/picks";
import type {
  LandingDash,
  LandingDashTick,
  PlainTranslationKey,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatAmericanOdds } from "@/lib/utils/format/number";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Ago } from "./dash-parts";
import { HistoryView, OverviewView, PicksView, VerifyView } from "./dash-views";

type Tab = "overview" | "picks" | "history" | "verify";

const TABS = [
  { id: "overview", label: msg("LANDING.DASH.TABS.OVERVIEW") },
  { id: "picks", label: msg("LANDING.DASH.TABS.PICKS") },
  { id: "history", label: msg("LANDING.DASH.TABS.HISTORY") },
  { id: "verify", label: msg("LANDING.DASH.TABS.VERIFY") },
] satisfies { id: Tab; label: PlainTranslationKey }[];

const TICK_ICON = {
  locked: "lock",
  graded: "circle-check",
  anchored: "bitcoin",
} satisfies Record<LandingDashTick["kind"], IconName>;

const RESULT_DOT = {
  pending: "bg-pick-pending",
  win: "bg-pick-win",
  loss: "bg-pick-loss",
  push: "bg-pick-push",
  void: "bg-pick-void",
  half_win: "bg-pick-win",
  half_loss: "bg-pick-loss",
  split: "bg-pick-push",
} satisfies Record<PickResult, string>;

const EDGE_MASK =
  "linear-gradient(to right, transparent, black 8%, black 92%, transparent)";

function TickText(props: { tick: LandingDashTick }) {
  const t = useTranslations();
  const tick = props.tick;
  if (tick.kind === "locked")
    return t("LANDING.DASH.TICK_LOCKED", {
      username: tick.username,
      selection: tick.selection,
      odds: formatAmericanOdds(tick.odds),
    });
  if (tick.kind === "graded")
    return (
      <>
        <span
          className={cn("size-1.5 rounded-full", RESULT_DOT[tick.result])}
        />
        {t("LANDING.DASH.TICK_GRADED", {
          username: tick.username,
          sequence: tick.sequence,
          result: t(PICK_STATUS_KEY[tick.result]),
        })}
      </>
    );
  return t(
    tick.upgraded
      ? "LANDING.DASH.TICK_CONFIRMED"
      : "LANDING.DASH.TICK_ANCHORED",
    { size: tick.size },
  );
}

function Ticker(props: { ticks: LandingDashTick[] }) {
  const t = useTranslations();
  if (props.ticks.length === 0) return null;
  return (
    <div className="border-foreground/6 flex items-center border-b">
      <span className="label-mono text-foreground/60 border-foreground/6 flex shrink-0 items-center gap-1.5 border-r px-3 py-2 text-[9px]">
        <span className="bg-pick-win size-1.5 animate-pulse rounded-full motion-reduce:animate-none" />
        {t("LANDING.DASH.TICKER_LABEL")}
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
                <Icon
                  name={TICK_ICON[tick.kind]}
                  className="text-foreground/40 size-3"
                />
                <span className="flex items-center gap-1.5">
                  <TickText tick={tick} />
                </span>
                <Ago at={tick.at} />
              </li>
            )),
          )}
        </ul>
      </div>
    </div>
  );
}

export function DashFrame(props: { dash: LandingDash }) {
  const t = useTranslations();
  const [tab, setTab] = useState<Tab>("overview");
  const host = new URL(env.appUrl).host;

  return (
    <div className="border-foreground/8 bg-card @container overflow-hidden rounded-lg border">
      <div className="bg-foreground/2 border-foreground/6 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span aria-hidden className="flex shrink-0 items-center gap-1.5">
            <span className="bg-foreground/10 size-2 rounded-full" />
            <span className="bg-foreground/10 size-2 rounded-full" />
            <span className="bg-foreground/10 size-2 rounded-full" />
          </span>
          <span className="text-foreground/35 ml-1 truncate font-mono text-[10px]">
            {host}/u/{props.dash.capper.username}
          </span>
        </div>
        <div role="tablist" className="flex items-center gap-3">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                "font-mono text-[9px] tracking-wider uppercase transition-colors",
                tab === item.id
                  ? "text-foreground/80"
                  : "text-foreground/30 hover:text-foreground/60",
              )}
            >
              {t(item.label)}
            </button>
          ))}
        </div>
      </div>
      <Ticker ticks={props.dash.ticker} />
      <div role="tabpanel" className="p-3 sm:p-4">
        {tab === "overview" && <OverviewView dash={props.dash} />}
        {tab === "picks" && <PicksView dash={props.dash} />}
        {tab === "history" && <HistoryView dash={props.dash} />}
        {tab === "verify" && <VerifyView dash={props.dash} />}
      </div>
    </div>
  );
}
