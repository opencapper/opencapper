"use client";

import { actionErrorText } from "@/components/elements/account/action-error";
import { Ev } from "@/components/elements/odds/ev";
import { Matchup } from "@/components/elements/participant/matchup";
import { DataTable } from "@/components/elements/table/data-table";
import { VendorLabel } from "@/components/elements/vendor/vendor-logo";
import { DataTableColumnHeader } from "@/components/elements/table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useRouter } from "@/i18n/navigation";
import type { Bet, BetPatch, BetStatus } from "@/lib/api/client";
import { deleteBet, updateBet, type ActionResult } from "@/lib/auth/actions";
import type { TableFeats } from "@/lib/config/table-features";
import { bookName } from "@/lib/config/vendor-registry";
import { currency, kickoff, marketName, odds, sideName, type Translate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { BET_STATUSES, STATUS_STYLE, statusLabel } from "./bet-status";

const RIGHT = { headerClassName: "text-right", cellClassName: "text-right" };

type Dialog = { kind: "edit" | "delete"; bet: Bet } | undefined;

type Ctx = {
  t: Translate;
  locale: string;
  currency: string;
  settle: (bet: Bet, status: BetStatus) => void;
  open: (dialog: Dialog) => void;
  busy: boolean;
};

function title(bet: Bet, t: Translate): string {
  return `${sideName(bet, t)}, ${marketName(bet, t)}`;
}

function columns(c: Ctx): ColumnDef<TableFeats, Bet>[] {
  const t = c.t;
  return [
    {
      id: "placed",
      accessorFn: (b) => new Date(b.placed_at).getTime(),
      header: (ctx) => <DataTableColumnHeader column={ctx.column} title="TRACKER.COL_PLACED" />,
      size: 120,
      cell: (ctx) => (
        <span className="text-muted-foreground text-xs whitespace-nowrap">
          {kickoff(ctx.row.original.placed_at, c.locale)}
        </span>
      ),
    },
    {
      id: "bet",
      accessorFn: (b) => sideName(b, t),
      enableSorting: false,
      header: (ctx) => <DataTableColumnHeader column={ctx.column} title="TRACKER.COL_BET" />,
      size: 230,
      meta: { cellClassName: "whitespace-normal" },
      cell: (ctx) => {
        const b = ctx.row.original;
        return (
          <div className="min-w-44">
            <div>{sideName(b, t)}</div>
            <div className="text-muted-foreground text-[11px]">{marketName(b, t)}</div>
            <Matchup event={b} size="xs" className="text-muted-foreground mt-1 text-[11px]" />
          </div>
        );
      },
    },
    {
      id: "book",
      accessorFn: (b) => bookName(b.book),
      header: (ctx) => <DataTableColumnHeader column={ctx.column} title="TRACKER.COL_BOOK" />,
      size: 120,
      cell: (ctx) => <VendorLabel vendorKey={ctx.row.original.book} className="whitespace-nowrap" />,
    },
    {
      id: "odds",
      accessorFn: (b) => Number(b.odds),
      header: (ctx) => <DataTableColumnHeader column={ctx.column} title="TRACKER.COL_ODDS" className="justify-end" />,
      size: 70,
      meta: RIGHT,
      cell: (ctx) => <span className="tabular">{odds(ctx.row.original.odds)}</span>,
    },
    {
      id: "stake",
      accessorFn: (b) => Number(b.stake),
      header: (ctx) => <DataTableColumnHeader column={ctx.column} title="TRACKER.COL_STAKE" className="justify-end" />,
      size: 90,
      meta: RIGHT,
      cell: (ctx) => (
        <span className="tabular">{currency(Number(ctx.row.original.stake), c.locale, c.currency)}</span>
      ),
    },
    {
      id: "ev",
      accessorFn: (b) => b.ev_at_bet ?? -Infinity,
      header: (ctx) => <DataTableColumnHeader column={ctx.column} title="TRACKER.COL_EV" className="justify-end" />,
      size: 70,
      meta: RIGHT,
      cell: (ctx) => <Ev value={ctx.row.original.ev_at_bet} />,
    },
    {
      id: "clv",
      accessorFn: (b) => b.clv ?? -Infinity,
      header: (ctx) => <DataTableColumnHeader column={ctx.column} title="TRACKER.COL_CLV" className="justify-end" />,
      size: 70,
      meta: RIGHT,
      cell: (ctx) => <Ev value={ctx.row.original.clv} />,
    },
    {
      id: "status",
      accessorFn: (b) => b.status,
      header: (ctx) => <DataTableColumnHeader column={ctx.column} title="TRACKER.COL_STATUS" />,
      size: 90,
      cell: (ctx) => (
        <Badge variant="outline" className={cn("rounded-sm font-normal", STATUS_STYLE[ctx.row.original.status])}>
          {statusLabel(ctx.row.original.status, t)}
        </Badge>
      ),
    },
    {
      id: "profit",
      accessorFn: (b) => Number(b.profit ?? 0),
      header: (ctx) => <DataTableColumnHeader column={ctx.column} title="TRACKER.COL_PROFIT" className="justify-end" />,
      size: 90,
      meta: RIGHT,
      cell: (ctx) => {
        const profit = ctx.row.original.profit;
        if (profit === null || profit === undefined) return <span className="text-muted-foreground">{t("FORMAT.NA")}</span>;
        const value = Number(profit);
        return (
          <span className={cn("tabular", value > 0 ? "text-success" : value < 0 ? "text-destructive" : undefined)}>
            {currency(value, c.locale, c.currency)}
          </span>
        );
      },
    },
    {
      id: "actions",
      enableSorting: false,
      header: () => <span className="sr-only">{t("TRACKER.ACTIONS")}</span>,
      size: 48,
      meta: RIGHT,
      cell: (ctx) => {
        const b = ctx.row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              disabled={c.busy}
              render={<Button variant="ghost" size="icon-xs" aria-label={t("TRACKER.ACTIONS")} />}
            >
              <Icon name="settings-2" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              {BET_STATUSES.filter((s) => s !== b.status).map((s) => (
                <DropdownMenuItem key={s} onClick={() => c.settle(b, s)}>
                  <Icon name={s === "open" ? "refresh-ccw" : s === "won" ? "circle-check" : s === "lost" ? "x-circle" : "ban"} />
                  {s === "open" ? t("TRACKER.REOPEN") : t("TRACKER.MARK", { status: statusLabel(s, t) })}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => c.open({ kind: "edit", bet: b })}>
                <Icon name="paintbrush" />
                {t("TRACKER.EDIT")}
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => c.open({ kind: "delete", bet: b })}>
                <Icon name="x" />
                {t("TRACKER.DELETE")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}

export function BetsTable(props: { bets: Bet[]; currency: string }) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const dialog = useState<Dialog>(undefined);
  const settle = useMutation({
    mutationFn: (input: { id: string; patch: BetPatch }): Promise<ActionResult> => updateBet(input.id, input.patch),
    onSuccess: (result) => {
      if (result.ok) router.refresh();
    },
  });
  const failed = settle.data && !settle.data.ok ? settle.data : undefined;

  const ctx: Ctx = {
    t,
    locale,
    currency: props.currency,
    busy: settle.isPending,
    open: dialog[1],
    settle: (bet, status) => settle.mutate({ id: bet.id, patch: { status } }),
  };

  return (
    <>
      {failed && (
        <p role="alert" className="text-destructive text-sm">
          {actionErrorText(failed.error, t)}
        </p>
      )}
      <DataTable
        id="TRACKER_BETS"
        data={props.bets}
        columns={columns(ctx)}
        localSorting
        emptyState={<span className="text-muted-foreground text-sm">{t("TRACKER.BETS_EMPTY")}</span>}
      />
      <Sheet open={!!dialog[0]} onOpenChange={(open) => !open && dialog[1](undefined)}>
        <SheetContent side="right" className="bg-background w-full sm:max-w-sm">
          {dialog[0]?.kind === "edit" && (
            <EditForm bet={dialog[0].bet} onDone={() => dialog[1](undefined)} />
          )}
          {dialog[0]?.kind === "delete" && (
            <DeleteConfirm bet={dialog[0].bet} onDone={() => dialog[1](undefined)} />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function EditForm(props: { bet: Bet; onDone: () => void }) {
  const t = useTranslations();
  const router = useRouter();
  const stake = useState(props.bet.stake);
  const price = useState(props.bet.odds);
  const payout = useState(props.bet.payout ?? "");
  const notes = useState(props.bet.notes);
  const settled = props.bet.status !== "open";
  const mutation = useMutation({
    mutationFn: (): Promise<ActionResult> =>
      updateBet(props.bet.id, {
        stake: stake[0],
        odds: price[0],
        notes: notes[0],
        payout: settled && payout[0] !== "" ? payout[0] : undefined,
      }),
    onSuccess: (result) => {
      if (!result.ok) return;
      props.onDone();
      router.refresh();
    },
  });
  const result = mutation.data;
  return (
    <form
      className="flex flex-col gap-4 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
    >
      <SheetHeader className="p-0">
        <SheetTitle>{t("TRACKER.EDIT_TITLE")}</SheetTitle>
        <SheetDescription>{title(props.bet, t)}</SheetDescription>
      </SheetHeader>
      <Field id="edit-stake" label={t("TRACKER.COL_STAKE")} value={stake[0]} onChange={stake[1]} />
      <Field id="edit-odds" label={t("TRACKER.COL_ODDS")} value={price[0]} onChange={price[1]} />
      {settled && (
        <Field
          id="edit-payout"
          label={t("TRACKER.PAYOUT")}
          hint={t("TRACKER.PAYOUT_HINT")}
          value={payout[0]}
          onChange={payout[1]}
        />
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit-notes">{t("TRACKER.NOTES")}</Label>
        <Input id="edit-notes" value={notes[0]} onChange={(e) => notes[1](e.target.value)} maxLength={500} />
      </div>
      {result && !result.ok && (
        <p role="alert" className="text-destructive text-sm">
          {actionErrorText(result.error, t)}
        </p>
      )}
      <Button type="submit" disabled={mutation.isPending}>
        <Icon name="check" />
        {t("TRACKER.SAVE")}
      </Button>
    </form>
  );
}

function DeleteConfirm(props: { bet: Bet; onDone: () => void }) {
  const t = useTranslations();
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: (): Promise<ActionResult> => deleteBet(props.bet.id),
    onSuccess: (result) => {
      if (!result.ok) return;
      props.onDone();
      router.refresh();
    },
  });
  const result = mutation.data;
  return (
    <div className="flex flex-col gap-4 p-4">
      <SheetHeader className="p-0">
        <SheetTitle>{t("TRACKER.DELETE_TITLE")}</SheetTitle>
        <SheetDescription>{title(props.bet, t)}</SheetDescription>
      </SheetHeader>
      <p className="text-muted-foreground text-sm">{t("TRACKER.DELETE_BODY")}</p>
      {result && !result.ok && (
        <p role="alert" className="text-destructive text-sm">
          {actionErrorText(result.error, t)}
        </p>
      )}
      <div className="flex gap-2">
        <Button variant="destructive" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
          <Icon name="x" />
          {t("TRACKER.DELETE")}
        </Button>
        <Button variant="outline" onClick={props.onDone}>
          {t("TRACKER.CANCEL")}
        </Button>
      </div>
    </div>
  );
}

export function Field(props: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={props.id}>{props.label}</Label>
      <Input
        id={props.id}
        type={props.type}
        inputMode={props.type ? undefined : "decimal"}
        value={props.value}
        required={props.required}
        onChange={(e) => props.onChange(e.target.value)}
        className={props.type ? undefined : "tabular"}
      />
      {props.hint && <p className="text-muted-foreground text-xs">{props.hint}</p>}
    </div>
  );
}
