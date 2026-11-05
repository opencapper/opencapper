import type { PickMarket, PickSpec, SpecSide } from "@/lib/api/typebox/picks";
import {
  DRAW_SELECTION,
  hasDrawOutcome,
  sportShape,
} from "@/lib/config/markets";
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
  // Shape market selections are matched whole against the offered labels ("Ko in Round 1" carries no line).
  if (market !== "spreads" && market !== "totals")
    return text ? { side: text, point: null } : null;

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

// The spec of a score market selection, from the outcome name resolveOutcome returned.
export function scoreSpec(
  market: PickMarket,
  outcome: string,
  home: string,
  away: string,
): PickSpec {
  const name = normalise(outcome);
  const side: SpecSide =
    market === "totals"
      ? name === "under"
        ? "under"
        : "over"
      : name === normalise(DRAW_SELECTION)
        ? "draw"
        : name === normalise(away)
          ? "away"
          : "home";
  if (market !== "totals" && side === "home" && name !== normalise(home))
    throw new ApiError(422, "ERRORS.SELECTION_UNREADABLE");
  return { side, methods: null, period: null };
}

// Canonical selection text of a shape market spec; stored and hashed, so it is built only here.
export function specLabel(input: {
  sportKey: string;
  market: PickMarket;
  spec: PickSpec;
  home: string;
  away: string;
}): string | null {
  const shape = sportShape(input.sportKey);
  if (!shape) return null;
  const spec = input.spec;
  const who =
    spec.side === "home"
      ? input.home
      : spec.side === "away"
        ? input.away
        : null;
  const method = spec.methods
    ? spec.methods.map((m) => shape.methods[m]).join("/")
    : null;
  if (spec.methods?.some((m) => !(m in shape.methods))) return null;

  if (input.market === "distance") {
    if (spec.side === "yes") return "Goes the Distance";
    if (spec.side === "no") return "Does Not Go the Distance";
    return null;
  }
  if (spec.side === "draw") return shape.methods.draw ?? DRAW_SELECTION;
  if (input.market === "method") {
    if (!method) return null;
    return who ? `${who} by ${method}` : method;
  }
  if (input.market === "period_win") {
    if (!who) return null;
    const by = method ? ` by ${method}` : "";
    return spec.period
      ? `${who}${by} in ${shape.periodName} ${spec.period}`
      : method
        ? `${who}${by}`
        : null;
  }
  return null;
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
