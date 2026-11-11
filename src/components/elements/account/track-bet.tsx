"use client";

import { actionErrorText } from "@/components/elements/account/action-error";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import type { NewBet } from "@/lib/api/client";
import { trackBet, type ActionResult } from "@/lib/auth/actions";
import { odds, query, suggestedStake, type BookFee, type StakePlan } from "@/lib/format";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

// Either a live value bet id or the full description of a bet the board no longer lists.
export type BetSource = Omit<NewBet, "stake" | "odds">;

export function TrackBet(props: {
  source: BetSource;
  odds: string;
  probability: number;
  fee?: BookFee;
  title: string;
  plan?: StakePlan;
  compact?: boolean;
}) {
  const t = useTranslations();
  const pathname = usePathname();
  const open = useState(false);
  const label = t("TRACK.ACTION");

  if (!props.plan) {
    return (
      <Button
        size={props.compact ? "icon-xs" : "sm"}
        variant="outline"
        nativeButton={false}
        aria-label={label}
        title={t("TRACK.SIGN_IN_HINT")}
        render={<Link href={query("/sign-in", { next: pathname })} />}
      >
        <Icon name="plus" />
        {!props.compact && label}
      </Button>
    );
  }

  return (
    <>
      <Button
        size={props.compact ? "icon-xs" : "sm"}
        variant={props.compact ? "outline" : "default"}
        aria-label={label}
        title={label}
        onClick={() => open[1](true)}
      >
        <Icon name="plus" />
        {!props.compact && label}
      </Button>
      <Sheet open={open[0]} onOpenChange={open[1]}>
        <SheetContent side="right" className="bg-background w-full sm:max-w-sm">
          {open[0] && <TrackForm {...props} plan={props.plan} onDone={() => open[1](false)} />}
        </SheetContent>
      </Sheet>
    </>
  );
}

function TrackForm(props: {
  source: BetSource;
  odds: string;
  probability: number;
  fee?: BookFee;
  title: string;
  plan: StakePlan;
  onDone: () => void;
}) {
  const t = useTranslations();
  const router = useRouter();
  const price = useState(odds(props.odds));
  const stake = useState(String(suggestedStake(Number(props.odds), props.probability, props.fee, props.plan)));
  const mutation = useMutation({
    mutationFn: (): Promise<ActionResult> =>
      trackBet({ ...props.source, stake: stake[0], odds: price[0] }),
    onSuccess: (result) => {
      if (!result.ok) return;
      toast.success(t("TRACK.DONE"), {
        action: { label: t("TRACK.OPEN_TRACKER"), onClick: () => router.push("/tracker") },
      });
      props.onDone();
      router.refresh();
    },
  });
  const result = mutation.data;
  const suggestion = suggestedStake(Number(price[0]), props.probability, props.fee, props.plan);

  return (
    <form
      className="flex flex-col gap-4 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
    >
      <SheetHeader className="p-0">
        <SheetTitle>{t("TRACK.TITLE")}</SheetTitle>
        <SheetDescription>{props.title}</SheetDescription>
      </SheetHeader>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="track-odds">{t("TRACK.ODDS")}</Label>
        <Input
          id="track-odds"
          inputMode="decimal"
          value={price[0]}
          onChange={(e) => price[1](e.target.value)}
          className="tabular"
        />
        <p className="text-muted-foreground text-xs">{t("TRACK.ODDS_HINT")}</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="track-stake">{t("TRACK.STAKE")}</Label>
        <Input
          id="track-stake"
          inputMode="decimal"
          value={stake[0]}
          onChange={(e) => stake[1](e.target.value)}
          className="tabular"
        />
        <p className="text-muted-foreground text-xs">
          {t("TRACK.STAKE_HINT", { stake: String(suggestion) })}
        </p>
      </div>
      {result && !result.ok && (
        <p role="alert" className="text-destructive text-sm">
          {actionErrorText(result.error, t)}
        </p>
      )}
      <Button type="submit" disabled={mutation.isPending}>
        <Icon name="check" />
        {t("TRACK.SUBMIT")}
      </Button>
    </form>
  );
}
