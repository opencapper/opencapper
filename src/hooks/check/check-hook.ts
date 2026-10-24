"use client";

import { useElysiaQuery } from "@/lib/react-query/hooks";
import { queryKeys } from "@/lib/react-query/keys";
import { rpc } from "@/lib/rpc";

export function useCapperCheckQuery(q: string) {
  return useElysiaQuery(
    queryKeys.capperCheck(q),
    () => rpc.api.check.get({ query: { q } }),
    { enabled: q.length > 0, retry: false },
  );
}
