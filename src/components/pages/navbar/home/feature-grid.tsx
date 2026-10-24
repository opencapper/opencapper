import { VendorLabel } from "@/components/elements/vendor/vendor-logo";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/i18n/navigation";
import type { LinkHref } from "@/i18n/routing";
import { msg } from "@/lib/config/constants";
import { env } from "@/lib/config/env";
import type { LandingData, PlainTranslationKey } from "@/lib/types";
import { cn } from "@/lib/utils";
import { dayjs, formatUtcShortDateTime } from "@/lib/utils/format/date";
import { formatPercent } from "@/lib/utils/format/number";
import type { useTranslations } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

type Translate = ReturnType<typeof useTranslations<never>>;
type Preview = (ctx: {
  t: Translate;
  data: LandingData;
  locale: string;
  now: string;
}) => ReactNode;

const EMPTY_RESULTS = { win: 0, loss: 0, push: 0, void: 0 };

const CHIP =
  "border-input bg-muted text-foreground/60 inline-flex h-5 items-center gap-1 rounded-sm border px-1.5 font-mono text-[10px]";

function Chip(props: { children: ReactNode; className?: string }) {
  return <span className={cn(CHIP, props.className)}>{props.children}</span>;
}

const FEATURES: {
  key: string;
  label: PlainTranslationKey;
  title: PlainTranslationKey;
  body: PlainTranslationKey;
  href: LinkHref | "github";
  preview: Preview;
}[] = [
  {
    key: "record",
    label: msg("LANDING.FEATURES.RECORD_LABEL"),
    title: msg("LANDING.FEATURES.RECORD_TITLE"),
    body: msg("LANDING.FEATURES.RECORD_BODY"),
    href: "/leaderboard",
    preview: (ctx) => (
      <>
        <Chip className="text-foreground/85 tabular">
          {ctx.t("LANDING.FEATURES.PREVIEW.ON_RECORD", {
            count: ctx.data.stats?.head.size ?? 0,
          })}
        </Chip>
        <Chip className="tabular">
          {ctx.t("LANDING.FEATURES.PREVIEW.DELETED")}
        </Chip>
      </>
    ),
  },
  {
    key: "locked",
    label: msg("LANDING.FEATURES.LOCKED_LABEL"),
    title: msg("LANDING.FEATURES.LOCKED_TITLE"),
    body: msg("LANDING.FEATURES.LOCKED_BODY"),
    href: "/verify",
    preview: (ctx) => (
      <div className="tabular flex w-full items-center gap-2 font-mono text-[10px]">
        <span className="text-foreground/70 flex items-center gap-1">
          <Icon name="lock" className="size-3" />
          {dayjs(ctx.now).utc().format("HH:mm")}
        </span>
        <span className="bg-input relative h-px flex-1">
          <span className="bg-primary/50 absolute inset-y-0 left-0 w-3/4" />
        </span>
        <span className="text-foreground/40">
          {ctx.t("LANDING.FEATURES.PREVIEW.KICKOFF")}{" "}
          {ctx.data.event
            ? formatUtcShortDateTime(ctx.data.event.commenceTime, ctx.locale)
            : ctx.t("LANDING.FEATURES.PREVIEW.NEXT_EVENT")}
        </span>
      </div>
    ),
  },
  {
    key: "graded",
    label: msg("LANDING.FEATURES.GRADED_LABEL"),
    title: msg("LANDING.FEATURES.GRADED_TITLE"),
    body: msg("LANDING.FEATURES.GRADED_BODY"),
    href: "/leaderboard",
    preview: (ctx) => {
      const results = ctx.data.stats?.results ?? EMPTY_RESULTS;
      return (
        <>
          <Chip className="text-pick-win tabular">
            {ctx.t("LANDING.FEATURES.PREVIEW.WIN")} {results.win}
          </Chip>
          <Chip className="text-pick-loss tabular">
            {ctx.t("LANDING.FEATURES.PREVIEW.LOSS")} {results.loss}
          </Chip>
          <Chip className="text-pick-push tabular">
            {ctx.t("LANDING.FEATURES.PREVIEW.PUSH")} {results.push}
          </Chip>
          <Chip className="text-pick-void tabular">
            {ctx.t("LANDING.FEATURES.PREVIEW.VOID")} {results.void}
          </Chip>
        </>
      );
    },
  },
  {
    key: "roi",
    label: msg("LANDING.FEATURES.ROI_LABEL"),
    title: msg("LANDING.FEATURES.ROI_TITLE"),
    body: msg("LANDING.FEATURES.ROI_BODY"),
    href: "/leaderboard",
    preview: (ctx) => {
      const top = ctx.data.stats?.top ?? [];
      if (top.length === 0)
        return (
          <span className="text-foreground/45 font-mono text-[10px]">
            {ctx.t("LANDING.FEATURES.PREVIEW.NO_RANKED", {
              count: ctx.data.minGraded,
            })}
          </span>
        );
      return (
        <div className="w-full space-y-0.5 font-mono text-[10px]">
          {top.map((row, i) => (
            <div key={row.username} className="flex items-center gap-3">
              <span className="text-foreground/30 tabular">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-foreground/60 flex-1 truncate">
                {row.username}
              </span>
              <span
                className={cn(
                  "tabular",
                  row.roi > 0 && "text-pick-win",
                  row.roi < 0 && "text-pick-loss",
                )}
              >
                {formatPercent(row.roi, ctx.locale)}
              </span>
            </div>
          ))}
        </div>
      );
    },
  },
  {
    key: "affiliates",
    label: msg("LANDING.FEATURES.AFFILIATE_LABEL"),
    title: msg("LANDING.FEATURES.AFFILIATE_TITLE"),
    body: msg("LANDING.FEATURES.AFFILIATE_BODY"),
    href: "github",
    preview: (ctx) => (
      <>
        <Chip className="text-foreground/35 line-through">
          {ctx.t("LANDING.FEATURES.PREVIEW.BONUS")}
        </Chip>
        <Chip className="text-foreground/35 line-through">
          {ctx.t("LANDING.FEATURES.PREVIEW.REFERRAL")}
        </Chip>
        <Chip className="text-foreground/80">
          {ctx.t("LANDING.FEATURES.PREVIEW.ZERO")}
        </Chip>
      </>
    ),
  },
  {
    key: "odds",
    label: msg("LANDING.FEATURES.ODDS_LABEL"),
    title: msg("LANDING.FEATURES.ODDS_TITLE"),
    body: msg("LANDING.FEATURES.ODDS_BODY"),
    href: "/verify",
    preview: (ctx) => (
      <>
        {ctx.data.price ? (
          <>
            <Chip>
              <VendorLabel vendorKey={ctx.data.price.bookmaker} size={12} />
            </Chip>
            <Chip className="text-foreground/85 tabular">
              {ctx.data.price.selection} {ctx.data.price.oddsDecimal.toFixed(2)}
            </Chip>
            <Chip className="tabular">
              {dayjs(ctx.data.price.capturedAt).utc().format("HH:mm:ss")} UTC
            </Chip>
          </>
        ) : (
          <Chip>{ctx.t("LANDING.FEATURES.PREVIEW.NO_ODDS")}</Chip>
        )}
        <Chip>{ctx.t("LANDING.FEATURES.PREVIEW.MARKET")}</Chip>
      </>
    ),
  },
  {
    key: "clv",
    label: msg("LANDING.FEATURES.CLV_LABEL"),
    title: msg("LANDING.FEATURES.CLV_TITLE"),
    body: msg("LANDING.FEATURES.CLV_BODY"),
    href: "/leaderboard",
    preview: (ctx) => {
      const clv = ctx.data.stats?.clv;
      if (!clv) return <Chip>{ctx.t("LANDING.FEATURES.PREVIEW.NO_CLV")}</Chip>;
      return (
        <>
          <Chip className="tabular">
            {ctx.t("LANDING.FEATURES.PREVIEW.TAKEN")}{" "}
            <span className="text-foreground/85">{clv.taken.toFixed(2)}</span>
          </Chip>
          <Chip className="tabular">
            {ctx.t("LANDING.FEATURES.PREVIEW.CLOSE")}{" "}
            <span className="text-foreground/85">{clv.close.toFixed(2)}</span>
          </Chip>
          <Chip
            className={cn(
              "tabular",
              clv.clv > 0 && "text-pick-win",
              clv.clv < 0 && "text-pick-loss",
            )}
          >
            CLV {formatPercent(clv.clv, ctx.locale)}
          </Chip>
        </>
      );
    },
  },
  {
    key: "source",
    label: msg("LANDING.FEATURES.SOURCE_LABEL"),
    title: msg("LANDING.FEATURES.SOURCE_TITLE"),
    body: msg("LANDING.FEATURES.SOURCE_BODY"),
    href: "github",
    preview: () => (
      <>
        <Chip className="text-foreground/80">AGPL-3.0</Chip>
        <Chip>
          <Icon name="brand-github" className="size-2.5" />
          opencapper/opencapper
        </Chip>
      </>
    ),
  },
  {
    key: "log",
    label: msg("LANDING.FEATURES.LOG_LABEL"),
    title: msg("LANDING.FEATURES.LOG_TITLE"),
    body: msg("LANDING.FEATURES.LOG_BODY"),
    href: "/verify",
    preview: (ctx) => {
      const head = ctx.data.stats?.head;
      return (
        <div className="flex w-full items-center font-mono text-[10px]">
          <span className={cn(CHIP, "tabular")}>
            {ctx.t("LANDING.FEATURES.PREVIEW.LOG_SIZE", {
              count: head?.size ?? 0,
            })}
          </span>
          <span className="bg-input h-px w-3 shrink-0" />
          <span
            className={cn(
              CHIP,
              "min-w-0 flex-1 justify-center whitespace-nowrap",
            )}
          >
            {ctx.t("LANDING.FEATURES.PREVIEW.ROOT")}{" "}
            {head ? head.root.slice(0, 12) : "000000000000"}
          </span>
          <span className="bg-input h-px w-3 shrink-0" />
          <span className={cn(CHIP, "text-foreground/80")}>OTS</span>
        </div>
      );
    },
  },
];

function Cell(props: {
  href: LinkHref | "github";
  className: string;
  children: ReactNode;
}) {
  if (props.href === "github") {
    return (
      <a
        href={env.githubUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={props.className}
      >
        {props.children}
      </a>
    );
  }
  return (
    <Link href={props.href} className={props.className}>
      {props.children}
    </Link>
  );
}

export async function FeatureGrid(props: { data: LandingData }) {
  const t = await getTranslations();
  const ctx = {
    t,
    data: props.data,
    locale: await getLocale(),
    now: dayjs().toISOString(),
  };

  return (
    <div className="border-input/80 bg-card relative mb-12 grid grid-cols-1 overflow-hidden rounded-lg border sm:grid-cols-2 md:grid-cols-3">
      {FEATURES.map((feature, i) => (
        <Cell
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
            <span className="ml-2 uppercase">{t(feature.label)}</span>
          </span>
          <h3 className="text-foreground/90 mt-1 text-[13px] font-medium">
            {t(feature.title)}
          </h3>
          <p className="text-foreground/55 mt-2 text-[13px] leading-relaxed">
            {t(feature.body)}
          </p>
          <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
            {feature.preview(ctx)}
          </div>
        </Cell>
      ))}
    </div>
  );
}
