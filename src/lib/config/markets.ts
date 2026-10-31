import type { PickMarket, PickResult } from "@/lib/api/typebox/picks";
import { msg } from "@/lib/config/constants";

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
  half_win: msg("PROFILE.STATUS.HALF_WIN"),
  half_loss: msg("PROFILE.STATUS.HALF_LOSS"),
  split: msg("PROFILE.STATUS.SPLIT"),
} satisfies Record<PickResult, string>;
