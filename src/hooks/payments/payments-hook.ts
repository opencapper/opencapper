"use client";

import type { PlanBody } from "@/lib/api/typebox/payments";
import { useElysiaQuery } from "@/lib/react-query/hooks";
import { queryKeys } from "@/lib/react-query/keys";
import { rpc } from "@/lib/rpc";
import { handleElysia } from "@/lib/utils/base";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useMyPaymentsQuery(enabled: boolean) {
  return useElysiaQuery(
    queryKeys.myPayments(),
    () => rpc.api.payments.me.get(),
    { enabled },
  );
}

export function useCapperPlanQuery(username: string) {
  return useElysiaQuery(queryKeys.capperPlan(username), () =>
    rpc.api.payments({ username }).plan.get(),
  );
}

// The onboarding link is a short lived bearer URL: open it at once, never keep it in state.
export function useWhopOnboardingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (connected: boolean) =>
      handleElysia(
        await (connected
          ? rpc.api.payments.whop["onboarding-link"].post()
          : rpc.api.payments.whop.connect.post()),
      ),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.myPayments(),
      });
      window.location.assign(data.url);
    },
  });
}

export function useSavePlanMutation(username: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: PlanBody) =>
      handleElysia(await rpc.api.payments.plan.put(body)),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.myPayments() }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.capperPlan(username),
        }),
      ]),
  });
}

export function useCheckoutMutation(username: string) {
  return useMutation({
    mutationFn: async () =>
      handleElysia(await rpc.api.payments({ username }).checkout.post()),
    onSuccess: (data) => window.location.assign(data.url),
  });
}
