import type { PickMarket, PickResult } from "@/lib/api/typebox/picks";
import { msg } from "@/lib/config/constants";
import { sportGroup, type SportGroup } from "@/lib/config/sports";

// The Odds API outcome name of the third moneyline side; also the stored selection text.
export const DRAW_SELECTION = "Draw";

// Soccer moneylines are three way (home, draw, away); every other league is two way.
export function hasDrawOutcome(sportKey: string): boolean {
  return sportGroup(sportKey) === "soccer";
}

export const MARKET_KEY = {
  h2h: msg("PROFILE.MARKET.H2H"),
  spreads: msg("PROFILE.MARKET.SPREADS"),
  totals: msg("PROFILE.MARKET.TOTALS"),
  method: msg("PROFILE.MARKET.METHOD"),
  period_win: msg("PROFILE.MARKET.PERIOD_WIN"),
  distance: msg("PROFILE.MARKET.DISTANCE"),
} satisfies Record<PickMarket, string>;

export function isMarket(value: string): value is PickMarket {
  return value in MARKET_KEY;
}

// How a sport's event ends: the result classes a `method` selection can name, and the periods a fight or match runs.
export type SportShape = {
  // Result class to the English label used in canonical selection text (stored and hashed, so never translated).
  methods: Readonly<Record<string, string>>;
  // Result classes that mean the event ran its full scheduled length.
  distanceMethods: readonly string[];
  // Result classes that void every pick on the event.
  voidMethods: readonly string[];
  periodName: string;
  // Seconds per period, for totals measured in periods (rounds); null when totals count score.
  periodSeconds: number | null;
};

const FIGHT_SHAPE: SportShape = {
  methods: {
    ko: "KO/TKO",
    submission: "Submission",
    decision: "Decision",
    dq: "DQ",
    draw: "Draw",
    no_contest: "No Contest",
  },
  distanceMethods: ["decision", "draw"],
  voidMethods: ["no_contest"],
  periodName: "Round",
  periodSeconds: 300,
};

const BOXING_SHAPE: SportShape = {
  ...FIGHT_SHAPE,
  methods: {
    ko: "KO/TKO",
    decision: "Decision",
    dq: "DQ",
    draw: "Draw",
    no_contest: "No Contest",
  },
  periodSeconds: 180,
};

const SHAPES: Partial<Record<SportGroup, SportShape>> = {
  mma: FIGHT_SHAPE,
  boxing: BOXING_SHAPE,
};

export function sportShape(sportKey: string): SportShape | null {
  const group = sportGroup(sportKey);
  return group ? (SHAPES[group] ?? null) : null;
}

// Families every sport offers; the rest need a sport shape that defines methods and periods.
const SCORE_FAMILIES: readonly PickMarket[] = ["h2h", "spreads", "totals"];
const SHAPE_FAMILIES: readonly PickMarket[] = [
  "method",
  "period_win",
  "distance",
];

// Shape markets are priced by the shape provider and graded from method and period facts.
export function isShapeMarket(market: PickMarket): boolean {
  return SHAPE_FAMILIES.includes(market);
}

export function marketsFor(sportKey: string): PickMarket[] {
  return sportShape(sportKey)
    ? [...SCORE_FAMILIES, ...SHAPE_FAMILIES]
    : [...SCORE_FAMILIES];
}

export const PICK_STATUS_KEY = {
  pending: msg("PROFILE.STATUS.PENDING"),
  win: msg("PROFILE.STATUS.WIN"),
  loss: msg("PROFILE.STATUS.LOSS"),
  push: msg("PROFILE.STATUS.PUSH"),
  void: msg("PROFILE.STATUS.VOID"),
  half_win: msg("PROFILE.STATUS.HALF_WIN"),
  half_loss: msg("PROFILE.STATUS.HALF_LOSS"),
  split: msg("PROFILE.STATUS.SPLIT"),
} satisfies Record<PickResult, string>;
