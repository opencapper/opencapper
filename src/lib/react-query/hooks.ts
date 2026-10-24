"use client";

import { handleElysia } from "@/lib/utils/base";
import {
  useQuery,
  type QueryKey,
  type UseQueryOptions,
} from "@tanstack/react-query";

export function useElysiaQuery<T, TSelected = T>(
  queryKey: QueryKey,
  call: () => Promise<{ data: T | null; error: unknown }>,
  options?: Omit<UseQueryOptions<T, Error, TSelected>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey,
    queryFn: async () => handleElysia(await call()),
    ...options,
  });
}
