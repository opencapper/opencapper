import { app } from "@/app/api/[[...route]]/route";
import { queryKeys } from "@/lib/react-query/keys";
import { handleElysia } from "@/lib/utils/base";
import { serverRequestHeaders } from "@/lib/utils/server";
import { getAuthUser } from "@/server/auth/auth";
import { getAuthProviders } from "@/server/auth/providers";
import { treaty } from "@elysiajs/eden";
import type { QueryClient, QueryKey } from "@tanstack/react-query";
import { headers } from "next/headers";
import { cache } from "react";

// Same routes and response decoding as the browser's `rpc`, without a loopback HTTP hop.
export const serverRpc = treaty(app);

type RequestHeaders = Awaited<ReturnType<typeof serverRequestHeaders>>;

// Resolves to the prefetched data, or undefined when the call failed.
export function prefetchElysia<T>(
  qc: QueryClient,
  queryKey: QueryKey,
  call: (
    headers: RequestHeaders,
  ) => Promise<{ data: T | null; error: unknown }>,
): Promise<T | undefined> {
  // query() throws where prefetchQuery swallows; a failed prefetch stays a cache miss, not a crashed render.
  return qc
    .query({
      queryKey,
      queryFn: async () =>
        handleElysia(await call(await serverRequestHeaders())),
    })
    .catch(() => undefined);
}

// An explicit null marks a definite guest; an absent entry means not yet fetched.
export const prefetchAuth = cache(async (qc: QueryClient) => {
  const requestHeaders = await headers();
  const auth = await getAuthUser(requestHeaders).catch(() => null);
  qc.setQueryData(queryKeys.auth(), auth);
  qc.setQueryData(queryKeys.authProviders(), getAuthProviders());
  return auth;
});
