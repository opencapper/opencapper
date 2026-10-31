import { PICK_RESULTS, type PickResult } from "@/lib/api/typebox/picks";

export type RecordColumn = "win" | "loss" | "push";

// Share of the stake settled at the taken price and share lost; the rest is refunded. `split` is a 50/50 resolution (0.5 paid per share).
export const RESULT_SHARES = {
  pending: { win: 0, loss: 0 },
  win: { win: 1, loss: 0 },
  loss: { win: 0, loss: 1 },
  push: { win: 0, loss: 0 },
  void: { win: 0, loss: 0 },
  half_win: { win: 0.5, loss: 0 },
  half_loss: { win: 0, loss: 0.5 },
  split: { win: 0.5, loss: 0.5 },
} satisfies Record<PickResult, { win: number; loss: number }>;

export const RECORD_OF = {
  pending: null,
  win: "win",
  loss: "loss",
  push: "push",
  void: null,
  half_win: "win",
  half_loss: "loss",
  split: "push",
} satisfies Record<PickResult, RecordColumn | null>;

export function resultsIn(column: RecordColumn): PickResult[] {
  return PICK_RESULTS.filter((result) => RECORD_OF[result] === column);
}

// Results that risked the stake: they count in the record and in ROI.
export const GRADED_RESULTS = PICK_RESULTS.filter(
  (result) => RECORD_OF[result] !== null,
);

export const FINAL_RESULTS = PICK_RESULTS.filter(
  (result) => result !== "pending",
);

export function netUnits(
  result: PickResult,
  units: number,
  oddsDecimal: number,
): number {
  const share = RESULT_SHARES[result];
  return units * (share.win * (oddsDecimal - 1) - share.loss);
}

export function americanToDecimal(american: number): number {
  return american > 0 ? 1 + american / 100 : 1 + 100 / -american;
}
