import { queryKeys } from "@/lib/react-query/keys";
import { getAuthUser } from "@/server/auth/auth";
import { getAuthProviders } from "@/server/auth/providers";
import type { QueryClient } from "@tanstack/react-query";
import { headers } from "next/headers";
import { cache } from "react";

// An explicit null marks a definite guest; an absent entry means not yet fetched.
export const prefetchAuth = cache(async (qc: QueryClient) => {
  const requestHeaders = await headers();
  const auth = await getAuthUser(requestHeaders).catch(() => null);
  qc.setQueryData(queryKeys.auth(), auth);
  qc.setQueryData(queryKeys.authProviders(), getAuthProviders());
  return auth;
});
