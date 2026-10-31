"use client";

import { PickStatusBadge } from "@/components/elements/badge/pick-status-badge";
import { CapperAvatar } from "@/components/elements/capper/capper-avatar";
import { PublicBadge } from "@/components/elements/source/source-badge";
import {
  SportIcon,
  sportLabelKey,
} from "@/components/elements/sport/sport-icon";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/i18n/navigation";
import type { IconName } from "@/lib/config/icon-map";
import { msg } from "@/lib/config/constants";
import type {
  ApiHistoryPick,
  ApiPick,
  DashSource,
  LandingDash,
  PlainTranslationKey,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatUtcShortDateTime } from "@/lib/utils/format/date";
import {
  formatAmericanOdds,
  formatPercent,
  formatPlainUnits,
  formatRecord,
  formatUnits,
} from "@/lib/utils/format/number";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { DashChart } from "./dash-chart";
import {
  Ago,
  CompactMatchup,
  HAIRLINE_GRID,
  MarketLabel,
  Panel,
} from "./dash-parts";

const SOURCE_LABEL = {
  discord: msg("LANDING.INTEGRATIONS.DISCORD_TITLE"),
  telegram: msg("LANDING.INTEGRATIONS.TELEGRAM_TITLE"),
  web: msg("LANDING.INTEGRATIONS.WEB_TITLE"),
  polymarket: msg("LANDING.INTEGRATIONS.POLYMARKET_TITLE"),
} satisfies Record<DashSource, PlainTranslationKey>;

const TH =
  "label-mono text-foreground/40 px-3 py-2 text-left text-[9px] font-normal";
const TD = "px-3 py-2 align-middle";

function signTone(value: number) {
  if (value > 0) return "text-pick-win";
  if (value < 0) return "text-pick-loss";
  return "text-foreground/90";
}

function shortHex(hex: string) {
  return hex.slice(0, 12);
}

function Stat(props: {
  icon: IconName;
  label: string;
  value: string;
  hint: string;
  tone?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-card flex min-w-0 flex-col gap-1 px-3 py-2.5",
        props.className,
      )}
    >
      <span className="label-mono text-foreground/45 flex items-center gap-1.5 text-[9px]">
        <Icon name={props.icon} className="size-3" />
        {props.label}
      </span>
      <span
        className={cn(
          "tabular truncate text-lg font-medium tracking-tight",
          props.tone ?? "text-foreground/90",
        )}
      >
        {props.value}
      </span>
      <span className="text-foreground/40 truncate text-[10px]">
        {props.hint}
      </span>
    </div>
  );
}

function ProfileRow(props: { dash: LandingDash }) {
  const t = useTranslations();
  const capper = props.dash.capper;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <CapperAvatar
        username={capper.username}
        imageUrl={capper.avatarUrl}
        className="size-10"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-foreground/95 truncate text-[15px] font-medium tracking-tight">
            @{capper.username}
          </span>
          {capper.source && <PublicBadge platform={capper.source.platform} />}
        </div>
        <span className="label-mono text-foreground/45 text-[9px]">
          {capper.rank === null
            ? t("LANDING.DASH.UNRANKED")
            : t("LANDING.DASH.RANK", { rank: capper.rank })}
        </span>
      </div>
      <Link
        href={{
          pathname: "/u/[username]",
          params: { username: capper.username },
        }}
        className="group label-mono text-foreground/70 hover:text-foreground border-foreground/10 hover:bg-muted inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[9px] transition-colors"
      >
        {t("LANDING.DASH.VIEW_PROFILE")}
        <Icon
          name="arrow-up-right"
          className="size-3 transition-transform group-hover:translate-x-0.5"
        />
      </Link>
    </div>
  );
}

function StatGrid(props: { dash: LandingDash }) {
  const t = useTranslations();
  const locale = useLocale();
  const capper = props.dash.capper;
  return (
    <div
      className={cn(
        HAIRLINE_GRID,
        "grid-cols-2 @md:grid-cols-3 @2xl:grid-cols-5",
      )}
    >
      <Stat
        icon="scale"
        label={t("PROFILE.STATS.RECORD")}
        value={formatRecord(capper, locale)}
        hint={t("PROFILE.STATS.RECORD_HINT")}
      />
      <Stat
        icon="coins"
        label={t("PROFILE.STATS.UNITS")}
        value={formatUnits(capper.units, locale)}
        hint={t("PROFILE.STATS.UNITS_HINT")}
        tone={signTone(capper.units)}
      />
      <Stat
        icon="percent"
        label={t("PROFILE.STATS.ROI")}
        value={formatPercent(capper.roi, locale)}
        hint={t("PROFILE.STATS.ROI_HINT")}
        tone={signTone(capper.roi)}
      />
      <Stat
        icon="hash"
        label={t("LANDING.DASH.SAMPLE")}
        value={formatPlainUnits(capper.graded, locale)}
        hint={t("LANDING.DASH.SAMPLE_HINT", {
          live: capper.gradedLive,
          history: capper.gradedHistory,
        })}
      />
      <Stat
        icon="trending-up"
        label={t("PROFILE.STATS.CLV")}
        value={
          capper.clv === null
            ? t("PROFILE.PICKS.CLV_NONE")
            : formatPercent(capper.clv, locale)
        }
        hint={
          capper.clv === null
            ? t("PROFILE.STATS.NO_CLV")
            : t("LANDING.DASH.CLV_HINT", { count: capper.clvSample })
        }
        tone={capper.clv === null ? "text-foreground/40" : signTone(capper.clv)}
        className="col-span-2 @2xl:col-span-1"
      />
    </div>
  );
}

function Empty(props: { children: string }) {
  return (
    <p className="text-foreground/45 px-3 py-6 text-center text-[12px]">
      {props.children}
    </p>
  );
}

function PickRows(props: { picks: ApiPick[]; full?: boolean }) {
  const t = useTranslations();
  const locale = useLocale();
  if (props.picks.length === 0)
    return <Empty>{t("PROFILE.PICKS.EMPTY")}</Empty>;
  return (
    <table className="w-full table-fixed text-[12px]">
      <thead className="border-foreground/6 border-b">
        <tr>
          {props.full && (
            <th className={cn(TH, "hidden w-10 @lg:table-cell")}>
              {t("PROFILE.PICKS.SEQUENCE")}
            </th>
          )}
          <th className={TH}>{t("PROFILE.PICKS.EVENT")}</th>
          <th className={cn(TH, "hidden w-[28%] @md:table-cell")}>
            {t("PROFILE.PICKS.SELECTION")}
          </th>
          <th className={cn(TH, "hidden w-16 text-right @md:table-cell")}>
            {t("PROFILE.PICKS.ODDS")}
          </th>
          {props.full && (
            <th className={cn(TH, "hidden w-36 @2xl:table-cell")}>
              {t("PROFILE.PICKS.LOCKED_AT")}
            </th>
          )}
          <th className={cn(TH, "w-20 text-right")}>
            {t("PROFILE.PICKS.STATUS")}
          </th>
        </tr>
      </thead>
      <tbody>
        {props.picks.map((pick) => (
          <tr
            key={pick.id}
            className="border-foreground/6 border-b last:border-b-0"
          >
            {props.full && (
              <td
                className={cn(
                  TD,
                  "tabular text-foreground/40 hidden @lg:table-cell",
                )}
              >
                {pick.sequence}
              </td>
            )}
            <td className={TD}>
              <CompactMatchup event={pick} />
            </td>
            <td className={cn(TD, "hidden @md:table-cell")}>
              <div className="text-foreground/85 truncate">
                {pick.selection}
              </div>
              <MarketLabel market={pick.market} />
            </td>
            <td
              className={cn(
                TD,
                "tabular text-foreground/80 hidden text-right @md:table-cell",
              )}
            >
              {formatAmericanOdds(pick.odds)}
            </td>
            {props.full && (
              <td
                className={cn(
                  TD,
                  "tabular text-foreground/50 hidden text-[11px] whitespace-nowrap @2xl:table-cell",
                )}
              >
                {formatUtcShortDateTime(pick.createdAt, locale)}
              </td>
            )}
            <td className={cn(TD, "text-right")}>
              <PickStatusBadge result={pick.result} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function HistoryRows(props: { picks: ApiHistoryPick[] }) {
  const t = useTranslations();
  const locale = useLocale();
  if (props.picks.length === 0)
    return <Empty>{t("PROFILE.HISTORY.EMPTY")}</Empty>;
  return (
    <table className="w-full table-fixed text-[12px]">
      <thead className="border-foreground/6 border-b">
        <tr>
          <th className={TH}>{t("PROFILE.PICKS.EVENT")}</th>
          <th className={cn(TH, "hidden w-[28%] @md:table-cell")}>
            {t("PROFILE.PICKS.SELECTION")}
          </th>
          <th className={cn(TH, "hidden w-16 text-right @md:table-cell")}>
            {t("PROFILE.PICKS.ODDS")}
          </th>
          <th className={cn(TH, "hidden w-36 @2xl:table-cell")}>
            {t("LANDING.DASH.TRADED")}
          </th>
          <th className={cn(TH, "w-20 text-right")}>
            {t("PROFILE.PICKS.STATUS")}
          </th>
        </tr>
      </thead>
      <tbody>
        {props.picks.map((pick) => (
          <tr
            key={pick.id}
            className="border-foreground/6 border-b last:border-b-0"
          >
            <td className={TD}>
              <CompactMatchup event={pick} />
            </td>
            <td className={cn(TD, "hidden @md:table-cell")}>
              <div className="text-foreground/85 truncate">
                {pick.selection}
              </div>
              <MarketLabel market={pick.market} />
            </td>
            <td
              className={cn(
                TD,
                "tabular text-foreground/80 hidden text-right @md:table-cell",
              )}
            >
              {formatAmericanOdds(pick.odds)}
            </td>
            <td
              className={cn(
                TD,
                "tabular text-foreground/50 hidden text-[11px] whitespace-nowrap @2xl:table-cell",
              )}
            >
              {formatUtcShortDateTime(pick.tradedAt, locale)}
            </td>
            <td className={cn(TD, "text-right")}>
              <PickStatusBadge result={pick.result} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Row(props: { label: string; children: ReactNode }) {
  return (
    <div className="border-foreground/6 flex items-center justify-between gap-3 border-b px-3 py-2 last:border-b-0">
      <span className="text-foreground/50 shrink-0 text-[11px]">
        {props.label}
      </span>
      <span className="tabular text-foreground/85 min-w-0 truncate text-right font-mono text-[11px]">
        {props.children}
      </span>
    </div>
  );
}

function IntegrityPanel(props: { dash: LandingDash }) {
  const t = useTranslations();
  const locale = useLocale();
  const dash = props.dash;
  return (
    <Panel title={t("LANDING.DASH.INTEGRITY")} icon="shield-check">
      <Row label={t("LANDING.DASH.LOG_SIZE")}>
        {t("LANDING.DASH.ENTRIES", { count: dash.head.size })}
      </Row>
      <Row label={t("LANDING.DASH.LOG_ROOT")}>{shortHex(dash.head.root)}</Row>
      <Row label={t("LANDING.DASH.LAST_ANCHOR")}>
        {dash.anchor ? (
          <span className="inline-flex items-center gap-1.5">
            <Ago at={dash.anchor.createdAt} className="text-foreground/60" />
            <span
              className={
                dash.anchor.upgraded
                  ? "text-foreground/85"
                  : "text-foreground/45"
              }
            >
              {t(
                dash.anchor.upgraded
                  ? "LANDING.DASH.ANCHOR_CONFIRMED"
                  : "LANDING.DASH.ANCHOR_PENDING",
              )}
            </span>
          </span>
        ) : (
          t("LANDING.DASH.NO_ANCHOR")
        )}
      </Row>
      <Row label={t("LANDING.DASH.GRADED_TODAY")}>
        {formatPlainUnits(dash.gradedToday, locale)}
      </Row>
      <div className="border-foreground/6 border-t px-3 pt-2 pb-2.5">
        <span className="label-mono text-foreground/40 text-[9px]">
          {t("LANDING.DASH.SOURCES")}
        </span>
        <ul className="mt-1.5 grid gap-1">
          {dash.sources.map((source) => (
            <li
              key={source.key}
              className="flex items-center justify-between gap-2 text-[11px]"
            >
              <span className="text-foreground/75 flex items-center gap-1.5">
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    source.picks > 0 ? "bg-pick-win" : "bg-foreground/20",
                  )}
                />
                {t(SOURCE_LABEL[source.key])}
              </span>
              <span className="tabular text-foreground/45 font-mono text-[10px]">
                {source.picks > 0
                  ? t("LANDING.DASH.SOURCE_PICKS", { count: source.picks })
                  : t("LANDING.DASH.SOURCE_IDLE")}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}

function SportsPanel(props: { dash: LandingDash }) {
  const t = useTranslations();
  const locale = useLocale();
  const max = Math.max(1, ...props.dash.sports.map((sport) => sport.graded));
  return (
    <Panel title={t("LANDING.DASH.SPORTS")} icon="trophy">
      {props.dash.sports.length === 0 ? (
        <Empty>{t("PROFILE.CHART.EMPTY")}</Empty>
      ) : (
        <ul className="grid gap-2.5 px-3 py-3">
          {props.dash.sports.map((sport) => (
            <li key={sport.sportKey} className="grid gap-1">
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="text-foreground/80 flex min-w-0 items-center gap-1.5">
                  <SportIcon sportKey={sport.sportKey} className="size-3.5" />
                  <span className="truncate">
                    {t(sportLabelKey(sport.sportKey))}
                  </span>
                </span>
                <span className="tabular flex shrink-0 items-center gap-2 font-mono text-[10px]">
                  <span className="text-foreground/45">
                    {sport.wins}-{sport.losses}
                  </span>
                  <span className={signTone(sport.units)}>
                    {formatUnits(sport.units, locale)}
                  </span>
                </span>
              </div>
              <span className="bg-foreground/6 h-1 overflow-hidden rounded-full">
                <span
                  className="bg-foreground/40 block h-full rounded-full"
                  style={{ width: `${(sport.graded / max) * 100}%` }}
                />
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function OverviewView(props: { dash: LandingDash }) {
  const t = useTranslations();
  const dash = props.dash;
  return (
    <div className="grid gap-3">
      <ProfileRow dash={dash} />
      <StatGrid dash={dash} />
      <div className={cn(HAIRLINE_GRID, "@xl:grid-cols-3")}>
        <Panel
          title={t("PROFILE.CHART.TITLE")}
          icon="chart-line"
          meta={t(
            dash.curve.live
              ? "LANDING.DASH.CHART_LIVE"
              : "LANDING.DASH.CHART_HISTORY",
          )}
          className="@xl:col-span-2"
        >
          {dash.curve.points.length < 2 ? (
            <Empty>{t("PROFILE.CHART.EMPTY")}</Empty>
          ) : (
            <div className="flex flex-1 flex-col px-2 pt-3 pb-1">
              <DashChart points={dash.curve.points} />
            </div>
          )}
        </Panel>
        <IntegrityPanel dash={dash} />
      </div>
      <div className={cn(HAIRLINE_GRID, "@xl:grid-cols-3")}>
        <Panel
          title={t("LANDING.DASH.RECENT")}
          icon="lock"
          className="@xl:col-span-2"
        >
          <PickRows picks={dash.picks.slice(0, 5)} />
        </Panel>
        <SportsPanel dash={dash} />
      </div>
    </div>
  );
}

export function PicksView(props: { dash: LandingDash }) {
  const t = useTranslations();
  return (
    <div className={HAIRLINE_GRID}>
      <Panel
        title={t("PROFILE.PICKS.TITLE")}
        icon="lock"
        meta={`@${props.dash.capper.username}`}
      >
        <PickRows picks={props.dash.picks} full />
      </Panel>
    </div>
  );
}

export function HistoryView(props: { dash: LandingDash }) {
  const t = useTranslations();
  return (
    <div className={HAIRLINE_GRID}>
      <Panel
        title={t("PROFILE.HISTORY.TITLE")}
        icon="link"
        meta={t("PROFILE.HISTORY.LABEL")}
      >
        <HistoryRows picks={props.dash.history} />
      </Panel>
    </div>
  );
}

export function VerifyView(props: { dash: LandingDash }) {
  const t = useTranslations();
  const locale = useLocale();
  const head = props.dash.head;
  return (
    <div className="grid gap-3">
      <div className={cn(HAIRLINE_GRID, "@xl:grid-cols-3")}>
        <Panel
          title={t("LANDING.DASH.HEAD")}
          icon="hash"
          meta={
            head.updatedAt
              ? formatUtcShortDateTime(head.updatedAt, locale)
              : undefined
          }
          className="@xl:col-span-2"
        >
          <div className="grid gap-3 px-3 py-3">
            <div className="flex items-baseline gap-2">
              <span className="tabular text-foreground/95 text-2xl font-medium tracking-tight">
                {formatPlainUnits(head.size, locale)}
              </span>
              <span className="text-foreground/45 text-[11px]">
                {t("LANDING.DASH.LOG_SIZE")}
              </span>
            </div>
            <div className="grid gap-1">
              <span className="label-mono text-foreground/40 text-[9px]">
                {t("LANDING.DASH.LOG_ROOT")}
              </span>
              <code className="bg-muted/50 border-foreground/6 text-foreground/80 rounded-sm border px-2 py-1.5 font-mono text-[11px] break-all">
                {head.root}
              </code>
            </div>
          </div>
        </Panel>
        <IntegrityPanel dash={props.dash} />
      </div>
      <div className="border-foreground/10 bg-muted/25 flex flex-col gap-3 rounded-md border border-dashed px-4 py-3 @md:flex-row @md:items-center @md:justify-between">
        <p className="text-foreground/65 text-[12px] leading-relaxed">
          {t("LANDING.DASH.VERIFY_HINT")}
        </p>
        <Link
          href="/verify"
          className="group label-mono bg-primary text-primary-foreground inline-flex shrink-0 items-center gap-1.5 self-start rounded-md px-3 py-2 text-[10px] transition-opacity hover:opacity-90 @md:self-auto"
        >
          {t("LANDING.VERIFY.LINK")}
          <Icon
            name="arrow-right"
            className="size-3 opacity-70 transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      </div>
    </div>
  );
}
