import type { PickMarket } from "@/lib/api/typebox/picks";
import { DRAW_SELECTION, hasDrawOutcome } from "@/lib/config/markets";
import { ApiError } from "@/server/errors";

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

// The outcome name a selection points at, or a 422 naming the valid sides; runs before any odds are fetched.
export function resolveOutcome(input: {
  sportKey: string;
  market: PickMarket;
  side: string;
  home: string;
  away: string;
}): string {
  if (input.market === "totals") return input.side;
  const draw = input.market === "h2h" && hasDrawOutcome(input.sportKey);
  if (draw && input.side === normalise(DRAW_SELECTION)) return DRAW_SELECTION;
  const team = resolveTeam(input.side, [input.home, input.away]);
  if (team) return team;
  throw new ApiError(
    422,
    draw ? "ERRORS.OUTCOME_NOT_IN_EVENT" : "ERRORS.TEAM_NOT_IN_EVENT",
    { home: input.home, away: input.away },
  );
}

export function readSelection(
  market: PickMarket,
  raw: string,
): ParsedSelection {
  const parsed = parseSelection(market, raw);
  if (parsed) return parsed;
  throw new ApiError(
    422,
    market === "totals"
      ? "ERRORS.TOTALS_SIDE_REQUIRED"
      : "ERRORS.SELECTION_UNREADABLE",
  );
}
