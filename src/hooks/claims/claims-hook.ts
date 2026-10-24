"use client";

import { useElysiaQuery } from "@/lib/react-query/hooks";
import { queryKeys } from "@/lib/react-query/keys";
import { rpc } from "@/lib/rpc";
import { handleElysia } from "@/lib/utils/base";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useMyClaimsQuery(enabled: boolean) {
  return useElysiaQuery(queryKeys.myClaims(), () => rpc.api.me.claims.get(), {
    enabled,
  });
}

function useProfileRefresh() {
  const queryClient = useQueryClient();
  return (username: string) =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKeys.userStats(username),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.userPicks(username),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.userHistory(username),
      }),
      queryClient.invalidateQueries({ queryKey: queryKeys.myClaims() }),
    ]);
}

export function useStartClaimMutation(username: string) {
  return useMutation({
    mutationFn: async () =>
      handleElysia(await rpc.api.claims({ username }).start.post()),
  });
}

export function useVerifyClaimMutation(username: string) {
  const refresh = useProfileRefresh();
  return useMutation({
    mutationFn: async () =>
      handleElysia(await rpc.api.claims({ username }).verify.post()),
    onSuccess: () => refresh(username),
  });
}

export function useProfileVisibilityMutation(username: string) {
  const refresh = useProfileRefresh();
  return useMutation({
    mutationFn: async (hidden: boolean) =>
      handleElysia(
        await (hidden
          ? rpc.api.claims({ username }).hide.post()
          : rpc.api.claims({ username }).unhide.post()),
      ),
    onSuccess: () => refresh(username),
  });
}
