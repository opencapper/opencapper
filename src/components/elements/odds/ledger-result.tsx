import { ResultBadge } from "@/components/elements/odds/result-badge";
import type { LedgerEntry } from "@/lib/api/client";
import { score, units } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export function unitsTone(x: number | null | undefined): string {
  if (x === null || x === undefined || x === 0) return "text-muted-foreground";
  return x > 0 ? "text-success" : "text-destructive";
}

export function LedgerResult(props: { entry: LedgerEntry; className?: string }) {
  const t = useTranslations();
  const e = props.entry;
  if (!e.result) {
    const reason =
      e.status === "open" ? t("FORMAT.NA") : e.result_missing ? t("PROOF.RESULT_MISSING") : t("PROOF.RESULT_PENDING");
    return <span className={cn("text-muted-foreground text-xs whitespace-nowrap", props.className)}>{reason}</span>;
  }
  const final = score(e);
  return (
    <span className={cn("inline-flex flex-col items-end gap-0.5 whitespace-nowrap", props.className)}>
      <ResultBadge value={e.result} />
      <span className="text-muted-foreground tabular text-[11px]">
        {final && <span className="mr-1.5">{final}</span>}
        {e.profit_units !== null && e.profit_units !== undefined && (
          <span className={unitsTone(e.profit_units)}>{t("PROOF.UNITS_VALUE", { units: units(e.profit_units) })}</span>
        )}
      </span>
    </span>
  );
}
