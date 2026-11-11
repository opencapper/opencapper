"use client";

import { ConfidenceBadge } from "@/components/elements/odds/confidence-badge";
import { Ev } from "@/components/elements/odds/ev";
import { Matchup } from "@/components/elements/participant/matchup";
import { DataTable } from "@/components/elements/table/data-table";
import { VendorLabel } from "@/components/elements/vendor/vendor-logo";
import { DataTableColumnHeader } from "@/components/elements/table/data-table-column-header";
import type { LedgerEntry } from "@/lib/api/client";
import type { TableFeats } from "@/lib/config/table-features";
import { bookName } from "@/lib/config/vendor-registry";
import { kickoff, marketName, odds, sideName, type Translate } from "@/lib/format";
import type { ColumnDef } from "@tanstack/react-table";
import { useLocale, useTranslations } from "next-intl";

const RIGHT = { headerClassName: "text-right", cellClassName: "text-right" };

function statusLabel(s: LedgerEntry["status"], t: Translate): string {
  if (s === "open") return t("PROOF.STATUS_OPEN");
  if (s === "closed") return t("PROOF.STATUS_CLOSED");
  return t("PROOF.STATUS_NO_CLOSE");
}

function columns(t: Translate, locale: string): ColumnDef<TableFeats, LedgerEntry>[] {
  return [
    {
      id: "alerted",
      accessorFn: (e) => new Date(e.alerted_at).getTime(),
      header: (ctx) => <DataTableColumnHeader column={ctx.column} title="PROOF.COL_ALERTED" />,
      size: 120,
      cell: (ctx) => (
        <span className="text-muted-foreground text-xs whitespace-nowrap">
          {kickoff(ctx.row.original.alerted_at, locale)}
        </span>
      ),
    },
    {
      id: "bet",
      accessorFn: (e) => sideName(e, t),
      enableSorting: false,
      header: (ctx) => <DataTableColumnHeader column={ctx.column} title="PROOF.COL_BET" />,
      size: 230,
      meta: { cellClassName: "whitespace-normal" },
      cell: (ctx) => {
        const e = ctx.row.original;
        return (
          <div className="min-w-48">
            <div>{sideName(e, t)}</div>
            <div className="text-muted-foreground text-[11px]">{marketName(e, t)}</div>
            <Matchup event={e} size="xs" className="text-muted-foreground mt-1 text-[11px]" />
          </div>
        );
      },
    },
    {
      id: "book",
      accessorFn: (e) => bookName(e.book),
      header: (ctx) => <DataTableColumnHeader column={ctx.column} title="PROOF.COL_BOOK" />,
      size: 150,
      cell: (ctx) => (
        <div className="flex flex-col items-start gap-1 whitespace-nowrap">
          <VendorLabel vendorKey={ctx.row.original.book} />
          <ConfidenceBadge value={ctx.row.original.confidence} />
        </div>
      ),
    },
    {
      id: "odds",
      accessorFn: (e) => Number(e.alert_odds),
      header: (ctx) => <DataTableColumnHeader column={ctx.column} title="PROOF.COL_ODDS" className="justify-end" />,
      size: 80,
      meta: RIGHT,
      cell: (ctx) => <span className="tabular">{odds(ctx.row.original.alert_odds)}</span>,
    },
    {
      id: "fair",
      accessorFn: (e) => Number(e.alert_fair_odds),
      header: (ctx) => <DataTableColumnHeader column={ctx.column} title="PROOF.COL_FAIR_THEN" className="justify-end" />,
      size: 90,
      meta: RIGHT,
      cell: (ctx) => <span className="tabular text-muted-foreground">{odds(ctx.row.original.alert_fair_odds)}</span>,
    },
    {
      id: "ev",
      accessorFn: (e) => e.alert_ev,
      header: (ctx) => <DataTableColumnHeader column={ctx.column} title="PROOF.COL_EV_THEN" className="justify-end" />,
      size: 90,
      meta: RIGHT,
      cell: (ctx) => <Ev value={ctx.row.original.alert_ev} />,
    },
    {
      id: "close",
      accessorFn: (e) => Number(e.closing_fair_odds ?? e.last_fair_odds ?? 0),
      header: (ctx) => <DataTableColumnHeader column={ctx.column} title="PROOF.COL_FAIR_CLOSE" className="justify-end" />,
      size: 100,
      meta: RIGHT,
      cell: (ctx) => {
        const e = ctx.row.original;
        return (
          <span className="tabular text-muted-foreground whitespace-nowrap">
            {e.closing_fair_odds
              ? odds(e.closing_fair_odds)
              : e.last_fair_odds
                ? t("PROOF.FAIR_NOW", { odds: odds(e.last_fair_odds) })
                : t("FORMAT.NA")}
          </span>
        );
      },
    },
    {
      id: "clv",
      accessorFn: (e) => e.clv ?? -Infinity,
      header: (ctx) => <DataTableColumnHeader column={ctx.column} title="PROOF.COL_CLV" className="justify-end" />,
      size: 80,
      meta: RIGHT,
      cell: (ctx) => <Ev value={ctx.row.original.clv} />,
    },
    {
      id: "status",
      accessorFn: (e) => e.status,
      header: (ctx) => <DataTableColumnHeader column={ctx.column} title="PROOF.COL_STATUS" />,
      size: 110,
      cell: (ctx) => (
        <span className="text-muted-foreground text-xs whitespace-nowrap">
          {statusLabel(ctx.row.original.status, t)}
        </span>
      ),
    },
  ];
}

export function LedgerTable(props: { entries: LedgerEntry[] }) {
  const t = useTranslations();
  const locale = useLocale();
  return (
    <DataTable
      id="PROOF_LEDGER"
      data={props.entries}
      columns={columns(t, locale)}
      localSorting
      windowVirtual
      estimateRowHeight={76}
      emptyState={<span className="text-muted-foreground text-sm">{t("PROOF.EMPTY")}</span>}
    />
  );
}
