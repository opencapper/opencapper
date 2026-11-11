import { StatCard, StatGrid } from "@/components/elements/odds/stat-card";
import type { LedgerStats } from "@/lib/api/client";
import { count, percent, units } from "@/lib/format";
import { useLocale, useTranslations } from "next-intl";

export type ResultTotals = Pick<
  LedgerStats,
  "closed" | "settled" | "won" | "lost" | "push" | "half_won" | "half_lost" | "units" | "roi"
>;

export function ResultStats(props: { stats: ResultTotals }) {
  const t = useTranslations();
  const tp = useTranslations("PROOF");
  const locale = useLocale();
  const s = props.stats;
  return (
    <StatGrid className="sm:grid-cols-4">
      <StatCard
        icon="circle-check"
        label={tp("STAT_SETTLED")}
        value={count(s.settled, locale)}
        hint={tp("SETTLED_HINT", { closed: count(s.closed, locale) })}
      />
      <StatCard
        icon="trophy"
        label={tp("STAT_RECORD")}
        value={tp("RECORD_VALUE", { won: count(s.won, locale), lost: count(s.lost, locale), push: count(s.push, locale) })}
        hint={tp("RECORD_HINT", { half_won: count(s.half_won, locale), half_lost: count(s.half_lost, locale) })}
      />
      <StatCard
        icon="coins"
        label={tp("STAT_UNITS")}
        value={s.settled > 0 ? tp("UNITS_VALUE", { units: units(s.units) }) : t("FORMAT.NA")}
        tone={s.settled > 0 && s.units !== 0 ? (s.units > 0 ? "win" : "bad") : undefined}
        hint={tp("UNITS_HINT")}
      />
      <StatCard
        icon="percent"
        label={tp("STAT_ROI")}
        value={s.roi === null || s.roi === undefined ? t("FORMAT.NA") : percent(s.roi)}
        tone={s.roi ? (s.roi > 0 ? "win" : "bad") : undefined}
        hint={tp("ROI_HINT")}
      />
    </StatGrid>
  );
}
