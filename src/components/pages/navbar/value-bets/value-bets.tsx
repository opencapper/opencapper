import { AutoRefresh } from "@/components/elements/odds/auto-refresh";
import { Chip, FilterRow } from "@/components/elements/odds/filter-chips";
import { Unreachable } from "@/components/elements/odds/panel";
import { StatCard, StatGrid } from "@/components/elements/odds/stat-card";
import { PageHeading } from "@/components/elements/page/page-heading";
import { PageShell } from "@/components/elements/page/page-shell";
import type { ValueBetList } from "@/lib/api/client";
import { ago, BANKROLL, bookName, count, query } from "@/lib/format";
import { groupBets } from "@/lib/group";
import { useLocale, useTranslations } from "next-intl";
import { ValueBetsTable } from "./value-bets-table";

type Filters = {
  book?: string;
  min?: string;
  market?: string;
  solid?: string;
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

export function ValueBets(props: { data?: ValueBetList; filters: Filters; now: number }) {
  const t = useTranslations();
  const locale = useLocale();
  const data = props.data;
  const f = props.filters;

  const heading = (
    <PageHeading
      className="mb-0"
      label={t("VALUE_BETS.LABEL")}
      title={t("VALUE_BETS.HEADING")}
      description={t("VALUE_BETS.SUBHEADING")}
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

  const filtered = data.bets
    .filter((b) => !f.market || b.market === f.market)
    .filter((b) => !f.solid || b.confidence !== "low");
  const groups = groupBets(filtered);
  const books = Object.keys(data.stats.books)
    .filter((b) => b !== "pinnacle")
    .sort();
  const link = (patch: Filters) => query("/value-bets", { ...f, ...patch });

  return (
    <PageShell>
      <AutoRefresh seconds={20} />
      {heading}

      <StatGrid className="sm:grid-cols-4">
        <StatCard icon="trending-up" label={t("VALUE_BETS.STAT_SELECTIONS")} value={count(groups.length, locale)} />
        <StatCard
          icon="target"
          label={t("VALUE_BETS.STAT_MATCHED")}
          value={`${count(data.stats.matched_events, locale)} / ${count(data.stats.book_events, locale)}`}
        />
        <StatCard icon="hash" label={t("VALUE_BETS.STAT_COMPARED")} value={count(data.stats.compared_prices, locale)} />
        <StatCard
          icon="clock"
          label={t("COMMON.UPDATED")}
          value={data.stats.updated_at ? ago(data.stats.updated_at, props.now, locale) : t("FORMAT.NEVER")}
        />
      </StatGrid>

      <div className="flex flex-col gap-2">
        <FilterRow label={t("VALUE_BETS.FILTER_BOOK")}>
          <Chip active={!f.book} href={link({ book: undefined })}>
            {t("COMMON.ALL")}
          </Chip>
          {books.map((b) => (
            <Chip key={b} active={f.book === b} href={link({ book: b })}>
              {bookName(b)}
            </Chip>
          ))}
        </FilterRow>
        <FilterRow label={t("VALUE_BETS.FILTER_MARKET")}>
          {MARKETS.map((m) => (
            <Chip key={m.key} active={f.market === m.value} href={link({ market: m.value })}>
              {m.key === "ALL" ? t("COMMON.ALL") : t(`VALUE_BETS.MARKET_${m.key}`)}
            </Chip>
          ))}
        </FilterRow>
        <FilterRow label={t("VALUE_BETS.FILTER_MIN_EV")}>
          {MIN_EV.map((m) => (
            <Chip key={m.value ?? "all"} active={f.min === m.value} href={link({ min: m.value })}>
              {m.label ?? t("COMMON.ALL")}
            </Chip>
          ))}
          <span className="bg-border mx-2 h-4 w-px" />
          <Chip active={!!f.solid} href={link({ solid: f.solid ? undefined : "1" })}>
            {t("VALUE_BETS.HIDE_LOW")}
          </Chip>
        </FilterRow>
      </div>

      <ValueBetsTable groups={groups} now={props.now} />

      <div className="text-muted-foreground grid gap-3 text-xs leading-relaxed sm:grid-cols-3">
        <p>{t("VALUE_BETS.NOTE_FAIR")}</p>
        <p>{t("VALUE_BETS.NOTE_CONFIDENCE")}</p>
        <p>{t("VALUE_BETS.NOTE_STAKE", { bankroll: String(BANKROLL) })}</p>
      </div>
    </PageShell>
  );
}
