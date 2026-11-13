"use client";

import { LiveStatusBadge } from "@/components/elements/live/live-status";
import { Unreachable } from "@/components/elements/odds/panel";
import { StatCard, StatGrid } from "@/components/elements/odds/stat-card";
import { PageHeading } from "@/components/elements/page/page-heading";
import { PageShell } from "@/components/elements/page/page-shell";
import { ResultStats } from "@/components/elements/odds/result-stats";
import { Icon } from "@/components/ui/icon";
import type { LedgerView } from "@/lib/api/client";
import type { IconName } from "@/lib/config/icon-map";
import { count, percent } from "@/lib/format";
import { useLiveQuery } from "@/hooks/live/use-live-query-hook";
import { applyLedger } from "@/lib/live/apply";
import { fetchLedger } from "@/lib/live/actions";
import { queryKeys } from "@/lib/react-query/keys";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { LedgerTable } from "./ledger-table";

type View = "clv" | "results";

const VIEWS: { key: View; label: "VIEW_CLV" | "VIEW_RESULTS"; icon: IconName }[] = [
  { key: "clv", label: "VIEW_CLV", icon: "chart-line" },
  { key: "results", label: "VIEW_RESULTS", icon: "trophy" },
];

export function Proof(props: { data?: LedgerView }) {
  const t = useTranslations();
  const tp = useTranslations("PROOF");
  const locale = useLocale();
  const view = useState<View>("clv");
  const live = useLiveQuery({
    queryKey: queryKeys.ledger(),
    initialData: props.data ?? null,
    fetch: fetchLedger,
    topic: "ledger",
    apply: applyLedger,
  });
  const data = live.data;
  const heading = (
    <PageHeading
      className="mb-0"
      status={<LiveStatusBadge status={live.status} />}
      label={tp("LABEL")}
      title={tp("HEADING")}
      description={tp("SUBHEADING")}
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
  const s = data.stats;
  const beat = s.closed > 0 ? s.beat_close / s.closed : undefined;
  const clv = s.avg_clv ?? undefined;

  return (
    <PageShell>
      {heading}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="bg-muted inline-flex w-fit items-center rounded-lg p-[3px]" aria-label={tp("VIEW")}>
          {VIEWS.map((v) => (
            <button
              key={v.key}
              type="button"
              aria-pressed={view[0] === v.key}
              onClick={() => view[1](v.key)}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-md border border-transparent px-3 text-sm font-medium whitespace-nowrap transition-all",
                view[0] === v.key
                  ? "bg-background text-foreground dark:border-input dark:bg-input/30 shadow-sm"
                  : "text-foreground/60 hover:text-foreground",
              )}
            >
              <Icon name={v.icon} className="size-4" />
              {tp(v.label)}
            </button>
          ))}
        </nav>
        {view[0] === "results" && <p className="text-muted-foreground max-w-md text-xs">{tp("RESULTS_NOTE")}</p>}
      </div>
      {view[0] === "clv" ? (
        <StatGrid className="sm:grid-cols-5">
          <StatCard
            icon="trending-up"
            label={tp("STAT_CLV")}
            value={clv === undefined ? t("FORMAT.NA") : percent(clv)}
            tone={clv ? (clv > 0 ? "win" : "bad") : undefined}
            hint={tp("CLV_HINT")}
          />
          <StatCard
            icon="target"
            label={tp("STAT_BEAT")}
            value={beat === undefined ? t("FORMAT.NA") : `${(beat * 100).toFixed(0)}%`}
            tone={beat === undefined ? undefined : beat >= 0.5 ? "win" : "bad"}
          />
          <StatCard icon="shield-check" label={tp("STAT_ALERTS")} value={count(s.alerts, locale)} />
          <StatCard icon="clock" label={tp("STAT_OPEN")} value={count(s.open, locale)} />
          <StatCard icon="circle-check" label={tp("STAT_CLOSED")} value={count(s.closed, locale)} />
        </StatGrid>
      ) : (
        <ResultStats stats={s} />
      )}
      <LedgerTable entries={data.entries} />
    </PageShell>
  );
}
