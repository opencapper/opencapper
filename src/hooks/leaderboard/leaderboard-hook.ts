"use client";

import type { LeaderboardQuery } from "@/lib/api/typebox/leaderboard";
import { useElysiaQuery } from "@/lib/react-query/hooks";
import { queryKeys } from "@/lib/react-query/keys";
import { rpc } from "@/lib/rpc";
import { keepPreviousData } from "@tanstack/react-query";

export function useLeaderboardQuery(query: LeaderboardQuery) {
  return useElysiaQuery(
    queryKeys.leaderboard(query),
    () => rpc.api.leaderboard.get({ query }),
    { placeholderData: keepPreviousData },
  );
}
