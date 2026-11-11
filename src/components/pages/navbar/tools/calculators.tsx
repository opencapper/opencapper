"use client";

import { CARD_LABEL } from "@/components/elements/page/page-heading";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { devig } from "@/lib/devig";
import { kelly, money, percent, prob } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";

function Field(props: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{props.label}</span>
      <Input
        inputMode="decimal"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className="tabular w-28 text-right"
      />
    </label>
  );
}

function Calculator(props: { title: string; note: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className={CARD_LABEL}>{props.title}</CardTitle>
        <CardDescription>{props.note}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">{props.children}</CardContent>
    </Card>
  );
}

function Row(props: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{props.label}</span>
      <span className={cn("tabular", props.tone)}>{props.value}</span>
    </div>
  );
}

function Result(props: { children: ReactNode }) {
  return <div className="flex flex-col gap-1 border-t pt-3">{props.children}</div>;
}

export function EvCalculator() {
  const t = useTranslations("TOOLS");
  const locale = useLocale();
  const price = useState("2.20");
  const fair = useState("2.05");
  const bank = useState("1000");
  const o = Number(price[0]);
  const p = 1 / Number(fair[0]);
  const ok = o > 1 && Number(fair[0]) > 1;
  const ev = o * p - 1;
  return (
    <Calculator title={t("EV_TITLE")} note={t("EV_NOTE")}>
      <Field label={t("BOOK_ODDS")} value={price[0]} onChange={price[1]} />
      <Field label={t("FAIR_ODDS")} value={fair[0]} onChange={fair[1]} />
      <Field label={t("BANKROLL")} value={bank[0]} onChange={bank[1]} />
      {ok && (
        <Result>
          <Row label={t("EV")} value={percent(ev, 2)} tone={ev > 0 ? "text-success" : "text-destructive"} />
          <Row label={t("FAIR_CHANCE")} value={prob(p)} />
          <Row label={t("QUARTER_KELLY")} value={money(kelly(o, p, 0.25) * Number(bank[0]), locale)} />
        </Result>
      )}
    </Calculator>
  );
}

function OutcomeFields(props: { values: string[]; onChange: (values: string[]) => void }) {
  const t = useTranslations("TOOLS");
  return props.values.map((v, i) => (
    <Field
      key={i}
      label={t("OUTCOME", { n: String(i + 1) })}
      value={v}
      onChange={(nv) => props.onChange(props.values.map((x, j) => (j === i ? nv : x)))}
    />
  ));
}

export function DevigCalculator() {
  const t = useTranslations("TOOLS");
  const values = useState(["2.10", "3.40", "3.60"]);
  const nums = values[0].filter((v) => v.trim() !== "").map(Number);
  const r = devig(nums);
  const margin = nums.reduce((a, o) => a + 1 / o, 0) - 1;
  const head = "label-mono text-foreground/45 py-1 text-[10px] font-normal";
  return (
    <Calculator title={t("DEVIG_TITLE")} note={t("DEVIG_NOTE")}>
      <OutcomeFields values={values[0]} onChange={values[1]} />
      {r && (
        <div className="border-t pt-3">
          <Row label={t("MARGIN")} value={percent(margin, 2)} />
          <table className="mt-2 w-full text-sm">
            <thead>
              <tr>
                <th className={`${head} text-left`}>{t("FAIR_ODDS")}</th>
                <th className={`${head} text-right`}>{t("POWER")}</th>
                <th className={`${head} text-right`}>{t("MULT")}</th>
                <th className={`${head} text-right`}>{t("ADD")}</th>
              </tr>
            </thead>
            <tbody className="tabular">
              {nums.map((o, i) => (
                <tr key={i}>
                  <td className="text-muted-foreground py-1">{o.toFixed(2)}</td>
                  <td className="py-1 text-right">{(1 / r.power[i]).toFixed(3)}</td>
                  <td className="py-1 text-right">{(1 / r.multiplicative[i]).toFixed(3)}</td>
                  <td className="py-1 text-right">{(1 / r.additive[i]).toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Calculator>
  );
}

export function ArbCalculator() {
  const t = useTranslations("TOOLS");
  const values = useState(["2.10", "2.05", ""]);
  const total = useState("100");
  const nums = values[0].filter((v) => v.trim() !== "").map(Number);
  const valid = nums.length >= 2 && nums.every((o) => o > 1);
  const inv = nums.map((o) => 1 / o);
  const sum = inv.reduce((a, b) => a + b, 0);
  const profit = 1 / sum - 1;
  return (
    <Calculator title={t("ARB_TITLE")} note={t("ARB_NOTE")}>
      <OutcomeFields values={values[0]} onChange={values[1]} />
      <Field label={t("TOTAL_STAKE")} value={total[0]} onChange={total[1]} />
      {valid && (
        <Result>
          {nums.map((o, i) => (
            <Row
              key={i}
              label={t("STAKE_ON", { odds: o.toFixed(2) })}
              value={((inv[i] / sum) * Number(total[0])).toFixed(2)}
            />
          ))}
          <Row label={t("PROFIT")} value={percent(profit, 2)} tone={profit > 0 ? "text-success" : "text-destructive"} />
        </Result>
      )}
    </Calculator>
  );
}

function fraction(decimalOdds: number): string {
  const x = decimalOdds - 1;
  for (let d = 1; d <= 100; d++) {
    const n = Math.round(x * d);
    if (Math.abs(n / d - x) < 0.005) return `${n}/${d}`;
  }
  return x.toFixed(2);
}

export function OddsConverter() {
  const t = useTranslations("TOOLS");
  const value = useState("2.50");
  const o = Number(value[0]);
  const american = o >= 2 ? `+${Math.round((o - 1) * 100)}` : `${Math.round(-100 / (o - 1))}`;
  return (
    <Calculator title={t("CONVERT_TITLE")} note={t("CONVERT_NOTE")}>
      <Field label={t("DECIMAL_ODDS")} value={value[0]} onChange={value[1]} />
      {o > 1 && (
        <Result>
          <Row label={t("FRACTIONAL")} value={fraction(o)} />
          <Row label={t("AMERICAN")} value={american} />
          <Row label={t("IMPLIED")} value={prob(1 / o)} />
        </Result>
      )}
    </Calculator>
  );
}
