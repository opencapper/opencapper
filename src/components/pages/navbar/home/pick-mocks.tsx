"use client";

import { LogoImage } from "@/components/elements/brand/brand";
import { Matchup } from "@/components/elements/participant/matchup";
import { SportIcon } from "@/components/elements/sport/sport-icon";
import { VendorLabel } from "@/components/elements/vendor/vendor-logo";
import { Icon } from "@/components/ui/icon";
import { env } from "@/lib/config/env";
import type { LandingEvent } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

export type PickSample = {
  event: LandingEvent | null;
  sportKey: string;
  sportName: string;
  sportLabel: string;
  home: string;
  away: string;
  title: string;
  selection: string;
  odds: string | null;
  bookmaker: string | null;
  kickoff: string | null;
};

const UNIT_STEPS = ["0.5u", "1u", "2u", "3u", "5u"];

// The bot's Discord avatar: the favicon mark, dark square with a white ring, cropped round.
function BotAvatar(props: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-9 shrink-0 overflow-hidden rounded-full bg-[#fafafa]",
        props.className,
      )}
    >
      <LogoImage className="size-full text-[#0a0a0a]" />
    </span>
  );
}

function Field(props: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-foreground/50 text-[11px] font-semibold">
        {props.label}
      </div>
      <div className="text-foreground/85 tabular truncate text-[13px]">
        {props.children}
      </div>
    </div>
  );
}

export function DiscordMock(props: { sample: PickSample }) {
  const t = useTranslations("LANDING.SHOWCASE");

  return (
    <div className="mx-auto flex max-w-lg gap-3">
      <BotAvatar />
      <div className="min-w-0 flex-1">
        <p className="text-foreground/45 mb-1 flex items-center gap-1 text-[11px]">
          <Icon name="hash" className="size-3" />
          {t("DISCORD.USED")}
          <span className="text-foreground/70 font-mono">/pick</span>
        </p>
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-foreground/90 text-sm font-medium">
            OpenCapper
          </span>
          <span className="rounded-[3px] bg-[#5865F2] px-1 py-px text-[9px] leading-none font-semibold text-white uppercase">
            {t("DISCORD.APP")}
          </span>
          <span className="text-foreground/40 text-[11px]">
            {t("DISCORD.TODAY")}
          </span>
        </div>
        <div className="border-primary/30 bg-muted mt-1.5 max-w-md rounded-sm border-l-4 px-3 py-2.5">
          <p className="text-foreground/55 text-[11px]">
            {t("DISCORD.AUTHOR")}
          </p>
          <p className="text-foreground/90 mt-0.5 text-sm font-semibold">
            {props.sample.title}
          </p>
          <p className="text-foreground/75 mt-1 text-[13px]">
            <span className="text-foreground/95 font-semibold">
              {props.sample.selection}
            </span>{" "}
            ({t("MONEYLINE")})
          </p>
          <div className="mt-2.5 grid grid-cols-3 gap-x-3 gap-y-2">
            <Field label={t("UNITS")}>1u</Field>
            <Field label={t("ODDS")}>{props.sample.odds ?? t("AT_LOCK")}</Field>
            <Field label={t("BOOKMAKER")}>
              {props.sample.bookmaker ? (
                <VendorLabel vendorKey={props.sample.bookmaker} />
              ) : (
                t("AT_LOCK")
              )}
            </Field>
            <div className="col-span-3">
              <Field label={t("STARTS")}>
                {props.sample.kickoff ?? t("PLACEHOLDER_KICKOFF")}
              </Field>
            </div>
          </div>
          <p className="text-foreground/50 mt-2.5 flex items-center gap-1.5 text-[11px]">
            <Icon name="lock" className="size-3" />
            {t("LOCKED")}
          </p>
        </div>
      </div>
    </div>
  );
}

function TgButton(props: { children: ReactNode; active?: boolean }) {
  return (
    <span
      className={cn(
        "flex min-w-0 flex-1 items-center justify-center gap-1.5 truncate rounded-md px-2 py-1.5 text-center text-xs transition-colors",
        props.active
          ? "text-foreground bg-[#2AABEE]/25"
          : "bg-input/80 text-foreground/70",
      )}
    >
      {props.children}
    </span>
  );
}

export function TelegramMock(props: { sample: PickSample }) {
  const t = useTranslations("LANDING.SHOWCASE");

  return (
    <div className="mx-auto max-w-sm">
      <div className="border-border mb-3 flex items-center gap-2.5 border-b pb-3">
        <span className="inline-flex size-8 items-center justify-center rounded-full bg-[#2AABEE] text-white">
          <Icon name="brand-telegram" className="size-4" />
        </span>
        <div className="leading-tight">
          <p className="text-foreground/90 text-sm font-medium">OpenCapper</p>
          <p className="text-foreground/40 text-[11px]">{t("TELEGRAM.BOT")}</p>
        </div>
      </div>
      <div className="bg-accent rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-[13px]">
        <p className="text-foreground/60">
          {t("SPORT")}:{" "}
          <span className="text-foreground/90">{props.sample.sportName}</span>
        </p>
        <p className="text-foreground/60">
          {t("EVENT")}:{" "}
          <span className="text-foreground/90">{props.sample.title}</span>
        </p>
        <p className="text-foreground/60">
          {t("SELECTION")}:{" "}
          <span className="text-foreground/90">
            {props.sample.selection}
            {props.sample.odds && ` ${props.sample.odds}`}
          </span>
        </p>
        <p className="text-foreground/85 mt-2">{t("TELEGRAM.PROMPT")}</p>
      </div>
      <div className="mt-1.5 space-y-1">
        <div className="flex gap-1">
          <TgButton active>
            <SportIcon sportKey={props.sample.sportKey} className="size-3" />
            {props.sample.sportName}
          </TgButton>
        </div>
        <div className="flex gap-1">
          <TgButton active>{props.sample.title}</TgButton>
        </div>
        <div className="flex gap-1">
          <TgButton active>
            {props.sample.home}
            {props.sample.odds && (
              <span className="tabular text-foreground/60">
                {props.sample.odds}
              </span>
            )}
          </TgButton>
          <TgButton>{props.sample.away}</TgButton>
        </div>
        <div className="flex gap-1">
          {UNIT_STEPS.map((step) => (
            <TgButton key={step} active={step === "1u"}>
              <span className="tabular">{step}</span>
            </TgButton>
          ))}
        </div>
        <div className="flex gap-1">
          <TgButton>
            <Icon name="lock" className="size-3" />
            {t("LOCK_PICK")}
          </TgButton>
        </div>
      </div>
    </div>
  );
}

function FormRow(props: { label: string; children: ReactNode }) {
  return (
    <div className="border-border grid grid-cols-[88px_1fr] items-center gap-3 border-b py-2.5 last:border-b-0">
      <span className="label-mono text-foreground/40 text-[10px]">
        {props.label}
      </span>
      <div className="text-foreground/85 min-w-0 text-[13px]">
        {props.children}
      </div>
    </div>
  );
}

export function WebMock(props: { sample: PickSample }) {
  const t = useTranslations("LANDING.SHOWCASE");

  return (
    <div className="border-input bg-background mx-auto max-w-md overflow-hidden rounded-lg border">
      <div className="border-border flex items-center justify-between border-b px-4 py-2.5">
        <span className="text-foreground/90 text-sm font-medium">
          {t("WEB.TITLE")}
        </span>
        <span className="label-mono text-foreground/35 text-[9px]">
          {new URL(env.siteOrigin).host}
        </span>
      </div>
      <div className="px-4 py-1">
        <FormRow label={t("SPORT")}>
          <span className="flex items-center gap-2">
            <SportIcon sportKey={props.sample.sportKey} className="size-3.5" />
            {props.sample.sportLabel}
          </span>
        </FormRow>
        <FormRow label={t("EVENT")}>
          {props.sample.event ? (
            <Matchup event={props.sample.event} />
          ) : (
            props.sample.title
          )}
        </FormRow>
        <FormRow label={t("SELECTION")}>
          <div className="flex flex-wrap gap-1.5">
            <span className="border-primary/40 bg-primary/6 inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs">
              {props.sample.home}
              {props.sample.odds && (
                <span className="tabular text-foreground/60">
                  {props.sample.odds}
                </span>
              )}
            </span>
            <span className="border-input text-foreground/55 inline-flex items-center rounded-md border px-2 py-1 text-xs">
              {props.sample.away}
            </span>
          </div>
        </FormRow>
        <FormRow label={t("UNITS")}>
          <span className="tabular">1u</span>
        </FormRow>
      </div>
      <div className="border-border flex items-center justify-between gap-3 border-t px-4 py-3">
        <span className="text-foreground/45 text-[11px]">{t("WEB.NOTE")}</span>
        <span className="bg-primary text-primary-foreground inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium">
          <Icon name="lock" className="size-3" />
          {t("LOCK_PICK")}
        </span>
      </div>
    </div>
  );
}
