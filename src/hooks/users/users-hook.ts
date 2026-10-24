"use client";

import { useElysiaQuery } from "@/lib/react-query/hooks";
import { queryKeys } from "@/lib/react-query/keys";
import { rpc } from "@/lib/rpc";

export function useUserStatsQuery(username: string) {
  return useElysiaQuery(queryKeys.userStats(username), () =>
    rpc.api.users({ username }).stats.get(),
  );
}

export function useUserPicksQuery(username: string) {
  return useElysiaQuery(queryKeys.userPicks(username), () =>
    rpc.api.users({ username }).picks.get(),
  );
}

export function useUserHistoryQuery(username: string) {
  return useElysiaQuery(queryKeys.userHistory(username), () =>
    rpc.api.users({ username }).history.get(),
  );
}
