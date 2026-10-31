"use client";

import { PageHeading } from "@/components/elements/page/page-heading";
import { EventBoard } from "@/components/pages/navbar/picks/new/event-board";
import { LeagueChips } from "@/components/pages/navbar/picks/new/league-chips";
import { usePickFilters } from "@/components/pages/navbar/picks/new/pick-filters";
import { PickSlip } from "@/components/pages/navbar/picks/new/pick-slip";
import type {
  BoardSide,
  SlipSelection,
} from "@/components/pages/navbar/picks/new/slip";
import { DRAW_SELECTION } from "@/lib/config/markets";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  useCreatePickMutation,
  useEventBoardQuery,
  useEventLeaguesQuery,
} from "@/hooks/picks/picks-hook";
import { apiErrorText } from "@/lib/utils/api-error";
import type { PickLeagueKey } from "@/lib/config/sports";
import type { ApiBoardEvent } from "@/lib/types";
import { formatAmericanOdds } from "@/lib/utils/format/number";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function PickForm() {
  const t = useTranslations("PICK_NEW");
  const filters = usePickFilters();
  const league = filters[0].league;
  const search = filters[0].q;
  const setFilters = filters[1];

  const selectionState = useState<SlipSelection | null>(null);
  const unitsState = useState(1);
  const sheetState = useState(false);
  const selection = selectionState[0];
  const setSelection = selectionState[1];

  const board = useEventBoardQuery(league);
  const leagues = useEventLeaguesQuery();
  const create = useCreatePickMutation();
  const tRoot = useTranslations();

  const select = (next: SlipSelection | null) => {
    setSelection(next);
    create.reset();
  };

  const chooseLeague = (next: PickLeagueKey) => {
    setFilters({ league: next, q: null });
  };

  const pickSide = (event: ApiBoardEvent, side: BoardSide) => {
    const name = side === "draw" ? DRAW_SELECTION : event[side];
    const same =
      selection?.event.id === event.id &&
      selection.market === "h2h" &&
      selection.selection === name;
    if (same) return select(null);
    select({
      sportKey: league,
      event,
      market: "h2h",
      selection: name,
      odds: event.moneyline?.[side] ?? null,
      bookmaker: event.moneyline?.bookmaker ?? null,
    });
  };

  const moreMarkets = (event: ApiBoardEvent) => {
    select({
      sportKey: league,
      event,
      market: "spreads",
      selection: null,
      odds: null,
      bookmaker: null,
    });
    if (!window.matchMedia("(min-width: 1024px)").matches) sheetState[1](true);
  };

  const lock = () => {
    if (!selection?.selection) return;
    create.mutate({
      sportKey: selection.sportKey,
      eventId: selection.event.id,
      market: selection.market,
      selection: selection.selection,
      units: unitsState[0],
    });
  };

  const another = () => {
    setSelection(null);
    create.reset();
    sheetState[1](false);
  };

  const slip = (className?: string) => (
    <PickSlip
      className={className}
      selection={selection}
      onSelect={select}
      onClear={() => select(null)}
      units={unitsState[0]}
      onUnits={(value) => unitsState[1](value)}
      locking={create.isPending}
      error={
        create.isError
          ? apiErrorText(tRoot, create.error, t("SLIP.SUBMIT_ERROR"))
          : null
      }
      onLock={lock}
      created={create.data ?? null}
      onAnother={another}
    />
  );

  return (
    <div className="mx-auto max-w-6xl px-4 pt-12 pb-32 lg:pb-16">
      <PageHeading
        label={t("LABEL")}
        title={t("HEADING")}
        description={t("SUBHEADING")}
        className="mb-6"
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex min-w-0 flex-col gap-5">
          <LeagueChips
            value={league}
            active={leagues.data}
            onChange={chooseLeague}
          />
          <EventBoard
            sportKey={league}
            board={board.data}
            pending={board.isPending}
            error={board.isError}
            onRetry={() => board.refetch()}
            search={search}
            onSearch={(value) => setFilters({ q: value || null })}
            selected={selection}
            onPick={pickSide}
            onMoreMarkets={moreMarkets}
          />
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-16">{slip()}</div>
        </aside>
      </div>

      <MobileSlipBar
        selection={selection}
        done={create.isSuccess}
        onOpen={() => sheetState[1](true)}
      />
      <Sheet open={sheetState[0]} onOpenChange={(open) => sheetState[1](open)}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="max-h-[90dvh] gap-0 overflow-y-auto p-0 lg:hidden"
        >
          <SheetTitle className="sr-only">{t("SLIP.TITLE")}</SheetTitle>
          {slip("rounded-none ring-0")}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function MobileSlipBar(props: {
  selection: SlipSelection | null;
  done: boolean;
  onOpen: () => void;
}) {
  const t = useTranslations("PICK_NEW.SLIP");
  const tBoard = useTranslations("PICK_NEW.BOARD");
  if (!props.selection && !props.done) return null;
  return (
    <div className="bg-background/90 border-border fixed inset-x-0 bottom-0 z-40 border-t px-4 py-3 backdrop-blur lg:hidden">
      <Button
        size="lg"
        className="h-12 w-full justify-between text-base"
        onClick={props.onOpen}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="bg-primary-foreground text-primary tabular inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold">
            1
          </span>
          <span className="truncate">
            {props.selection?.selection === DRAW_SELECTION
              ? tBoard("DRAW")
              : (props.selection?.selection ?? t("TITLE"))}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {props.selection?.odds != null && (
            <span className="tabular">
              {formatAmericanOdds(props.selection.odds)}
            </span>
          )}
          <span className="text-sm opacity-80">{t("OPEN")}</span>
          <Icon name="chevron-up" />
        </span>
      </Button>
    </div>
  );
}
