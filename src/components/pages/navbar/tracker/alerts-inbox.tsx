import { TrackBet } from "@/components/elements/account/track-bet";
import { ConfidenceBadge } from "@/components/elements/odds/confidence-badge";
import { Ev } from "@/components/elements/odds/ev";
import { LedgerResult } from "@/components/elements/odds/ledger-result";
import { Unreachable } from "@/components/elements/odds/panel";
import { ResultStats, type ResultTotals } from "@/components/elements/odds/result-stats";
import { Matchup } from "@/components/elements/participant/matchup";
import { VendorLabel } from "@/components/elements/vendor/vendor-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { DiscordIcon, TelegramIcon } from "@/components/ui/local-icons";
import { Link } from "@/i18n/navigation";
import type { DeliveredAlert, LedgerEntry } from "@/lib/api/client";
import { feeOf, kickoff, marketName, odds, sideName, type BookFee, type StakePlan } from "@/lib/format";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { TrackerShell } from "./tracker";

type Channel = DeliveredAlert["channel"];

// One ledger entry can reach the user on both channels; it is one alert in the inbox.
type InboxItem = { id: string; deliveredAt: string; channels: Channel[]; entry?: LedgerEntry | null };

function group(alerts: DeliveredAlert[]): InboxItem[] {
  const items = new Map<string, InboxItem>();
  for (const a of alerts) {
    const item = items.get(a.ledger_id);
    if (item) {
      if (!item.channels.includes(a.channel)) item.channels.push(a.channel);
      continue;
    }
    items.set(a.ledger_id, { id: a.ledger_id, deliveredAt: a.delivered_at, channels: [a.channel], entry: a.entry });
  }
  return [...items.values()];
}

function totals(entries: LedgerEntry[]): ResultTotals {
  const settled = entries.filter((e) => e.result);
  const units = settled.reduce((sum, e) => sum + (e.profit_units ?? 0), 0);
  const tally = (r: LedgerEntry["result"]) => settled.filter((e) => e.result === r).length;
  return {
    closed: entries.filter((e) => e.status !== "open").length,
    settled: settled.length,
    won: tally("won"),
    lost: tally("lost"),
    push: tally("push"),
    half_won: tally("half_won"),
    half_lost: tally("half_lost"),
    units,
    roi: settled.length > 0 ? units / settled.length : null,
  };
}

function ChannelTag(props: { channel: Channel }) {
  const t = useTranslations("ALERTS");
  return (
    <span className="text-muted-foreground inline-flex items-center gap-1 text-[11px]">
      {props.channel === "dm" ? <DiscordIcon className="size-3" /> : <TelegramIcon className="size-3" />}
      {props.channel === "dm" ? t("DISCORD_DM") : t("TELEGRAM")}
    </span>
  );
}

function Figure(props: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="eyebrow text-foreground/45 text-[9px]">{props.label}</span>
      <span className="text-sm">{props.children}</span>
    </div>
  );
}

function AlertRow(props: { item: InboxItem; fees: BookFee[]; plan: StakePlan }) {
  const t = useTranslations();
  const locale = useLocale();
  const e = props.item.entry;
  return (
    <li className="bg-card flex flex-col gap-3 rounded-lg border p-4 lg:flex-row lg:items-center lg:gap-6">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-muted-foreground text-[11px] whitespace-nowrap">
            {t("ALERTS.SENT", { time: kickoff(props.item.deliveredAt, locale) })}
          </span>
          {props.item.channels.map((c) => (
            <ChannelTag key={c} channel={c} />
          ))}
        </div>
        {e ? (
          <>
            <div className="font-medium">{sideName(e, t)}</div>
            <div className="text-muted-foreground text-xs">
              {marketName(e, t)}
              <span className="ml-2 font-mono text-[11px]">{kickoff(e.starts_at, locale)}</span>
            </div>
            <Matchup event={e} size="xs" className="text-muted-foreground mt-0.5 text-xs" />
          </>
        ) : (
          <p className="text-muted-foreground text-sm">{t("ALERTS.GONE")}</p>
        )}
      </div>
      {e && (
        <>
          <div className="grid grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))] gap-4 lg:shrink-0 lg:grid-cols-[8.5rem_4rem_4.5rem_4rem]">
            <Figure label={t("PROOF.COL_BOOK")}>
              <span className="flex flex-col items-start gap-1">
                <VendorLabel vendorKey={e.book} size={14} className="whitespace-nowrap" />
                <ConfidenceBadge value={e.confidence} />
              </span>
            </Figure>
            <Figure label={t("PROOF.COL_ODDS")}>
              <span className="tabular">{odds(e.alert_odds)}</span>
            </Figure>
            <Figure label={t("PROOF.COL_EV_THEN")}>
              <Ev value={e.alert_ev} />
            </Figure>
            <Figure label={t("PROOF.COL_CLV")}>
              <Ev value={e.clv} />
            </Figure>
          </div>
          <div className="flex items-center justify-between gap-3 lg:w-72 lg:shrink-0">
            <LedgerResult entry={e} className="items-start lg:items-end" />
            <TrackBet
              source={{
                book: e.book,
                league: e.league,
                home: e.home,
                away: e.away,
                starts_at: e.starts_at,
                market: e.market,
                period: e.period,
                line: e.line,
                side: e.side,
                fair_odds: e.alert_fair_odds,
                sharp_key: e.sharp_key,
                sport: e.sport,
              }}
              odds={e.alert_odds}
              probability={1 / Number(e.alert_fair_odds)}
              fee={feeOf(props.fees, e.book)}
              title={`${sideName(e, t)}, ${marketName(e, t)}`}
              plan={props.plan}
            />
          </div>
        </>
      )}
    </li>
  );
}

export function AlertsInbox(props: { alerts?: DeliveredAlert[]; enabled: boolean; fees: BookFee[]; plan: StakePlan }) {
  const t = useTranslations("ALERTS");
  if (!props.alerts) {
    return (
      <TrackerShell active="/tracker/alerts">
        <Unreachable />
      </TrackerShell>
    );
  }
  const items = group(props.alerts);
  const entries = items.flatMap((i) => (i.entry ? [i.entry] : []));
  return (
    <TrackerShell active="/tracker/alerts">
      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Icon name="bell" className="text-muted-foreground size-8" />
            <p className="font-medium">{t("INBOX_EMPTY")}</p>
            <p className="text-muted-foreground max-w-md text-sm">
              {props.enabled ? t("INBOX_EMPTY_ON") : t("INBOX_EMPTY_OFF")}
            </p>
            <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/settings" />}>
              <Icon name="settings-2" />
              {t("INBOX_SETTINGS")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-muted-foreground text-sm">{t("INBOX_COUNT", { count: items.length })}</p>
            <Link
              href="/settings"
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
            >
              <Icon name="settings-2" className="size-3.5" />
              {t("INBOX_SETTINGS")}
            </Link>
          </div>
          <ResultStats stats={totals(entries)} />
          <ul className="flex flex-col gap-3">
            {items.map((item) => (
              <AlertRow key={item.id} item={item} fees={props.fees} plan={props.plan} />
            ))}
          </ul>
        </>
      )}
    </TrackerShell>
  );
}
