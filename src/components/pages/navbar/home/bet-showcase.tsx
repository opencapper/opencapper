"use client";

import { Icon } from "@/components/ui/icon";
import { msg } from "@/lib/config/constants";
import { env } from "@/lib/config/env";
import type { IconName } from "@/lib/config/icon-map";
import type { PlainTranslationKey } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useEffect, useState, type ReactNode } from "react";

type Mode = "board" | "discord" | "tracker";

export type ShowcaseSlide = { key: string } & Record<Mode, ReactNode>;

const TABS = [
  { id: "board", label: msg("LANDING.SHOWCASE.TABS.BOARD"), icon: "trending-up", soon: false },
  { id: "discord", label: msg("LANDING.SHOWCASE.TABS.DISCORD"), icon: "brand-discord", soon: true },
  { id: "tracker", label: msg("LANDING.SHOWCASE.TABS.TRACKER"), icon: "wallet", soon: false },
] satisfies { id: Mode; label: PlainTranslationKey; icon: IconName; soon: boolean }[];

export function BetShowcase(props: { slides: ShowcaseSlide[] }) {
  const t = useTranslations();
  const modeState = useState<Mode>("board");
  const mode = modeState[0];
  const indexState = useState(0);
  const setIndex = indexState[1];
  const total = props.slides.length;
  const current = props.slides.at(indexState[0] % Math.max(total, 1));

  // The server renders the best bet; the client then starts at a random one of the featured few.
  useEffect(() => {
    if (total > 1) setIndex(Math.floor(Math.random() * total));
  }, [total, setIndex]);

  // The active underline is the timer: its CSS animation pauses on hover or focus, and its end moves on.
  const advance = () => {
    const next = (TABS.findIndex((tab) => tab.id === mode) + 1) % TABS.length;
    if (next === 0) setIndex((i) => i + 1);
    modeState[1](TABS[next].id);
  };

  if (!current) return null;

  return (
    <div className="group/showcase border-input bg-card mb-8 overflow-hidden rounded-lg border">
      <div className="border-input thin-scrollbar flex items-center overflow-x-auto border-b" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={mode === tab.id}
            onClick={() => modeState[1](tab.id)}
            className={cn(
              "relative flex shrink-0 items-center gap-1.5 px-4 py-2.5 text-xs transition-colors",
              mode === tab.id ? "text-foreground" : "text-foreground/45 hover:text-foreground/70",
            )}
          >
            <Icon name={tab.icon} className="size-3.5" />
            {t(tab.label)}
            {tab.soon && (
              <span className="border-input text-foreground/45 rounded-sm border px-1 font-mono text-[8px] tracking-wider uppercase">
                {t("LANDING.SOON")}
              </span>
            )}
            {mode === tab.id && (
              <span className="bg-foreground/10 absolute right-4 bottom-0 left-4 h-[1.5px] overflow-hidden rounded-full">
                <span
                  key={`${mode}-${indexState[0]}`}
                  onAnimationEnd={advance}
                  className="bg-primary/70 animate-tab-progress block size-full origin-left group-focus-within/showcase:[animation-play-state:paused] group-hover/showcase:[animation-play-state:paused] motion-reduce:scale-x-100 motion-reduce:animate-none"
                />
              </span>
            )}
          </button>
        ))}
        <span className="label-mono text-foreground/35 ml-auto hidden shrink-0 items-center gap-1.5 px-4 text-[9px] sm:flex">
          <span className="bg-success size-1.5 animate-pulse rounded-full motion-reduce:animate-none" />
          {t("LANDING.SHOWCASE.LIVE", { index: String((indexState[0] % total) + 1), total: String(total) })}
        </span>
      </div>

      <div key={current.key} className="bg-muted/25 animate-fade-in min-h-[340px] px-4 py-5 sm:px-6">
        {mode === "board" && current.board}
        {mode === "discord" && (
          <>
            {current.discord}
            <a
              href={env.discordInviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/55 hover:text-foreground/85 mx-auto mt-4 flex w-fit items-center gap-1.5 text-xs transition-colors"
            >
              <Icon name="brand-discord" className="size-3.5" />
              {t("LANDING.SHOWCASE.DISCORD_JOIN")}
              <Icon name="arrow-up-right" className="size-3" />
            </a>
          </>
        )}
        {mode === "tracker" && current.tracker}
      </div>
    </div>
  );
}
