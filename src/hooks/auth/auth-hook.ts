"use client";

import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { useElysiaQuery } from "@/lib/react-query/hooks";
import { queryKeys } from "@/lib/react-query/keys";
import { rpc } from "@/lib/rpc";
import type { AuthProviders, AuthUser } from "@/lib/types";
import { CodedError, readApiError } from "@/lib/utils/api-error";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Seeded by prefetchAuth in the navbar layout; null is a guest, not an error.
export function useAuthQuery() {
  return useQuery({
    queryKey: queryKeys.auth(),
    queryFn: async (): Promise<AuthUser | null> => {
      const res = await rpc.api.me.get();
      return res.status === 200 && res.data ? res.data : null;
    },
    staleTime: Infinity,
  });
}

export function useAuthUser(): AuthUser | null {
  return useAuthQuery().data ?? null;
}

// Seeded by prefetchAuth alongside the user, so login options render without a fetch.
export function useAuthProvidersQuery() {
  return useElysiaQuery(
    queryKeys.authProviders(),
    () => rpc.api.me.providers.get(),
    { staleTime: Infinity },
  );
}

export function useAuthProviders(): AuthProviders {
  return useAuthProvidersQuery().data ?? { google: false, telegramBot: null };
}

export type SocialProvider = "discord" | "google";

// Better Auth redirects the browser to the provider once the state cookie is set.
export function useLoginMutation() {
  return useMutation({
    mutationFn: (input: { provider: SocialProvider; returnTo: string }) =>
      authClient.signIn.social({
        provider: input.provider,
        callbackURL: input.returnTo,
        errorCallbackURL: input.returnTo,
      }),
  });
}

export function useTelegramLoginMutation() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: async (payload: unknown) => {
      const res = await authClient.$fetch("/telegram/sign-in", {
        method: "POST",
        body: payload,
      });
      if (!res.error) return;
      const detail = readApiError(res.error);
      throw new CodedError(
        detail.code ?? "ERRORS.TELEGRAM_AUTH_INVALID",
        detail.params,
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth() });
      router.refresh();
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: () => authClient.signOut(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth() });
      router.refresh();
    },
  });
}
