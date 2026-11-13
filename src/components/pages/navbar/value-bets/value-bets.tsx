"use client";

import { LiveStatusBadge } from "@/components/elements/live/live-status";
import { PriceAge } from "@/components/elements/live/price-age";
import { Chip, FilterRow } from "@/components/elements/odds/filter-chips";
import { Unreachable } from "@/components/elements/odds/panel";
import { StatCard, StatGrid } from "@/components/elements/odds/stat-card";
import { PageHeading } from "@/components/elements/page/page-heading";
import { PageShell } from "@/components/elements/page/page-shell";
import { VendorLabel } from "@/components/elements/vendor/vendor-logo";
import { Icon } from "@/components/ui/icon";
import type { Settings, ValueBetList } from "@/lib/api/client";
import {
  count,
  fractionLabel,
  money,
  query,
  type BookFee,
  type StakePlan,
} from "@/lib/format";
import { groupBets } from "@/lib/group";
import { useLiveQuery, useNow } from "@/hooks/live/use-live-query-hook";
import { applyValueBets } from "@/lib/live/apply";
import { fetchValueBets } from "@/lib/live/actions";
import { queryKeys } from "@/lib/react-query/keys";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { MyBooks } from "./my-books";
import { ValueBetsTable } from "./value-bets-table";

type Filters = {
  book?: string;
  min?: string;
  market?: string;
  solid?: string;
  all?: string;
};

const MIN_EV = [
  { label: undefined, value: undefined },
  { label: "+1%", value: "0.01" },
  { label: "+2%", value: "0.02" },
  { label: "+5%", value: "0.05" },
];

const MARKETS = [
  { key: "ALL", value: undefined },
  { key: "THREE_WAY", value: "three_way" },
  { key: "TOTAL", value: "total" },
  { key: "ASIAN_HANDICAP", value: "asian_handicap" },
  { key: "TWO_WAY", value: "two_way" },
] as const;

export function ValueBets(props: {
  data?: ValueBetList;
  filters: Filters;
  now: number;
  plan?: StakePlan;
  settings?: Settings;
  preferred: string[];
  askBooks: boolean;
  fees: BookFee[];
}) {
  const t = useTranslations();
  const locale = useLocale();
  const f = props.filters;
  const editing = useState(false);
  const live = useLiveQuery({
    queryKey: queryKeys.valueBets(f.book, f.min),
    initialData: props.data ?? null,
    fetch: () => fetchValueBets(f.book, f.min),
    topic: "value_bets",
    filters: { book: f.book, min_ev: f.min ? Number(f.min) : undefined },
    apply: applyValueBets,
  });
  const data = live.data;
  const now = useNow(props.now);

  const heading = (
    <PageHeading
      className="mb-0"
      status={<LiveStatusBadge status={live.status} />}
      label={t("VALUE_BETS.LABEL")}
      title={t("VALUE_BETS.HEADING")}
      description={t("VALUE_BETS.LEAD")}
    />
  );
  if (!data) {
    return (
      <PageShell>
        {heading}
        <Unreachable />
      </PageShell>
    );
  }

  const allBooks = props.fees
    .map((b) => b.book)
    .filter((b) => b !== "pinnacle")
    .sort();
  const mine = props.preferred.length > 0 && !f.book && !f.all;
  const filtered = data.bets
    .filter((b) => !f.market || b.market === f.market)
    .filter((b) => !f.solid || b.confidence !== "low")
    .filter((b) => !mine || props.preferred.includes(b.book));
  const groups = groupBets(filtered);
  const link = (patch: Filters) => query("/value-bets", { ...f, ...patch });
  const picker = props.askBooks || editing[0];

  return (
    <PageShell>
      {heading}

      {picker && (
        <MyBooks
          key={props.preferred.join(",")}
          mode={props.askBooks ? "prompt" : "edit"}
          books={allBooks}
          selected={props.preferred}
          settings={props.settings}
          onDone={() => editing[1](false)}
        />
      )}

      <StatGrid className="sm:grid-cols-4">
        <StatCard
          label={t("VALUE_BETS.STAT_SELECTIONS")}
          value={count(groups.length, locale)}
        />
        <StatCard
          label={t("VALUE_BETS.STAT_MATCHED")}
          value={`${count(data.stats.matched_events, locale)} / ${count(data.stats.book_events, locale)}`}
        />
        <StatCard
          label={t("VALUE_BETS.STAT_COMPARED")}
          value={count(data.stats.compared_prices, locale)}
        />
        <StatCard
          label={t("COMMON.UPDATED")}
          value={
            data.stats.updated_at ? (
              <PriceAge
                iso={data.stats.updated_at}
                serverNow={props.now}
                className="text-foreground text-xl"
              />
            ) : (
              t("FORMAT.NEVER")
            )
          }
        />
      </StatGrid>

      <div className="flex flex-col gap-2">
        {!picker && (
          <FilterRow label={t("VALUE_BETS.FILTER_BOOK")}>
            {props.preferred.length > 0 && (
              <Chip
                active={mine}
                href={link({ book: undefined, all: undefined })}
              >
                {t("VALUE_BETS.MY_BOOKS_COUNT", {
                  count: String(props.preferred.length),
                })}
              </Chip>
            )}
            <Chip
              active={!f.book && !mine}
              href={link({
                book: undefined,
                all: props.preferred.length > 0 ? "1" : undefined,
              })}
            >
              {t("VALUE_BETS.ALL_BOOKS")}
            </Chip>
            {(mine ? props.preferred.slice().sort() : allBooks).map((b) => (
              <Chip
                key={b}
                active={f.book === b}
                href={link({ book: b, all: undefined })}
              >
                <VendorLabel vendorKey={b} size={14} />
              </Chip>
            ))}
            <button
              type="button"
              onClick={() => editing[1](true)}
              className="text-primary inline-flex items-center gap-1 px-1.5 text-xs font-medium hover:underline"
            >
              <Icon name="settings-2" className="size-3.5" />
              {props.preferred.length > 0
                ? t("VALUE_BETS.MY_BOOKS_EDIT")
                : t("VALUE_BETS.MY_BOOKS_SET")}
            </button>
          </FilterRow>
        )}
        <FilterRow label={t("VALUE_BETS.FILTER_MARKET")}>
          {MARKETS.map((m) => (
            <Chip
              key={m.key}
              active={f.market === m.value}
              href={link({ market: m.value })}
            >
              {m.key === "ALL"
                ? t("COMMON.ALL")
                : t(`VALUE_BETS.MARKET_${m.key}`)}
            </Chip>
          ))}
        </FilterRow>
        <FilterRow label={t("VALUE_BETS.FILTER_MIN_EV")}>
          {MIN_EV.map((m) => (
            <Chip
              key={m.value ?? "all"}
              active={f.min === m.value}
              href={link({ min: m.value })}
            >
              {m.label ?? t("COMMON.ALL")}
            </Chip>
          ))}
          <span className="bg-border mx-2 h-4 w-px" />
          <Chip
            active={!!f.solid}
            href={link({ solid: f.solid ? undefined : "1" })}
          >
            {t("VALUE_BETS.HIDE_LOW")}
          </Chip>
        </FilterRow>
      </div>

      <ValueBetsTable
        groups={groups}
        scope={`${f.book}|${f.min}|${f.market}|${f.solid}|${mine}`}
        now={now}
        plan={props.plan}
        fees={props.fees}
      />

      <div className="text-muted-foreground grid gap-3 text-xs leading-relaxed sm:grid-cols-3">
        <p>{t("VALUE_BETS.NOTE_FAIR")}</p>
        <p>{t("VALUE_BETS.NOTE_CONFIDENCE")}</p>
        <p>
          {props.plan
            ? t("VALUE_BETS.NOTE_STAKE_USER", {
                fraction: fractionLabel(props.plan.fraction),
                bankroll: money(props.plan.bankroll, locale),
              })
            : t("VALUE_BETS.NOTE_STAKE")}
        </p>
      </div>
    </PageShell>
  );
}
