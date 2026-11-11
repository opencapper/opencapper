"use client";

import { ConfidenceBadge } from "@/components/elements/odds/confidence-badge";
import { Ev } from "@/components/elements/odds/ev";
import { LeagueLabel } from "@/components/elements/flag/league-label";
import { Matchup } from "@/components/elements/participant/matchup";
import { VendorLabel } from "@/components/elements/vendor/vendor-logo";
import { DataTable } from "@/components/elements/table/data-table";
import { DataTableColumnHeader } from "@/components/elements/table/data-table-column-header";
import { Link } from "@/i18n/navigation";
import type { TableFeats } from "@/lib/config/table-features";
import { TrackBet } from "@/components/elements/account/track-bet";
import { bookName } from "@/lib/config/vendor-registry";
import { ago, DEFAULT_PLAN, feeOf, fractionLabel, kelly, kickoff, marketName, money, netOdds, odds, sideName, until, type BookFee, type StakePlan, type Translate } from "@/lib/format";
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
  const now = c.now;
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
      size: 220,
      meta: { cellClassName: "whitespace-normal" },
      cell: (ctx) => {
        const b = ctx.row.original.best;
        return (
          <div className="min-w-48">
            <Link href={`/games/${encodeURIComponent(b.game_id)}`} className="underline-offset-4 hover:underline">
              <Matchup event={b} size="xs" />
            </Link>
            <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-1 text-[11px]">
              <LeagueLabel event={b} />
              <span>
                {kickoff(b.starts_at, locale)}, {until(b.starts_at, now, locale, t)}
              </span>
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
      accessorFn: (g) => stakeOf(g, c),
      header: (ctx) => <DataTableColumnHeader column={ctx.column} title="VALUE_BETS.COL_STAKE" className="justify-end" />,
      size: 80,
      meta: RIGHT,
      cell: (ctx) => {
        const stake = stakeOf(ctx.row.original, c);
        return (
          <span className="tabular" title={t("VALUE_BETS.STAKE_HINT", { fraction: fractionLabel(c.plan.fraction), bankroll: money(c.plan.bankroll, locale) })}>
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
            valueBetId={b.id}
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

export function ValueBetsTable(props: {
  groups: GroupedBet[];
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
  return (
    <DataTable
      id="VALUE_BETS"
      data={props.groups}
      columns={columns(ctx)}
      localSorting
      emptyState={<span className="text-muted-foreground text-sm">{t("VALUE_BETS.EMPTY")}</span>}
    />
  );
}
