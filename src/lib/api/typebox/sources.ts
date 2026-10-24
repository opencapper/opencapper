import { t } from "elysia";

export const SourcePlatform = t.Union([
  t.Literal("polymarket"),
  t.Literal("reddit"),
]);
export type SourcePlatform = typeof SourcePlatform.static;

export const SOURCE_PLATFORMS = SourcePlatform.anyOf.map((l) => l.const);

// Bookmaker key of picks priced by an on chain Polymarket fill instead of the Odds API.
export const EXCHANGE_BOOKMAKER = "polymarket";
