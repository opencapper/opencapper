"use client";

import type { AdminUsersQuery } from "@/lib/api/typebox/admin";
import { authClient } from "@/lib/auth-client";
import { msg } from "@/lib/config/constants";
import type { AuthRole } from "@/lib/config/permissions";
import { useElysiaQuery } from "@/lib/react-query/hooks";
import { queryKeys } from "@/lib/react-query/keys";
import { rpc } from "@/lib/rpc";
import { CodedError, readApiError } from "@/lib/utils/api-error";
import { handleElysia } from "@/lib/utils/base";
import {
  keepPreviousData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

const SYSTEM_REFRESH_MS = 30_000;

export function useAdminUsersQuery(query: AdminUsersQuery) {
  return useElysiaQuery(
    queryKeys.adminUsers(query),
    () => rpc.api.admin.users.get({ query }),
    { placeholderData: keepPreviousData },
  );
}

export function useAdminImportsQuery(enabled: boolean) {
  return useElysiaQuery(
    queryKeys.adminImports(),
    () => rpc.api.admin.imports.get(),
    { enabled },
  );
}

export function useAdminPicksQuery(enabled: boolean) {
  return useElysiaQuery(
    queryKeys.adminPicks(),
    () => rpc.api.admin.picks.get(),
    { enabled },
  );
}

export function useAdminSystemQuery(enabled: boolean) {
  return useElysiaQuery(
    queryKeys.adminSystem(),
    () => rpc.api.admin.system.get(),
    { enabled, refetchInterval: SYSTEM_REFRESH_MS },
  );
}

// Better Auth resolves errors instead of throwing; our hooks send an ERRORS code, its own checks only a message.
function throwAuthError(error: unknown): never {
  const detail = readApiError(error);
  if (detail.code) throw new CodedError(detail.code, detail.params);
  throw new Error(detail.message ?? msg("ERRORS.UNEXPECTED_ERROR"));
}

function useUserAdminMutation<TInput>(
  run: (input: TInput) => Promise<{ error: unknown }>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: TInput) => {
      const res = await run(input);
      if (res.error) throwAuthError(res.error);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUsersAll() }),
  });
}

export function useSetRoleMutation() {
  return useUserAdminMutation((input: { userId: string; role: AuthRole }) =>
    authClient.admin.setRole({ userId: input.userId, role: input.role }),
  );
}

export function useBanUserMutation() {
  return useUserAdminMutation((input: { userId: string; reason: string }) =>
    authClient.admin.banUser({
      userId: input.userId,
      banReason: input.reason || undefined,
    }),
  );
}

export function useUnbanUserMutation() {
  return useUserAdminMutation((input: { userId: string }) =>
    authClient.admin.unbanUser({ userId: input.userId }),
  );
}

function useImportsMutation<TInput, TOutput>(
  run: (input: TInput) => Promise<{ data: TOutput | null; error: unknown }>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: TInput) => handleElysia(await run(input)),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.adminImports() }),
  });
}

export function useAdminHideProfileMutation() {
  return useImportsMutation((input: { id: number; hidden: boolean }) =>
    input.hidden
      ? rpc.api.admin.imports({ id: input.id }).hide.post()
      : rpc.api.admin.imports({ id: input.id }).unhide.post(),
  );
}

export function useAdminApproveClaimMutation() {
  return useImportsMutation((input: { id: number; claimant: string }) =>
    rpc.api.admin
      .imports({ id: input.id })
      .claim.post({ claimant: input.claimant }),
  );
}

export function useAdminRevokeClaimMutation() {
  return useImportsMutation((input: { id: number }) =>
    rpc.api.admin.imports({ id: input.id })["revoke-claim"].post(),
  );
}
