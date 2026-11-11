"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// False while hydrating server HTML, true on every later render and on client navigations.
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
