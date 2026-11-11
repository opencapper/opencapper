"use client";

import { DataTable } from "@/components/elements/table/data-table";
import { DataTableColumnHeader } from "@/components/elements/table/data-table-column-header";
import { VendorLabel } from "@/components/elements/vendor/vendor-logo";
import type { BookStatus } from "@/lib/api/client";
import type { TableFeats } from "@/lib/config/table-features";
import { bookName } from "@/lib/config/vendor-registry";
import { ago, count, type Translate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import { useLocale, useTranslations } from "next-intl";

const STALE_SECS = 180;
const RIGHT = { headerClassName: "text-right", cellClassName: "text-right" };

function role(b: BookStatus, t: Translate): string {
  if (b.book === "pinnacle") return t("BOOKS.ROLE_SHARP");
  if (b.commission) return t("BOOKS.ROLE_EXCHANGE", { commission: (b.commission * 100).toFixed(0) });
  return t("BOOKS.ROLE_BOOK");
}

function columns(t: Translate, locale: string, now: number): ColumnDef<TableFeats, BookStatus>[] {
  return [
    {
      id: "book",
      accessorFn: (b) => bookName(b.book),
      header: (ctx) => <DataTableColumnHeader column={ctx.column} title="BOOKS.COL_BOOK" />,
      size: 200,
      cell: (ctx) => {
        const b = ctx.row.original;
        const age = b.newest_seen_at ? (now - new Date(b.newest_seen_at).getTime()) / 1000 : Infinity;
        return (
          <span className="flex items-center gap-2 whitespace-nowrap">
            <span className={cn("inline-block size-2 rounded-full", age < STALE_SECS ? "bg-success" : "bg-warning")} />
            <VendorLabel vendorKey={b.book} size={20} />
          </span>
        );
      },
    },
    {
      id: "events",
      accessorFn: (b) => b.events,
      header: (ctx) => <DataTableColumnHeader column={ctx.column} title="BOOKS.COL_GAMES" className="justify-end" />,
      size: 90,
      meta: RIGHT,
      cell: (ctx) => <span className="tabular">{count(ctx.row.original.events, locale)}</span>,
    },
    {
      id: "quotes",
      accessorFn: (b) => b.quotes,
      header: (ctx) => <DataTableColumnHeader column={ctx.column} title="BOOKS.COL_PRICES" className="justify-end" />,
      size: 100,
      meta: RIGHT,
      cell: (ctx) => <span className="tabular">{count(ctx.row.original.quotes, locale)}</span>,
    },
    {
      id: "matched",
      accessorFn: (b) => b.matched_events,
      header: (ctx) => <DataTableColumnHeader column={ctx.column} title="BOOKS.COL_MATCHED" className="justify-end" />,
      size: 100,
      meta: RIGHT,
      cell: (ctx) => (
        <span className="tabular text-muted-foreground" title={t("BOOKS.MATCHED_HINT")}>
          {ctx.row.original.book === "pinnacle" ? "" : count(ctx.row.original.matched_events, locale)}
        </span>
      ),
    },
    {
      id: "gap",
      accessorFn: (b) => b.median_implied_gap ?? Infinity,
      header: (ctx) => <DataTableColumnHeader column={ctx.column} title="BOOKS.COL_GAP" className="justify-end" />,
      size: 120,
      meta: RIGHT,
      cell: (ctx) => {
        const gap = ctx.row.original.median_implied_gap;
        return (
          <span className="tabular text-muted-foreground" title={t("BOOKS.GAP_HINT")}>
            {gap === null || gap === undefined ? "" : `${(gap * 100).toFixed(2)}%`}
          </span>
        );
      },
    },
    {
      id: "seen",
      accessorFn: (b) => (b.newest_seen_at ? new Date(b.newest_seen_at).getTime() : 0),
      header: (ctx) => <DataTableColumnHeader column={ctx.column} title="BOOKS.COL_SEEN" />,
      size: 130,
      cell: (ctx) => {
        const seen = ctx.row.original.newest_seen_at;
        return (
          <span className="text-muted-foreground whitespace-nowrap">
            {seen ? ago(seen, now, locale) : t("FORMAT.NEVER")}
          </span>
        );
      },
    },
    {
      id: "role",
      accessorFn: (b) => role(b, t),
      enableSorting: false,
      header: (ctx) => <DataTableColumnHeader column={ctx.column} title="BOOKS.COL_ROLE" />,
      size: 220,
      cell: (ctx) => <span className="text-muted-foreground whitespace-nowrap">{role(ctx.row.original, t)}</span>,
    },
  ];
}

export function BooksTable(props: { books: BookStatus[]; now: number }) {
  const t = useTranslations();
  const locale = useLocale();
  return <DataTable id="BOOKMAKERS" data={props.books} columns={columns(t, locale, props.now)} localSorting />;
}
