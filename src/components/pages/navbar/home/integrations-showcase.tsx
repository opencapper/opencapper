"use client";

import { sportLabelKey } from "@/components/elements/sport/sport-icon";
import { Icon } from "@/components/ui/icon";
import type { IconName } from "@/lib/config/icon-map";
import { useCopyToClipboard } from "@/hooks/ui/use-copy-to-clipboard-hook";
import { msg } from "@/lib/config/constants";
import { env } from "@/lib/config/env";
import { isFighterGroup, sportGroup } from "@/lib/config/sports";
import type { LandingEvent, LandingFeatured, LandingPrice } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatUtcShortDateTime } from "@/lib/utils/format/date";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  DiscordMock,
  type PickSample,
  TelegramMock,
  WebMock,
} from "./pick-mocks";

type Mode = "discord" | "telegram" | "web" | "api";

const TABS = [
  {
    id: "discord",
    label: msg("LANDING.SHOWCASE.TABS.DISCORD"),
    icon: "brand-discord",
  },
  {
    id: "telegram",
    label: msg("LANDING.SHOWCASE.TABS.TELEGRAM"),
    icon: "brand-telegram",
  },
  { id: "web", label: msg("LANDING.SHOWCASE.TABS.WEB"), icon: "monitor" },
  { id: "api", label: msg("LANDING.SHOWCASE.TABS.API"), icon: "braces" },
] satisfies { id: Mode; label: string; icon: IconName }[];

function useSample(
  event: LandingEvent | null,
  price: LandingPrice | null,
): PickSample {
  const t = useTranslations();
  const locale = useLocale();
  const sportKey = event?.sportKey ?? "mma_mixed_martial_arts";
  const fighters = isFighterGroup(sportGroup(sportKey));
  const home = event?.home ?? t("LANDING.SHOWCASE.PLACEHOLDER_HOME");
  const away = event?.away ?? t("LANDING.SHOWCASE.PLACEHOLDER_AWAY");
  return {
    event,
    sportKey,
    sportName: event?.sportName ?? "MMA",
    sportLabel: t(sportLabelKey(sportKey)),
    home,
    away,
    title: fighters ? `${home} vs ${away}` : `${away} @ ${home}`,
    selection: price?.selection ?? home,
    odds: price ? price.oddsDecimal.toFixed(2) : null,
    bookmaker: price?.bookmaker ?? null,
    kickoff: event ? formatUtcShortDateTime(event.commenceTime, locale) : null,
  };
}

function ApiSnippet(props: { username: string }) {
  const t = useTranslations("LANDING.SHOWCASE.API");
  const copier = useCopyToClipboard();
  const lines = [
    `curl ${env.siteOrigin}/api/users/${props.username}/picks`,
    `curl ${env.siteOrigin}/api/log/head`,
  ];

  return (
    <div>
      <p className="label-mono text-foreground/45 mb-2 text-[10px]">
        {t("META")}
      </p>
      <div className="border-input bg-muted/50 flex items-start justify-between gap-3 rounded-md border px-4 py-3">
        <div className="min-w-0 space-y-1">
          {lines.map((line) => (
            <code
              key={line}
              className="font-pixel block min-w-0 text-[13px] break-all"
            >
              <span className="text-foreground/40">$</span>{" "}
              <span className="text-foreground/85">{line}</span>
            </code>
          ))}
        </div>
        <button
          type="button"
          onClick={() => copier.copy(lines.join("\n"), {})}
          aria-label={t("COPY")}
          className="text-foreground/40 hover:text-foreground/80 hover:bg-muted shrink-0 rounded-sm p-1 transition-colors"
        >
          <Icon name={copier.isCopied ? "check" : "copy"} className="size-4" />
        </button>
      </div>
      <p className="text-foreground/55 mt-3 text-[13px] leading-relaxed">
        {t("NOTE")}
      </p>
    </div>
  );
}

export function IntegrationsShowcase(props: {
  featured: LandingFeatured[];
  username: string;
}) {
  const t = useTranslations();
  const modeState = useState<Mode>("discord");
  const mode = modeState[0];
  const indexState = useState(0);
  const setIndex = indexState[1];
  const count = props.featured.length;
  const current = props.featured.at(indexState[0] % Math.max(count, 1));
  const sample = useSample(current?.event ?? null, current?.price ?? null);

  // The server renders the most covered game; the client then starts at a random one.
  useEffect(() => {
    if (count > 1) setIndex(Math.floor(Math.random() * count));
  }, [count, setIndex]);

  // The active underline is the timer: its CSS animation pauses on hover or focus, and its end moves on.
  const advance = () => {
    const next = (TABS.findIndex((tab) => tab.id === mode) + 1) % TABS.length;
    if (next === 0) setIndex((i) => i + 1);
    modeState[1](TABS[next].id);
  };

  return (
    <div className="group/showcase border-input bg-card mb-8 overflow-hidden rounded-lg border">
      <div
        className="border-input thin-scrollbar flex items-center overflow-x-auto border-b"
        role="tablist"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={mode === tab.id}
            onClick={() => modeState[1](tab.id)}
            className={cn(
              "relative flex shrink-0 items-center gap-1.5 px-4 py-2.5 text-xs transition-colors",
              mode === tab.id
                ? "text-foreground"
                : "text-foreground/45 hover:text-foreground/70",
            )}
          >
            <Icon name={tab.icon} className="size-3.5" />
            {t(tab.label)}
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
      </div>

      <div
        key={current?.event.id}
        className="bg-muted/25 animate-fade-in min-h-[300px] px-4 py-5 sm:px-6"
      >
        {mode === "discord" && (
          <>
            <DiscordMock sample={sample} />
            <a
              href={env.discordInviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/55 hover:text-foreground/85 mx-auto mt-4 flex w-fit items-center gap-1.5 text-xs transition-colors"
            >
              <Icon name="brand-discord" className="size-3.5" />
              {t("LANDING.SHOWCASE.DISCORD.TRY")}
              <Icon name="arrow-up-right" className="size-3" />
            </a>
          </>
        )}
        {mode === "telegram" && <TelegramMock sample={sample} />}
        {mode === "web" && <WebMock sample={sample} />}
        {mode === "api" && <ApiSnippet username={props.username} />}
      </div>
    </div>
  );
}
