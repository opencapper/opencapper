"use client";

import { useState } from "react";
import { kelly, money } from "@/lib/format";

const FRACTIONS = [
  { label: "Full", value: 1 },
  { label: "Half", value: 0.5 },
  { label: "Quarter", value: 0.25 },
  { label: "Eighth", value: 0.125 },
];

export function StakeCalculator(props: { odds: number; probability: number }) {
  const [bankroll, setBankroll] = useState(1000);
  const [fraction, setFraction] = useState(0.25);
  const share = kelly(props.odds, props.probability, fraction);
  const stake = share * bankroll;
  const profit = stake * (props.odds - 1);
  return (
    <div className="flex flex-col gap-3 px-4 py-3 text-sm">
      <label className="flex items-center justify-between gap-3">
        <span className="text-muted">Bankroll</span>
        <input
          type="number"
          min={0}
          value={bankroll}
          onChange={(e) => setBankroll(Math.max(0, Number(e.target.value)))}
          className="tabular w-28 border border-line bg-background px-2 py-1 text-right font-mono"
        />
      </label>
      <div className="flex flex-wrap gap-1">
        {FRACTIONS.map((f) => (
          <button
            key={f.label}
            type="button"
            onClick={() => setFraction(f.value)}
            className={`border px-2.5 py-1 text-xs ${
              fraction === f.value ? "border-foreground/40 bg-foreground/10" : "border-line text-muted"
            }`}
          >
            {f.label} Kelly
          </button>
        ))}
      </div>
      <dl className="tabular grid grid-cols-2 gap-y-1 font-mono text-sm">
        <dt className="font-sans text-muted">Stake</dt>
        <dd className="text-right">{money(stake)}</dd>
        <dt className="font-sans text-muted">Share of bankroll</dt>
        <dd className="text-right">{(share * 100).toFixed(2)}%</dd>
        <dt className="font-sans text-muted">Profit if it wins</dt>
        <dd className="text-right">{money(profit)}</dd>
        <dt className="font-sans text-muted">Expected profit</dt>
        <dd className="text-right text-win">{money(stake * (props.odds * props.probability - 1))}</dd>
      </dl>
    </div>
  );
}
