import { PICK_LEAGUE_KEYS } from "@/lib/config/sports";
import { createLoader, parseAsString, parseAsStringLiteral } from "nuqs/server";

// Shared by the client hook and the server prefetch, so both build the same query key.
export const PICK_PARSERS = {
  league: parseAsStringLiteral(PICK_LEAGUE_KEYS).withDefault(
    "americanfootball_nfl",
  ),
  q: parseAsString.withDefault(""),
};

export const loadPickFilters = createLoader(PICK_PARSERS);
