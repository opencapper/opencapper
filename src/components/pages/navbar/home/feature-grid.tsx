import { VendorLabel } from "@/components/elements/vendor/vendor-logo";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/i18n/navigation";
import { msg } from "@/lib/config/constants";
import { BANKROLL, CONFIDENCE_LEVELS, KELLY_FRACTION, confidenceLabel, count, feeOf, fractionLabel, kelly, netOdds, odds, percent, prob, roundStake, type Translate } from "@/lib/format";
import type { PlainTranslationKey } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import type { LandingLive } from "./landing-data";

type Preview = (ctx: { t: Translate; live: LandingLive; locale: string }) => ReactNode;

const CHIP =
  "border-input bg-muted text-foreground/60 inline-flex h-5 items-center gap-1 rounded-sm border px-1.5 font-mono text-[10px]";

function Chip(props: { children: ReactNode; className?: string }) {
  return <span className={cn(CHIP, props.className)}>{props.children}</span>;
}

const CONFIDENCE_TONE = {
  high: "text-success",
  medium: "text-warning",
  low: "text-foreground/50",
  check: "text-destructive",
} as const;

const METHODS = [
  { key: "power", label: msg("TOOLS.POWER") },
  { key: "multiplicative", label: msg("TOOLS.MULT") },
  { key: "additive", label: msg("TOOLS.ADD") },
  { key: "worst_case", label: msg("BET.METHOD_WORST") },
] as const;

const PILLARS = {
  precision: msg("LANDING.FEATURES.PRECISION"),
  longevity: msg("LANDING.FEATURES.LONGEVITY"),
  proof: msg("LANDING.FEATURES.PROOF"),
};

const FEATURES: {
  key: string;
  pillar: keyof typeof PILLARS;
  title: PlainTranslationKey;
  body: PlainTranslationKey;
  href: string;
  preview: Preview;
}[] = [
  {
    key: "devig",
    pillar: "precision",
    title: msg("LANDING.FEATURES.DEVIG_TITLE"),
    body: msg("LANDING.FEATURES.DEVIG_BODY"),
    href: "/tools",
    preview: (ctx) => {
      const bet = ctx.live.featured[0]?.best;
      if (!bet) return null;
      return METHODS.map((m) => (
        <Chip key={m.key} className="tabular">
          {ctx.t(m.label)} <span className="text-foreground/85">{prob(bet.fair[m.key])}</span>
        </Chip>
      ));
    },
  },
  {
    key: "exchange",
    pillar: "precision",
    title: msg("LANDING.FEATURES.EXCHANGE_TITLE"),
    body: msg("LANDING.FEATURES.EXCHANGE_BODY"),
    href: "/books",
    preview: (ctx) =>
      ctx.live.books
        .filter((b) => b.commission || b.taker_fee)
        .map((b) => (
          <Chip key={b.book} className="text-foreground/75">
            <VendorLabel vendorKey={b.book} size={11} />
            <span className="text-foreground/45 tabular">
              {fractionLabel(b.commission ?? b.taker_fee ?? 0)}
            </span>
          </Chip>
        )),
  },
  {
    key: "fresh",
    pillar: "precision",
    title: msg("LANDING.FEATURES.FRESH_TITLE"),
    body: msg("LANDING.FEATURES.FRESH_BODY"),
    href: "/value-bets",
    preview: (ctx) =>
      CONFIDENCE_LEVELS.map((level) => (
        <Chip key={level} className={cn("tabular", CONFIDENCE_TONE[level])}>
          {confidenceLabel(level, ctx.t)} {count(ctx.live.groups.filter((g) => g.best.confidence === level).length, ctx.locale)}
        </Chip>
      )),
  },
  {
    key: "health",
    pillar: "longevity",
    title: msg("LANDING.FEATURES.HEALTH_TITLE"),
    body: msg("LANDING.FEATURES.HEALTH_BODY"),
    href: "/tracker/health",
    preview: (ctx) => (
      <>
        <Chip className="text-success">{ctx.t("HEALTH.RISK_LOW")}</Chip>
        <Chip className="text-warning">{ctx.t("HEALTH.RISK_MEDIUM")}</Chip>
        <Chip className="text-destructive">{ctx.t("HEALTH.RISK_HIGH")}</Chip>
      </>
    ),
  },
  {
    key: "round",
    pillar: "longevity",
    title: msg("LANDING.FEATURES.ROUND_TITLE"),
    body: msg("LANDING.FEATURES.ROUND_BODY"),
    href: "/tools",
    preview: (ctx) => {
      const bet = ctx.live.featured[0]?.best;
      if (!bet) return null;
      const raw = kelly(netOdds(Number(bet.odds), feeOf(ctx.live.books, bet.book)), bet.fair_probability, KELLY_FRACTION) * BANKROLL;
      return (
        <>
          <Chip className="tabular text-foreground/35 line-through">{raw.toFixed(2)}</Chip>
          <Chip className="tabular text-foreground/85">{count(roundStake(raw), ctx.locale)}</Chip>
          <Chip>{ctx.t("LANDING.FEATURES.PREVIEW.KELLY", { bankroll: count(BANKROLL, ctx.locale) })}</Chip>
        </>
      );
    },
  },
  {
    key: "mix",
    pillar: "longevity",
    title: msg("LANDING.FEATURES.MIX_TITLE"),
    body: msg("LANDING.FEATURES.MIX_BODY"),
    href: "/tracker",
    preview: (ctx) => (
      <>
        <Chip className="text-success">{ctx.t("LANDING.FEATURES.PREVIEW.VALUE_BET")}</Chip>
        <Chip className="text-foreground/80">{ctx.t("LANDING.FEATURES.PREVIEW.OWN_BET")}</Chip>
        <Chip className="text-foreground/80">{ctx.t("LANDING.FEATURES.PREVIEW.ACCA")}</Chip>
      </>
    ),
  },
  {
    key: "ledger",
    pillar: "proof",
    title: msg("LANDING.FEATURES.LEDGER_TITLE"),
    body: msg("LANDING.FEATURES.LEDGER_BODY"),
    href: "/proof",
    preview: (ctx) => (
      <>
        <Chip className="tabular text-foreground/85">
          {ctx.t("LANDING.FEATURES.PREVIEW.ON_RECORD", { count: ctx.live.ledger.stats.alerts })}
        </Chip>
        <Chip className="tabular">
          {ctx.t("LANDING.FEATURES.PREVIEW.WAITING", { count: count(ctx.live.ledger.stats.open, ctx.locale) })}
        </Chip>
      </>
    ),
  },
  {
    key: "clv",
    pillar: "proof",
    title: msg("LANDING.FEATURES.CLV_TITLE"),
    body: msg("LANDING.FEATURES.CLV_BODY"),
    href: "/proof",
    preview: (ctx) => {
      const entry = ctx.live.closed[0];
      if (!entry || entry.clv === null || entry.clv === undefined || !entry.closing_fair_odds) return null;
      return (
        <>
          <Chip className="tabular">
            {ctx.t("LANDING.FEATURES.PREVIEW.TAKEN")} <span className="text-foreground/85">{odds(entry.alert_odds)}</span>
          </Chip>
          <Chip className="tabular">
            {ctx.t("LANDING.FEATURES.PREVIEW.CLOSE")} <span className="text-foreground/85">{odds(entry.closing_fair_odds)}</span>
          </Chip>
          <Chip className={cn("tabular", entry.clv > 0 ? "text-success" : "text-destructive")}>
            {ctx.t("LANDING.FEATURES.PREVIEW.CLV")} {percent(entry.clv)}
          </Chip>
        </>
      );
    },
  },
  {
    key: "losses",
    pillar: "proof",
    title: msg("LANDING.FEATURES.LOSSES_TITLE"),
    body: msg("LANDING.FEATURES.LOSSES_BODY"),
    href: "/proof",
    preview: (ctx) => {
      const s = ctx.live.ledger.stats;
      return (
        <>
          <Chip className="tabular text-success">{ctx.t("LANDING.FEATURES.PREVIEW.BEAT", { count: count(s.beat_close, ctx.locale) })}</Chip>
          <Chip className="tabular text-destructive">
            {ctx.t("LANDING.FEATURES.PREVIEW.MISSED", { count: count(s.closed - s.beat_close, ctx.locale) })}
          </Chip>
        </>
      );
    },
  },
];

export async function FeatureGrid(props: { live: LandingLive }) {
  const t = await getTranslations();
  const ctx = { t, live: props.live, locale: await getLocale() };

  return (
    <div className="border-input/80 bg-card relative mb-12 grid grid-cols-1 overflow-hidden rounded-lg border sm:grid-cols-2 md:grid-cols-3">
      {FEATURES.map((feature, i) => (
        <Link
          key={feature.key}
          href={feature.href}
          className={cn(
            "group/card border-input/80 hover:bg-muted/50 relative flex min-h-[100px] flex-col p-4 transition-colors duration-200 lg:p-5",
            i < 8 && "border-b",
            i >= 6 && "md:border-b-0",
            i % 2 === 0 && i < 8 && "sm:border-r",
            i % 3 === 2 && "md:border-r-0",
            i % 2 !== 0 && i % 3 !== 2 && "md:border-r",
          )}
        >
          <Icon
            name="arrow-up-right"
            className="text-foreground/40 absolute top-3 right-3 size-4 -translate-y-0.5 opacity-0 transition-all duration-200 group-hover/card:translate-y-0 group-hover/card:opacity-100 lg:top-4 lg:right-4"
          />
          <span className="text-foreground/30 group-hover/card:text-foreground/50 font-mono text-[11px] tracking-wider transition-colors">
            {String(i + 1).padStart(2, "0")}
            <span className="ml-2 uppercase">{t(PILLARS[feature.pillar])}</span>
          </span>
          <h3 className="text-foreground/90 mt-1 text-[13px] font-medium">{t(feature.title)}</h3>
          <p className="text-foreground/55 mt-2 text-[13px] leading-relaxed">{t(feature.body)}</p>
          <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4">{feature.preview(ctx)}</div>
        </Link>
      ))}
    </div>
  );
}
