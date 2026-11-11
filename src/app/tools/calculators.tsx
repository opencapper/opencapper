"use client";

import { useState } from "react";
import { devig } from "@/lib/devig";
import { kelly, money, percent, prob } from "@/lib/format";

function Field(props: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted">{props.label}</span>
      <input
        inputMode="decimal"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className="tabular w-28 border border-line bg-background px-2 py-1 text-right font-mono"
      />
    </label>
  );
}

function Card(props: { title: string; note: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border border-line bg-panel p-4">
      <div>
        <h2 className="font-medium">{props.title}</h2>
        <p className="text-xs text-muted">{props.note}</p>
      </div>
      {props.children}
    </section>
  );
}

function Row(props: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted">{props.label}</span>
      <span className={`tabular font-mono ${props.tone ?? ""}`}>{props.value}</span>
    </div>
  );
}

export function EvCalculator() {
  const [price, setPrice] = useState("2.20");
  const [fair, setFair] = useState("2.05");
  const [bank, setBank] = useState("1000");
  const o = Number(price);
  const p = 1 / Number(fair);
  const ok = o > 1 && Number(fair) > 1;
  const ev = o * p - 1;
  return (
    <Card title="EV and stake" note="Your price against the fair price, with a quarter Kelly stake.">
      <Field label="Bookmaker odds" value={price} onChange={setPrice} />
      <Field label="Fair odds" value={fair} onChange={setFair} />
      <Field label="Bankroll" value={bank} onChange={setBank} />
      {ok && (
        <div className="flex flex-col gap-1 border-t border-line pt-3">
          <Row label="EV" value={percent(ev, 2)} tone={ev > 0 ? "text-win" : "text-bad"} />
          <Row label="Fair chance" value={prob(p)} />
          <Row label="Quarter Kelly stake" value={money(kelly(o, p, 0.25) * Number(bank))} />
        </div>
      )}
    </Card>
  );
}

export function DevigCalculator() {
  const [values, setValues] = useState(["2.10", "3.40", "3.60"]);
  const nums = values.filter((v) => v.trim() !== "").map(Number);
  const r = devig(nums);
  const margin = nums.reduce((a, o) => a + 1 / o, 0) - 1;
  return (
    <Card title="Remove the margin" note="Enter every outcome of one market (leave the third empty for two way).">
      {values.map((v, i) => (
        <Field
          key={i}
          label={`Outcome ${i + 1}`}
          value={v}
          onChange={(nv) => setValues(values.map((x, j) => (j === i ? nv : x)))}
        />
      ))}
      {r && (
        <div className="border-t border-line pt-3">
          <Row label="Margin" value={percent(margin, 2)} />
          <table className="mt-2 w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-muted">
                <th className="py-1 text-left font-normal">Fair odds</th>
                <th className="py-1 text-right font-normal">Power</th>
                <th className="py-1 text-right font-normal">Mult.</th>
                <th className="py-1 text-right font-normal">Add.</th>
              </tr>
            </thead>
            <tbody className="tabular font-mono">
              {nums.map((o, i) => (
                <tr key={i}>
                  <td className="py-1 text-muted">{o.toFixed(2)}</td>
                  <td className="py-1 text-right">{(1 / r.power[i]).toFixed(3)}</td>
                  <td className="py-1 text-right">{(1 / r.multiplicative[i]).toFixed(3)}</td>
                  <td className="py-1 text-right">{(1 / r.additive[i]).toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

export function ArbCalculator() {
  const [values, setValues] = useState(["2.10", "2.05", ""]);
  const [total, setTotal] = useState("100");
  const nums = values.filter((v) => v.trim() !== "").map(Number);
  const valid = nums.length >= 2 && nums.every((o) => o > 1);
  const inv = nums.map((o) => 1 / o);
  const sum = inv.reduce((a, b) => a + b, 0);
  const profit = 1 / sum - 1;
  return (
    <Card title="Arbitrage stakes" note="Best odds for every outcome, split so each one returns the same.">
      {values.map((v, i) => (
        <Field
          key={i}
          label={`Outcome ${i + 1}`}
          value={v}
          onChange={(nv) => setValues(values.map((x, j) => (j === i ? nv : x)))}
        />
      ))}
      <Field label="Total stake" value={total} onChange={setTotal} />
      {valid && (
        <div className="flex flex-col gap-1 border-t border-line pt-3">
          {nums.map((o, i) => (
            <Row key={i} label={`Stake on ${o.toFixed(2)}`} value={((inv[i] / sum) * Number(total)).toFixed(2)} />
          ))}
          <Row label="Profit" value={percent(profit, 2)} tone={profit > 0 ? "text-win" : "text-bad"} />
        </div>
      )}
    </Card>
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
  const [value, setValue] = useState("2.50");
  const o = Number(value);
  const ok = o > 1;
  const american = o >= 2 ? `+${Math.round((o - 1) * 100)}` : `${Math.round(-100 / (o - 1))}`;
  return (
    <Card title="Odds converter" note="Decimal odds to the other formats and the implied chance.">
      <Field label="Decimal odds" value={value} onChange={setValue} />
      {ok && (
        <div className="flex flex-col gap-1 border-t border-line pt-3">
          <Row label="Fractional" value={fraction(o)} />
          <Row label="American" value={american} />
          <Row label="Implied chance" value={prob(1 / o)} />
        </div>
      )}
    </Card>
  );
}
