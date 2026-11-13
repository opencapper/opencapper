"use client";

import { ConfidenceBadge } from "@/components/elements/odds/confidence-badge";
import { Ev } from "@/components/elements/odds/ev";
import { PriceAge } from "@/components/elements/live/price-age";
import { VendorLabel } from "@/components/elements/vendor/vendor-logo";
import { DataTable } from "@/components/elements/table/data-table";
import { DataTableColumnHeader } from "@/components/elements/table/data-table-column-header";
import { useRowFlash } from "@/hooks/live/use-row-flash-hook";
import { Link } from "@/i18n/navigation";
import type { TableFeats } from "@/lib/config/table-features";
import { TrackBet } from "@/components/elements/account/track-bet";
import { bookName } from "@/lib/config/vendor-registry";
import {
  DEFAULT_PLAN,
  feeOf,
  fractionLabel,
  kelly,
  kickoffShort,
  marketName,
  matchup,
  money,
  netOdds,
  odds,
  oddsOf,
  percent,
  sideName,
  until,
  type BookFee,
  type StakePlan,
  type Translate,
} from "@/lib/format";
import type { GroupedBet } from "@/lib/group";
import type { ColumnDef } from "@tanstack/react-table";
import { useLocale, useTranslations } from "next-intl";

const RIGHT = { headerClassName: "text-right", cellClassName: "text-right" };
const CONFIDENCE_ORDER = { high: 3, medium: 2, low: 1, check: 0 };

type Ctx = { t: Translate; locale: string; now: number; plan: StakePlan; signedIn: boolean; fees: BookFee[] };

function stakeOf(g: GroupedBet, ctx: Ctx): number {
  const price = netOdds(Number(g.best.odds), feeOf(ctx.fees, g.best.book));
  return kelly(price, g.best.fair_probability, ctx.plan.fraction) * ctx.plan.bankroll;
}

function columns(c: Ctx): ColumnDef<TableFeats, GroupedBet>[] {
  const t = c.t;
  const locale = c.locale;
  return [
    {
      id: "ev",
      accessorFn: (g) => g.best.ev,
      header: (ctx) => <DataTableColumnHeader column={ctx.column} title="VALUE_BETS.COL_EV" />,
      size: 88,
      cell: (ctx) => {
        const b = ctx.row.original.best;
        return (
          <Link href={`/value-bets/${encodeURIComponent(b.id)}`} className="block">
            <Ev value={b.ev} className="font-semibold" />
            <div className="tabular text-muted-foreground text-[11px]" title={t("VALUE_BETS.SAFE_HINT")}>
              {t("VALUE_BETS.SAFE_EV", { ev: percent(b.ev_conservative) })}
            </div>
          </Link>
        );
      },
    },
    {
      id: "bet",
      accessorFn: (g) => sideName(g.best, t),
      enableSorting: false,
      header: (ctx) => <DataTableColumnHeader column={ctx.column} title="VALUE_BETS.COL_BET" />,
      size: 240,
      cell: (ctx) => {
        const b = ctx.row.original.best;
        return (
          <div className="max-w-[300px] min-w-44">
            <Link
              href={`/value-bets/${encodeURIComponent(b.id)}`}
              className="block truncate font-medium underline-offset-4 hover:underline"
            >
              {sideName(b, t)}
              <span className="text-muted-foreground font-normal"> {marketName(b, t)}</span>
            </Link>
            <Link
              href={`/games/${encodeURIComponent(b.game_id)}`}
              className="text-muted-foreground block truncate text-xs hover:underline"
              title={b.league}
            >
              {matchup(b.home, b.away, t)}, {b.league}
            </Link>
          </div>
        );
      },
    },
    {
      id: "book",
      accessorFn: (g) => bookName(g.best.book),
      header: (ctx) => <DataTableColumnHeader column={ctx.column} title="VALUE_BETS.COL_BOOK" />,
      size: 136,
      cell: (ctx) => {
        const g = ctx.row.original;
        return (
          <div className="whitespace-nowrap">
            <VendorLabel vendorKey={g.best.book} />
            {g.offers.length > 1 && (
              <div
                className="text-muted-foreground pl-[22px] text-[11px]"
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
      size: 72,
      meta: RIGHT,
      cell: (ctx) => <span className="tabular font-semibold">{odds(ctx.row.original.best.odds)}</span>,
    },
    {
      id: "fair",
      accessorFn: (g) => Number(g.best.fair_odds),
      header: (ctx) => <DataTableColumnHeader column={ctx.column} title="VALUE_BETS.COL_FAIR" className="justify-end" />,
      size: 72,
      meta: RIGHT,
      cell: (ctx) => <span className="tabular text-muted-foreground">{odds(ctx.row.original.best.fair_odds)}</span>,
    },
    {
      id: "reference",
      enableSorting: false,
      header: (ctx) => <DataTableColumnHeader column={ctx.column} title="VALUE_BETS.COL_REFERENCE" />,
      size: 124,
      cell: (ctx) => {
        const b = ctx.row.original.best;
        return (
          <div className="text-muted-foreground text-xs leading-5 whitespace-nowrap">
            <div className="tabular">{t("LANDING.BOARD.REF_PINNACLE", { odds: odds(b.sharp_odds) })}</div>
            <div className="tabular">
              {b.exchange_probability
                ? t("LANDING.BOARD.REF_EXCHANGE", { odds: oddsOf(b.exchange_probability) })
                : t("LANDING.BOARD.REF_NO_EXCHANGE")}
            </div>
          </div>
        );
      },
    },
    {
      id: "stake",
      accessorFn: (g) => stakeOf(g, c),
      header: (ctx) => <DataTableColumnHeader column={ctx.column} title="VALUE_BETS.COL_STAKE" className="justify-end" />,
      size: 72,
      meta: RIGHT,
      cell: (ctx) => {
        const stake = stakeOf(ctx.row.original, c);
        return (
          <span
            className="tabular"
            title={t("VALUE_BETS.STAKE_HINT", { fraction: fractionLabel(c.plan.fraction), bankroll: money(c.plan.bankroll, locale) })}
          >
            {stake >= 1 ? money(stake, locale) : "<1"}
          </span>
        );
      },
    },
    {
      id: "confidence",
      accessorFn: (g) => CONFIDENCE_ORDER[g.best.confidence],
      header: (ctx) => <DataTableColumnHeader column={ctx.column} title="VALUE_BETS.COL_CONFIDENCE" />,
      size: 92,
      cell: (ctx) => <ConfidenceBadge value={ctx.row.original.best.confidence} />,
    },
    {
      id: "seen",
      accessorFn: (g) => new Date(g.best.book_seen_at).getTime(),
      header: (ctx) => <DataTableColumnHeader column={ctx.column} title="VALUE_BETS.COL_AGE" />,
      size: 96,
      cell: (ctx) => <PriceAge iso={ctx.row.original.best.book_seen_at} serverNow={c.now} />,
    },
    {
      id: "kickoff",
      accessorFn: (g) => new Date(g.best.starts_at).getTime(),
      header: (ctx) => <DataTableColumnHeader column={ctx.column} title="VALUE_BETS.COL_KICKOFF" className="justify-end" />,
      size: 96,
      meta: RIGHT,
      cell: (ctx) => {
        const b = ctx.row.original.best;
        return (
          <div className="text-xs leading-5 whitespace-nowrap" suppressHydrationWarning>
            <div className="tabular">{kickoffShort(b.starts_at, c.now, locale)}</div>
            <div className="text-muted-foreground">{until(b.starts_at, c.now, locale, t)}</div>
          </div>
        );
      },
    },
    {
      id: "track",
      enableSorting: false,
      header: () => <span className="sr-only">{t("TRACK.ACTION")}</span>,
      size: 48,
      meta: RIGHT,
      cell: (ctx) => {
        const b = ctx.row.original.best;
        return (
          <TrackBet
            compact
            source={{ from_value_bet: b.id }}
            odds={b.odds}
            probability={b.fair_probability}
            fee={feeOf(c.fees, b.book)}
            title={t("OVERVIEW.BET_AT", { bet: sideName(b, t), book: bookName(b.book) })}
            plan={c.signedIn ? c.plan : undefined}
          />
        );
      },
    },
  ];
}

function keyOf(g: GroupedBet): string {
  return g.key;
}

function sigOf(g: GroupedBet): string {
  return `${g.best.id}:${g.best.odds}:${g.best.ev.toFixed(4)}:${g.best.confidence}:${g.offers.length}`;
}

export function ValueBetsTable(props: {
  groups: GroupedBet[];
  scope: string;
  now: number;
  plan?: StakePlan;
  fees: BookFee[];
}) {
  const t = useTranslations();
  const locale = useLocale();
  const ctx: Ctx = {
    t,
    locale,
    now: props.now,
    plan: props.plan ?? DEFAULT_PLAN,
    signedIn: !!props.plan,
    fees: props.fees,
  };
  const live = useRowFlash(props.groups, props.scope, keyOf, sigOf);
  return (
    <DataTable
      id="VALUE_BETS"
      data={live.rows}
      getRowId={keyOf}
      rowClassName={(row) => live.flash(row.original.key)}
      columns={columns(ctx)}
      localSorting
      emptyState={<span className="text-muted-foreground text-sm">{t("VALUE_BETS.EMPTY")}</span>}
    />
  );
}
