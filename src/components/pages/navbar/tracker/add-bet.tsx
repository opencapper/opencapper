"use client";

import { actionErrorText } from "@/components/elements/account/action-error";
import { Choice } from "@/components/elements/account/choice";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useRouter } from "@/i18n/navigation";
import { trackBet, type ActionResult } from "@/lib/auth/actions";
import { bookName, type Translate } from "@/lib/format";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Field } from "./bets-table";

const MARKETS = ["three_way", "two_way", "total", "asian_handicap"] as const;
type MarketKind = (typeof MARKETS)[number];

const SIDES: Record<MarketKind, string[]> = {
  three_way: ["home", "draw", "away"],
  two_way: ["home", "away"],
  total: ["over", "under"],
  asian_handicap: ["home", "away"],
};

function marketLabel(m: MarketKind, t: Translate): string {
  if (m === "three_way") return t("VALUE_BETS.MARKET_THREE_WAY");
  if (m === "two_way") return t("VALUE_BETS.MARKET_TWO_WAY");
  if (m === "total") return t("VALUE_BETS.MARKET_TOTAL");
  return t("VALUE_BETS.MARKET_ASIAN_HANDICAP");
}

function sideLabel(side: string, t: Translate): string {
  if (side === "home") return t("TRACKER.SIDE_HOME");
  if (side === "away") return t("TRACKER.SIDE_AWAY");
  if (side === "draw") return t("FORMAT.SIDE.DRAW");
  if (side === "over") return t("TRACKER.SIDE_OVER");
  return t("TRACKER.SIDE_UNDER");
}

export function AddBet(props: { books: string[] }) {
  const t = useTranslations();
  const open = useState(false);
  return (
    <>
      <Button size="sm" onClick={() => open[1](true)}>
        <Icon name="plus" />
        {t("TRACKER.ADD")}
      </Button>
      <Sheet open={open[0]} onOpenChange={open[1]}>
        <SheetContent side="right" className="bg-background w-full overflow-y-auto sm:max-w-md">
          {open[0] && <AddBetForm books={props.books} onDone={() => open[1](false)} />}
        </SheetContent>
      </Sheet>
    </>
  );
}

function AddBetForm(props: { books: string[]; onDone: () => void }) {
  const t = useTranslations();
  const router = useRouter();
  const home = useState("");
  const away = useState("");
  const league = useState("");
  const startsAt = useState("");
  const market = useState<MarketKind>("three_way");
  const side = useState("home");
  const line = useState("");
  const firstHalf = useState("full_time");
  const book = useState(props.books[0] ?? "");
  const price = useState("");
  const stake = useState("");
  const fair = useState("");
  const notes = useState("");
  const needsLine = market[0] === "total" || market[0] === "asian_handicap";

  const mutation = useMutation({
    mutationFn: async (): Promise<ActionResult> => {
      const kickoff = new Date(startsAt[0]);
      if (Number.isNaN(kickoff.getTime())) return { ok: false, error: "invalid" };
      return trackBet({
        home: home[0],
        away: away[0],
        league: league[0],
        starts_at: kickoff.toISOString(),
        market: market[0],
        side: side[0],
        line: needsLine ? line[0] : undefined,
        period: firstHalf[0],
        book: book[0],
        odds: price[0],
        stake: stake[0],
        fair_odds: fair[0] === "" ? undefined : fair[0],
        notes: notes[0],
      });
    },
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
        <SheetTitle>{t("TRACKER.ADD_TITLE")}</SheetTitle>
        <SheetDescription>{t("TRACKER.ADD_HINT")}</SheetDescription>
      </SheetHeader>
      <div className="grid grid-cols-2 gap-3">
        <Field id="add-home" type="text" required label={t("TRACKER.HOME")} value={home[0]} onChange={home[1]} />
        <Field id="add-away" type="text" required label={t("TRACKER.AWAY")} value={away[0]} onChange={away[1]} />
      </div>
      <Field id="add-league" type="text" label={t("TRACKER.LEAGUE")} value={league[0]} onChange={league[1]} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="add-start">{t("TRACKER.KICKOFF")}</Label>
        <Input
          id="add-start"
          type="datetime-local"
          required
          value={startsAt[0]}
          onChange={(e) => startsAt[1](e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Choice
          id="add-market"
          label={t("TRACKER.MARKET")}
          value={market[0]}
          options={MARKETS.map((m) => ({ value: m, label: marketLabel(m, t) }))}
          onChange={(value) => {
            const picked = MARKETS.find((m) => m === value);
            if (!picked) return;
            market[1](picked);
            side[1](SIDES[picked][0]);
          }}
        />
        <Choice
          id="add-period"
          label={t("TRACKER.PERIOD")}
          value={firstHalf[0]}
          options={[
            { value: "full_time", label: t("TRACKER.FULL_TIME") },
            { value: "first_half", label: t("TRACKER.FIRST_HALF") },
          ]}
          onChange={firstHalf[1]}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Choice
          id="add-side"
          label={t("TRACKER.SIDE")}
          value={side[0]}
          options={SIDES[market[0]].map((s) => ({ value: s, label: sideLabel(s, t) }))}
          onChange={side[1]}
        />
        {needsLine && (
          <Field
            id="add-line"
            label={t("TRACKER.LINE")}
            hint={market[0] === "asian_handicap" ? t("TRACKER.LINE_HINT") : undefined}
            required
            value={line[0]}
            onChange={line[1]}
          />
        )}
      </div>
      <Choice
        id="add-book"
        label={t("TRACKER.COL_BOOK")}
        value={book[0]}
        options={props.books.map((b) => ({ value: b, label: bookName(b) }))}
        onChange={book[1]}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field id="add-odds" required label={t("TRACKER.COL_ODDS")} value={price[0]} onChange={price[1]} />
        <Field id="add-stake" required label={t("TRACKER.COL_STAKE")} value={stake[0]} onChange={stake[1]} />
      </div>
      <Field
        id="add-fair"
        label={t("TRACKER.FAIR_ODDS")}
        hint={t("TRACKER.FAIR_ODDS_HINT")}
        value={fair[0]}
        onChange={fair[1]}
      />
      <Field id="add-notes" type="text" label={t("TRACKER.NOTES")} value={notes[0]} onChange={notes[1]} />
      {result && !result.ok && (
        <p role="alert" className="text-destructive text-sm">
          {actionErrorText(result.error, t)}
        </p>
      )}
      <Button type="submit" disabled={mutation.isPending}>
        <Icon name="check" />
        {t("TRACKER.ADD")}
      </Button>
    </form>
  );
}
