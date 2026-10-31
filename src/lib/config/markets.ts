import type { PickMarket, PickResult } from "@/lib/api/typebox/picks";
import { msg } from "@/lib/config/constants";
import { sportGroup } from "@/lib/config/sports";

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
} satisfies Record<PickMarket, string>;

export function isMarket(value: string): value is PickMarket {
  return value in MARKET_KEY;
}

export const PICK_STATUS_KEY = {
  pending: msg("PROFILE.STATUS.PENDING"),
  win: msg("PROFILE.STATUS.WIN"),
  loss: msg("PROFILE.STATUS.LOSS"),
  push: msg("PROFILE.STATUS.PUSH"),
  void: msg("PROFILE.STATUS.VOID"),
} satisfies Record<PickResult, string>;
