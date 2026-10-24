"use client";

import type { WebPickBody } from "@/lib/api/typebox/picks";
import { useElysiaQuery } from "@/lib/react-query/hooks";
import { queryKeys } from "@/lib/react-query/keys";
import { rpc } from "@/lib/rpc";
import { handleElysia } from "@/lib/utils/base";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useEventBoardQuery(sportKey: string) {
  return useElysiaQuery(
    queryKeys.eventBoard(sportKey),
    () => rpc.api.events.board.get({ query: { sport: sportKey } }),
    {
      staleTime: 60_000,
      // Logos fill in the background under TheSportsDB's rate limit; poll until they land.
      refetchInterval: (query) =>
        query.state.data?.imagesPending ? 15_000 : false,
    },
  );
}

export function useEventLeaguesQuery() {
  return useElysiaQuery(
    queryKeys.eventLeagues(),
    () => rpc.api.events.leagues.get(),
    { staleTime: 60 * 60_000 },
  );
}

export function useEventOddsQuery(
  sportKey: string | null,
  eventId: string | null,
) {
  return useElysiaQuery(
    queryKeys.eventOdds(sportKey ?? "", eventId ?? ""),
    () =>
      rpc.api
        .events({ sportKey: sportKey ?? "" })({ eventId: eventId ?? "" })
        .odds.get(),
    { enabled: sportKey !== null && eventId !== null, staleTime: 60_000 },
  );
}

export function useCreatePickMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: WebPickBody) =>
      handleElysia(await rpc.api.me.picks.post(body)),
    onSuccess: (pick) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.userPicks(pick.username),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.userStats(pick.username),
      });
    },
  });
}
