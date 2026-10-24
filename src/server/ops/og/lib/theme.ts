import type { PickResult } from "@/lib/api/typebox/picks";

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

// The cinematic dark palette from src/lib/theme/presets.ts; colour is reserved for results.
export const C = {
  bg: "#000000",
  card: "#050505",
  text: "#fafafa",
  soft: "rgba(255,255,255,0.72)",
  muted: "rgba(255,255,255,0.5)",
  faint: "rgba(255,255,255,0.3)",
  hairline: "rgba(255,255,255,0.1)",
  fill: "rgba(255,255,255,0.04)",
  win: "#34d399",
  loss: "#f87171",
} as const;

export function resultColor(result: PickResult): string {
  if (result === "win") return C.win;
  if (result === "loss") return C.loss;
  return C.soft;
}

export function signColor(value: number): string {
  if (value > 0) return C.win;
  if (value < 0) return C.loss;
  return C.text;
}
