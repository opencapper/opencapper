"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { kelly, money } from "@/lib/format";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

const KELLY_FRACTIONS = [
  { key: "FULL", value: 1 },
  { key: "HALF", value: 0.5 },
  { key: "QUARTER", value: 0.25 },
  { key: "EIGHTH", value: 0.125 },
] as const;

export function StakeCalculator(props: { odds: number; probability: number }) {
  const t = useTranslations("STAKE");
  const locale = useLocale();
  const bankrollState = useState(1000);
  const bankroll = bankrollState[0];
  const fractionState = useState(0.25);
  const fraction = fractionState[0];
  const share = kelly(props.odds, props.probability, fraction);
  const stake = share * bankroll;
  const profit = stake * (props.odds - 1);
  return (
    <div className="flex flex-col gap-3 px-4 py-4 text-sm">
      <label className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground">{t("BANKROLL")}</span>
        <Input
          type="number"
          min={0}
          value={bankroll}
          onChange={(e) => bankrollState[1](Math.max(0, Number(e.target.value)))}
          className="tabular w-28 text-right"
        />
      </label>
      <div className="flex flex-wrap gap-1">
        {KELLY_FRACTIONS.map((f) => (
          <Button
            key={f.key}
            type="button"
            size="xs"
            variant={fraction === f.value ? "secondary" : "ghost"}
            onClick={() => fractionState[1](f.value)}
          >
            {t(`KELLY.${f.key}`)}
          </Button>
        ))}
      </div>
      <dl className="tabular grid grid-cols-2 gap-y-1 text-sm">
        <dt className="text-muted-foreground font-sans">{t("STAKE")}</dt>
        <dd className="text-right">{money(stake, locale)}</dd>
        <dt className="text-muted-foreground font-sans">{t("SHARE")}</dt>
        <dd className="text-right">{(share * 100).toFixed(2)}%</dd>
        <dt className="text-muted-foreground font-sans">{t("PROFIT_IF_WIN")}</dt>
        <dd className="text-right">{money(profit, locale)}</dd>
        <dt className="text-muted-foreground font-sans">{t("EXPECTED_PROFIT")}</dt>
        <dd className="text-success text-right">
          {money(stake * (props.odds * props.probability - 1), locale)}
        </dd>
      </dl>
    </div>
  );
}
