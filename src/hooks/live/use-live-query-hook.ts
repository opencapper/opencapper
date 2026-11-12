"use client";

import type { ServerMessage } from "@/lib/api/client";
import {
  liveSocket,
  type LiveFilters,
  type LiveStatus,
} from "@/lib/live/socket";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useEffect,
  useEffectEvent,
  useState,
  useSyncExternalStore,
} from "react";

const FALLBACK_MS = 20_000;

function subscribeStatus(listener: () => void) {
  return liveSocket().onStatus(listener);
}

export function useLiveStatus(): LiveStatus {
  return useSyncExternalStore(
    subscribeStatus,
    () => liveSocket().status,
    () => "connecting",
  );
}

// Relative times keep moving between pushes.
export function useNow(initial: number): number {
  const state = useState(initial);
  const setNow = state[1];
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(id);
  }, [setNow]);
  return state[0];
}

// Server rendered data seeds the cache, socket diffs patch it, polling only while the socket is down.
export function useLiveQuery<T>(opts: {
  queryKey: readonly unknown[];
  initialData: T | null;
  fetch: () => Promise<T | null>;
  topic: string;
  filters?: LiveFilters;
  apply: (prev: T | null, frames: ServerMessage[]) => T | null;
  reloadWhen?: (prev: T | null, frames: ServerMessage[]) => boolean;
}): { data: T | null; status: LiveStatus } {
  const status = useLiveStatus();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: opts.queryKey,
    queryFn: opts.fetch,
    initialData: opts.initialData ?? undefined,
    staleTime: Infinity,
    refetchInterval: status === "live" ? false : FALLBACK_MS,
  });

  const filters = opts.filters ?? {};
  const filterKey = JSON.stringify(filters);
  const currentFilters = useEffectEvent(() => filters);
  const onFrames = useEffectEvent((frames: ServerMessage[]) => {
    const prev = queryClient.getQueryData<T | null>(opts.queryKey) ?? null;
    queryClient.setQueryData<T | null>(opts.queryKey, opts.apply(prev, frames));
    if (opts.reloadWhen?.(prev, frames))
      void queryClient.invalidateQueries({ queryKey: opts.queryKey });
  });

  useEffect(
    () =>
      liveSocket().subscribe(opts.topic, currentFilters(), (frames) =>
        onFrames(frames),
      ),
    [opts.topic, filterKey],
  );

  return { data: query.data ?? null, status };
}
