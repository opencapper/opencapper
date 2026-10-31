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

export function useUserPickQuery(username: string, seq: number) {
  return useElysiaQuery(queryKeys.userPick(username, seq), () =>
    rpc.api
      .users({ username })
      .picks({ seq: String(seq) })
      .get(),
  );
}

export function usePickQuery(pickId: number) {
  return useElysiaQuery(queryKeys.pick(pickId), () =>
    rpc.api.picks({ id: String(pickId) }).get(),
  );
}
