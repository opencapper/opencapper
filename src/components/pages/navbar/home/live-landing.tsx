"use client";

import { LiveStatusBadge } from "@/components/elements/live/live-status";
import { TickText } from "@/components/elements/live/tick-cell";
import { useLiveQuery, useNow } from "@/hooks/live/use-live-query-hook";
import type { BookStatus, ValueBetList } from "@/lib/api/client";
import { ago, count } from "@/lib/format";
import { featuredGroups, groupBets, type GroupedBet } from "@/lib/group";
import { applyValueBets } from "@/lib/live/apply";
import { fetchValueBets } from "@/lib/live/actions";
import { queryKeys } from "@/lib/react-query/keys";
import { useLocale, useTranslations } from "next-intl";
import { BetShowcase } from "./bet-showcase";
import { BoardMock, DiscordMock, TrackerMock } from "./bet-mocks";

function useLandingBets(list: ValueBetList) {
  return useLiveQuery({
    queryKey: queryKeys.valueBets(),
    initialData: list,
    fetch: () => fetchValueBets(),
    topic: "value_bets",
    apply: applyValueBets,
  });
}

function Counter(props: { label: string; value: number; tone?: string }) {
  const locale = useLocale();
  return (
    <div className="bg-background/85 flex min-w-0 flex-col gap-1 px-3 py-2.5 backdrop-blur-sm">
      <span className="label-mono text-foreground/45 truncate text-[9px]">
        {props.label}
      </span>
      <span
        className={
          props.tone ??
          "tabular text-foreground/90 truncate text-lg font-medium tracking-tight"
        }
      >
        <TickText value={props.value}>{count(props.value, locale)}</TickText>
      </span>
    </div>
  );
}

export function LiveCounters(props: {
  list: ValueBetList;
  soft: number;
  now: number;
}) {
  const t = useTranslations("LANDING");
  const locale = useLocale();
  const live = useLandingBets(props.list);
  const now = useNow(props.now);
  const list = live.data ?? props.list;
  const updated = list.stats.updated_at;

  return (
    <div className="mt-8 max-w-md 2xl:max-w-none">
      <div className="bg-foreground/8 border-foreground/8 grid grid-cols-2 gap-px overflow-hidden rounded-md border 2xl:grid-cols-4">
        <Counter label={t("COUNTERS.BOOKS")} value={props.soft} />
        <Counter label={t("COUNTERS.PRICES")} value={list.stats.quotes} />
        <Counter
          label={t("COUNTERS.MATCHED")}
          value={list.stats.matched_events}
        />
        <Counter
          label={t("COUNTERS.VALUE")}
          value={groupBets(list.bets).length}
          tone="tabular text-success truncate text-lg font-medium tracking-tight"
        />
      </div>
      <p className="label-mono text-foreground/45 mt-2 flex items-center gap-1.5 text-[9px]">
        {live.status === "live" ? (
          <>
            <span className="bg-success size-1.5 animate-pulse rounded-full motion-reduce:animate-none" />
            <span className="truncate">
              {updated
                ? t("COUNTERS.UPDATED", { ago: ago(updated, now, locale) })
                : t("COUNTERS.LIVE")}
            </span>
          </>
        ) : (
          <LiveStatusBadge status={live.status} className="text-[9px]" />
        )}
      </p>
    </div>
  );
}

// The slides the server picked stay put while their prices move; a slide is only replaced once its bet is gone.
export function LiveShowcase(props: {
  list: ValueBetList;
  keys: string[];
  books: BookStatus[];
}) {
  const live = useLandingBets(props.list);
  const bets = (live.data ?? props.list).bets;
  const size = props.keys.length;
  const byKey = new Map(groupBets(bets).map((g) => [g.key, g]));
  const kept = props.keys
    .map((k) => byKey.get(k))
    .filter((g): g is GroupedBet => g !== undefined);
  const fill = featuredGroups(bets, size).filter(
    (g) => !props.keys.includes(g.key),
  );
  const slides = [...kept, ...fill].slice(0, size);

  return (
    <BetShowcase
      slides={slides.map((group) => ({
        key: group.key,
        board: <BoardMock group={group} />,
        discord: <DiscordMock group={group} />,
        tracker: <TrackerMock group={group} books={props.books} />,
      }))}
    />
  );
}
