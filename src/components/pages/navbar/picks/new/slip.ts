import type { PickMarket } from "@/lib/api/typebox/picks";
import type { PickLeagueKey } from "@/lib/config/sports";
import type { ApiBoardEvent } from "@/lib/types";

export type SlipSelection = {
  sportKey: PickLeagueKey;
  event: ApiBoardEvent;
  market: PickMarket;
  selection: string | null;
  // Indicative only, never sent: the server captures the price on create.
  odds: number | null;
  bookmaker: string | null;
};

export type BoardSide = "home" | "away" | "draw";
