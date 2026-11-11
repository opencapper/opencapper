"use client";

import { ConfidenceBadge } from "@/components/elements/odds/confidence-badge";
import { Ev } from "@/components/elements/odds/ev";
import { DataTable } from "@/components/elements/table/data-table";
import { DataTableColumnHeader } from "@/components/elements/table/data-table-column-header";
import { Link } from "@/i18n/navigation";
import type { TableFeats } from "@/lib/config/table-features";
import { ago, BANKROLL, bookName, kelly, KELLY_FRACTION, kickoff, marketName, money, odds, sideName, until, type Translate } from "@/lib/format";
import type { GroupedBet } from "@/lib/group";
import type { ColumnDef } from "@tanstack/react-table";
import { useLocale, useTranslations } from "next-intl";

const RIGHT = { headerClassName: "text-right", cellClassName: "text-right" };
const CONFIDENCE_ORDER = { high: 3, medium: 2, low: 1, check: 0 };

function stakeOf(g: GroupedBet): number {
  return kelly(Number(g.best.odds), g.best.fair_probability, KELLY_FRACTION) * BANKROLL;
}

function columns(t: Translate, locale: string, now: number): ColumnDef<TableFeats, GroupedBet>[] {
  return [
    {
      id: "ev",
      accessorFn: (g) => g.best.ev,
      header: (ctx) => <DataTableColumnHeader column={ctx.column} title="VALUE_BETS.COL_EV" />,
      size: 96,
      cell: (ctx) => {
        const b = ctx.row.original.best;
        return (
          <Link href={`/value-bets/${encodeURIComponent(b.id)}`} className="block">
            <Ev value={b.ev} className="font-medium" />
            <div className="tabular text-muted-foreground text-[11px]" title={t("VALUE_BETS.SAFE_HINT")}>
              {t("VALUE_BETS.SAFE_EV", {
                ev: `${b.ev_conservative >= 0 ? "+" : ""}${(b.ev_conservative * 100).toFixed(1)}%`,
              })}
            </div>
          </Link>
        );
      },
    },
    {
      id: "event",
      accessorFn: (g) => new Date(g.best.starts_at).getTime(),
      header: (ctx) => <DataTableColumnHeader column={ctx.column} title="VALUE_BETS.COL_EVENT" />,
      size: 240,
      meta: { cellClassName: "whitespace-normal" },
      cell: (ctx) => {
        const b = ctx.row.original.best;
        return (
          <div className="min-w-48">
            <Link href={`/games/${encodeURIComponent(b.game_id)}`} className="underline-offset-4 hover:underline">
              {b.home} <span className="text-muted-foreground">{t("FORMAT.VS")}</span> {b.away}
            </Link>
            <div className="text-muted-foreground text-[11px]">
              {b.league}, {kickoff(b.starts_at, locale)}, {until(b.starts_at, now, locale, t)}
            </div>
          </div>
        );
      },
    },
    {
      id: "bet",
      accessorFn: (g) => sideName(g.best, t),
      enableSorting: false,
      header: (ctx) => <DataTableColumnHeader column={ctx.column} title="VALUE_BETS.COL_BET" />,
      size: 180,
      meta: { cellClassName: "whitespace-normal" },
      cell: (ctx) => {
        const b = ctx.row.original.best;
        return (
          <div className="min-w-36">
            <Link href={`/value-bets/${encodeURIComponent(b.id)}`} className="underline-offset-4 hover:underline">
              {sideName(b, t)}
            </Link>
            <div className="text-muted-foreground text-[11px]">{marketName(b, t)}</div>
          </div>
        );
      },
    },
    {
      id: "book",
      accessorFn: (g) => bookName(g.best.book),
      header: (ctx) => <DataTableColumnHeader column={ctx.column} title="VALUE_BETS.COL_BOOK" />,
      size: 150,
      cell: (ctx) => {
        const g = ctx.row.original;
        return (
          <div className="whitespace-nowrap">
            <div>{bookName(g.best.book)}</div>
            {g.offers.length > 1 && (
              <div
                className="text-muted-foreground text-[11px]"
                title={g.offers
                  .slice(1)
                  .map((o) => `${bookName(o.book)} ${odds(o.odds)}`)
                  .join(", ")}
              >
                {t("VALUE_BETS.MORE_BOOKS", { count: String(g.offers.length - 1) })}
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: "odds",
      accessorFn: (g) => Number(g.best.odds),
      header: (ctx) => <DataTableColumnHeader column={ctx.column} title="VALUE_BETS.COL_ODDS" className="justify-end" />,
      size: 80,
      meta: RIGHT,
      cell: (ctx) => <span className="tabular">{odds(ctx.row.original.best.odds)}</span>,
    },
    {
      id: "fair",
      accessorFn: (g) => Number(g.best.fair_odds),
      header: (ctx) => <DataTableColumnHeader column={ctx.column} title="VALUE_BETS.COL_FAIR" className="justify-end" />,
      size: 90,
      meta: RIGHT,
      cell: (ctx) => {
        const b = ctx.row.original.best;
        return (
          <div className="tabular text-muted-foreground whitespace-nowrap">
            <div>{odds(b.fair_odds)}</div>
            <div className="text-[11px]">{t("VALUE_BETS.PINNACLE_ODDS", { odds: odds(b.sharp_odds) })}</div>
          </div>
        );
      },
    },
    {
      id: "stake",
      accessorFn: stakeOf,
      header: (ctx) => <DataTableColumnHeader column={ctx.column} title="VALUE_BETS.COL_STAKE" className="justify-end" />,
      size: 80,
      meta: RIGHT,
      cell: (ctx) => {
        const stake = stakeOf(ctx.row.original);
        return (
          <span className="tabular" title={t("VALUE_BETS.STAKE_HINT", { bankroll: String(BANKROLL) })}>
            {stake >= 1 ? money(stake, locale) : "<1"}
          </span>
        );
      },
    },
    {
      id: "confidence",
      accessorFn: (g) => CONFIDENCE_ORDER[g.best.confidence],
      header: (ctx) => <DataTableColumnHeader column={ctx.column} title="VALUE_BETS.COL_CONFIDENCE" />,
      size: 110,
      cell: (ctx) => <ConfidenceBadge value={ctx.row.original.best.confidence} />,
    },
    {
      id: "seen",
      accessorFn: (g) => new Date(g.best.book_seen_at).getTime(),
      header: (ctx) => <DataTableColumnHeader column={ctx.column} title="VALUE_BETS.COL_SEEN" />,
      size: 90,
      cell: (ctx) => (
        <span className="tabular text-muted-foreground text-[11px] whitespace-nowrap">
          {ago(ctx.row.original.best.book_seen_at, now, locale)}
        </span>
      ),
    },
  ];
}

export function ValueBetsTable(props: { groups: GroupedBet[]; now: number }) {
  const t = useTranslations();
  const locale = useLocale();
  return (
    <DataTable
      id="VALUE_BETS"
      data={props.groups}
      columns={columns(t, locale, props.now)}
      localSorting
      emptyState={<span className="text-muted-foreground text-sm">{t("VALUE_BETS.EMPTY")}</span>}
    />
  );
}
