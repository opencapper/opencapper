import { useQueryStates } from "nuqs";
import { LEADERBOARD_PARSERS } from "./leaderboard-params";

export function useLeaderboardFilters() {
  return useQueryStates(LEADERBOARD_PARSERS);
}

export type SetLeaderboardFilters = ReturnType<typeof useLeaderboardFilters>[1];
