import type { PickMarket } from "@/lib/api/typebox/picks";

export type ParsedSelection = {
  side: string;
  point: number | null;
};

const TOTAL_SIDES: Record<string, string> = {
  o: "over",
  over: "over",
  u: "under",
  under: "under",
};

export function normalise(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export function parseSelection(
  market: PickMarket,
  raw: string,
): ParsedSelection | null {
  const text = normalise(raw);
  if (market === "h2h") return text ? { side: text, point: null } : null;

  const match = text.match(/^(.*?)\s*([+-]?\d+(?:\.\d+)?)?$/);
  if (!match || !match[1]) return null;
  const point = match[2] === undefined ? null : Number(match[2]);

  if (market === "totals") {
    const side = TOTAL_SIDES[match[1]];
    return side ? { side, point } : null;
  }
  return { side: match[1], point };
}

export function resolveTeam(
  side: string,
  teams: readonly string[],
): string | null {
  const exact = teams.find((team) => normalise(team) === side);
  if (exact) return exact;
  const partial = teams.filter((team) => {
    const name = normalise(team);
    return name.includes(side) || name.split(" ").includes(side);
  });
  return partial.length === 1 ? partial[0] : null;
}
