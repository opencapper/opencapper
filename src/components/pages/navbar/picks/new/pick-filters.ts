import { PICK_LEAGUE_KEYS } from "@/lib/config/sports";
import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";

const PARSERS = {
  league: parseAsStringLiteral(PICK_LEAGUE_KEYS).withDefault(
    "americanfootball_nfl",
  ),
  q: parseAsString.withDefault(""),
};

export function usePickFilters() {
  return useQueryStates(PARSERS);
}
