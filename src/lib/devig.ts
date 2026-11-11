export type DevigResult = { multiplicative: number[]; additive: number[]; power: number[] };

// Mirrors core::odds in openev-api so the calculator gives the numbers the engine uses.
export function devig(odds: number[]): DevigResult | undefined {
  if (odds.length < 2 || odds.some((o) => !(o > 1))) return undefined;
  const p = odds.map((o) => 1 / o);
  const total = p.reduce((a, b) => a + b, 0);
  const excess = (total - 1) / p.length;
  let lo = 0.5;
  let hi = 2;
  for (let i = 0; i < 100; i++) {
    const k = (lo + hi) / 2;
    const s = p.reduce((a, x) => a + x ** k, 0);
    if (s > 1) lo = k;
    else hi = k;
  }
  const k = (lo + hi) / 2;
  return {
    multiplicative: p.map((x) => x / total),
    additive: p.map((x) => Math.max(0, x - excess)),
    power: p.map((x) => x ** k),
  };
}
